# AWS S3 setup for CMS media

Everything the CMS uploads — product photography, brand heroes and videos,
category and collection imagery — goes to one S3 bucket. The app never proxies
the bytes: the browser uploads straight to S3 using a short-lived presigned
URL the server issues. No AWS credential is ever sent to the browser.

This document is the complete list of AWS-side configuration. If uploads fail,
the cause is almost always one of the four sections below, and the error the
CMS shows will say which.

---

## 1. Environment variables

Set these on the deployment (Vercel project settings, or the host's equivalent)
and redeploy. They are read server-side only, except `NEXT_PUBLIC_S3_BUCKET_URL`.

| Variable | Example | Purpose |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | `AKIA…` | IAM user for the app. Server-side only. |
| `AWS_SECRET_ACCESS_KEY` | `…` | Server-side only — never expose this. |
| `S3_BUCKET` | `your-prestige-in` | Bucket name. |
| `S3_REGION` | `ap-south-1` | Bucket region. Must match the bucket exactly. |
| `NEXT_PUBLIC_S3_BUCKET_URL` | `https://your-prestige-in.s3.ap-south-1.amazonaws.com` | Public base URL for reading objects. Point this at CloudFront once a CDN is in front. |
| `S3_ENDPOINT` | *(unset)* | Only for S3-compatible storage or local testing. Leave unset for AWS. |

Two things that bite:

- **The region must be the bucket's real region.** A bucket in `ap-south-1`
  addressed as `us-east-1` returns `AuthorizationHeaderMalformed` or a
  redirect that looks like a signature failure.
- **If you deploy on AWS Amplify or Lambda directly**, the runtime reserves
  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_REGION` and will
  override anything you set. Use an execution role instead — the app falls back
  to the default credential chain when the two key variables are absent — or
  rename the variables and adjust `getS3Client()`. On Vercel the `AWS_*` names
  are fine.

`NEXT_PUBLIC_S3_BUCKET_URL` is also read at **build time** to register the
image host with Next.js's image optimizer. Changing it requires a rebuild, not
just a restart, or images will render broken with a 400 from `/_next/image`.

---

## 2. CORS (`infra/s3-cors.json`)

The browser PUTs directly to the bucket, so the bucket must permit it. Apply:

```bash
aws s3api put-bucket-cors \
  --bucket your-prestige-in \
  --cors-configuration file://infra/s3-cors.json
```

`AllowedHeaders` must list **both** `content-type` and `cache-control`. The
presigned URL signs both headers, so the browser sends both; if either is
missing from the CORS rules the preflight fails and the browser never sends
the upload at all. The CMS reports this as *"The browser could not reach the
storage bucket"* — that message means CORS, essentially always.

`AllowedOrigins` must list the real site origins, including `www` if the site
answers on it. An origin mismatch fails the same way.

Verify:

```bash
aws s3api get-bucket-cors --bucket your-prestige-in
```

---

## 3. IAM permissions (`infra/s3-iam-policy.json`)

The app's IAM user needs `s3:PutObject`, `s3:GetObject` and `s3:DeleteObject`
on `arn:aws:s3:::your-prestige-in/*`. Attach the policy in
`infra/s3-iam-policy.json`.

Insufficient permissions surface as `AccessDenied` on the PUT, which the CMS
reports verbatim along with the permission needed.

Note the app does **not** set an ACL on uploads, so `s3:PutObjectAcl` is not
required and Block Public Access can stay enabled at the account level.

---

## 4. Public read access

Uploaded objects must be publicly readable, because the public site links to
them directly. Choose one:

**a. Bucket policy (simplest).** Apply `infra/s3-bucket-policy.json`:

```bash
aws s3api put-bucket-policy \
  --bucket your-prestige-in \
  --policy file://infra/s3-bucket-policy.json
```

This requires "Block public access → Block public access granted through *any*
bucket policies" to be **off** for this bucket. Leave the ACL-related blocks on.

**b. CloudFront with Origin Access Control (recommended for production).**
Keep the bucket fully private, put CloudFront in front, and set
`NEXT_PUBLIC_S3_BUCKET_URL` to the CloudFront domain. Uploads still go direct
to S3; only reads go through the CDN.

If this step is missed, uploads succeed and images 403 on the website — the
CMS will look like it worked while the site shows placeholders.

---

## 5. Verifying

```bash
# The object really exists and is publicly readable:
curl -I "https://your-prestige-in.s3.ap-south-1.amazonaws.com/products/<id>/<uuid>.jpg"
# Expect: 200, Content-Type: image/jpeg, Cache-Control: public, max-age=31536000, immutable
```

A local end-to-end run against a stand-in for S3 (no AWS account needed):

```bash
node scripts/fake-s3.mjs 4566 /tmp/fake-s3 &
export AWS_ACCESS_KEY_ID=TESTACCESSKEY AWS_SECRET_ACCESS_KEY=TESTSECRETKEY
export S3_BUCKET=your-prestige-in S3_REGION=ap-south-1
export S3_ENDPOINT=http://127.0.0.1:4566
export NEXT_PUBLIC_S3_BUCKET_URL=http://127.0.0.1:4566/your-prestige-in
npm run build && npx next start -p 3040
```

`scripts/fake-s3.mjs` re-verifies the SigV4 signature on every PUT, so it
rejects a mismatched `Content-Type` exactly as S3 does.

---

## How the upload works

1. The CMS asks `POST /api/admin/media/presign` for permission to upload. The
   server checks the session and the `media:create` permission, validates the
   file type, size and extension, and **chooses the object key itself** —
   `products/{productId}/{uuid}.jpg`. The client cannot influence the path.
2. The server returns a presigned PUT URL valid for 15 minutes, along with the
   exact `Content-Type` and `Cache-Control` the browser must send. The
   signature covers both headers, so the URL will not accept a file of a
   different type than the one that was validated.
3. The browser PUTs the bytes straight to S3 with progress reporting.
4. The CMS calls `POST /api/admin/media/complete`. The server does a
   `HeadObject` to confirm the object really landed, then records a `Media` row
   with its real size and stored content type.
5. Saving the record writes the object URL to the product/brand/category, and
   the affected public pages are revalidated so the new image appears at once.

Object keys are uuid-based and never reused, which is why objects are stored
with a one-year immutable cache header: replacing an image always produces a
new URL, so a cached copy can never be stale.
