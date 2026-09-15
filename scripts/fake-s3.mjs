#!/usr/bin/env node
/**
 * A minimal S3-compatible server for end-to-end testing of the media pipeline.
 *
 * This is NOT a general S3 implementation and is never used in production. It
 * exists so the upload path can be exercised for real — presign, PUT, HEAD,
 * GET — without AWS credentials, and so the one thing that actually matters
 * about a presigned upload can be asserted:
 *
 *   **it re-verifies the SigV4 signature.**
 *
 * On a PUT it rebuilds the canonical request from the URL and the incoming
 * `Content-Type` header and recomputes the signature with the same secret. If
 * the client sends a Content-Type other than the one the URL was signed for,
 * the signatures differ and it answers 403 SignatureDoesNotMatch — exactly as
 * S3 does. That is what makes the test meaningful rather than decorative.
 *
 * Usage: node scripts/fake-s3.mjs [port] [storageDir]
 */
import { createServer } from "node:http";
import { createHmac, createHash } from "node:crypto";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.argv[2] || 4566);
const ROOT = process.argv[3] || "/tmp/fake-s3";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || "TESTACCESSKEY";
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || "TESTSECRETKEY";
const REGION = process.env.S3_REGION || "ap-south-1";

const hmac = (key, data) => createHmac("sha256", key).update(data, "utf8").digest();
const sha256hex = (data) => createHash("sha256").update(data, "utf8").digest("hex");

function signingKey(date) {
  return hmac(hmac(hmac(hmac(`AWS4${SECRET_KEY}`, date), REGION), "s3"), "aws4_request");
}

/** Recompute the presigned-PUT signature exactly as SigV4 specifies. */
function expectedSignature(req, url) {
  const q = url.searchParams;
  const signedHeaders = (q.get("X-Amz-SignedHeaders") || "host").split(";");
  const credential = q.get("X-Amz-Credential") || "";
  const amzDate = q.get("X-Amz-Date") || "";
  const date = amzDate.slice(0, 8);

  // Every X-Amz-* query param except the signature itself takes part, sorted.
  const canonicalQuery = [...q.entries()]
    .filter(([k]) => k !== "X-Amz-Signature")
    .map(([k, v]) => [encodeRfc3986(k), encodeRfc3986(v)])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  // Read whatever the URL says was signed straight off the request, so adding
  // a signed header to the app never silently stops being verified here.
  const canonicalHeaders = signedHeaders
    .map((h) => `${h}:${String(req.headers[h] ?? "").trim()}\n`)
    .join("");

  const canonicalRequest = [
    req.method,
    url.pathname.split("/").map((s) => encodeRfc3986(decodeURIComponent(s))).join("/"),
    canonicalQuery,
    canonicalHeaders,
    signedHeaders.join(";"),
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const scope = credential.split("/").slice(1).join("/");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256hex(canonicalRequest),
  ].join("\n");

  return createHmac("sha256", signingKey(date)).update(stringToSign, "utf8").digest("hex");
}

function encodeRfc3986(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function s3Error(res, status, code, message) {
  res.writeHead(status, { "Content-Type": "application/xml" });
  res.end(`<?xml version="1.0"?><Error><Code>${code}</Code><Message>${message}</Message></Error>`);
}

/** Objects are stored flat, keyed by a hash, with their metadata alongside. */
const objectPath = (key) => path.join(ROOT, createHash("sha1").update(key).digest("hex"));

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // Path-style: /<bucket>/<key...>
  const segments = url.pathname.replace(/^\//, "").split("/");
  const key = segments.slice(1).map(decodeURIComponent).join("/");

  // Browsers preflight a cross-origin PUT that carries Content-Type.
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": req.headers.origin || "*",
      "Access-Control-Allow-Methods": "GET,PUT,HEAD",
      // Both signed headers must be allowed here or the browser refuses to
      // send the PUT at all — this is the single most common cause of a
      // "works with curl, fails in the CMS" upload.
      "Access-Control-Allow-Headers": "content-type,cache-control",
      "Access-Control-Max-Age": "3000",
    });
    return res.end();
  }

  if (req.method === "PUT") {
    const provided = url.searchParams.get("X-Amz-Signature");
    if (!provided) return s3Error(res, 403, "AccessDenied", "Unsigned request.");

    if (url.searchParams.get("X-Amz-Credential")?.split("/")[0] !== ACCESS_KEY) {
      return s3Error(res, 403, "InvalidAccessKeyId", "Unknown access key.");
    }

    const expected = expectedSignature(req, url);
    if (expected !== provided) {
      return s3Error(
        res,
        403,
        "SignatureDoesNotMatch",
        "The request signature does not match the signature the server calculated."
      );
    }

    const expiresIn = Number(url.searchParams.get("X-Amz-Expires") || "0");
    const signedAt = url.searchParams.get("X-Amz-Date") || "";
    const signedMs = Date.parse(
      `${signedAt.slice(0, 4)}-${signedAt.slice(4, 6)}-${signedAt.slice(6, 8)}T` +
        `${signedAt.slice(9, 11)}:${signedAt.slice(11, 13)}:${signedAt.slice(13, 15)}Z`
    );
    if (Number.isFinite(signedMs) && Date.now() > signedMs + expiresIn * 1000) {
      return s3Error(res, 403, "ExpiredToken", "The presigned URL has expired.");
    }

    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);

    await mkdir(ROOT, { recursive: true });
    const p = objectPath(key);
    await writeFile(p, body);
    await writeFile(
      `${p}.meta.json`,
      JSON.stringify({
        key,
        contentType: req.headers["content-type"] || "application/octet-stream",
        cacheControl: req.headers["cache-control"] || null,
        size: body.length,
      })
    );

    res.writeHead(200, {
      ETag: `"${createHash("md5").update(body).digest("hex")}"`,
      "Access-Control-Allow-Origin": req.headers.origin || "*",
    });
    return res.end();
  }

  if (req.method === "HEAD" || req.method === "GET") {
    const p = objectPath(key);
    try {
      const meta = JSON.parse(await readFile(`${p}.meta.json`, "utf8"));
      const { size } = await stat(p);
      const headers = {
        "Content-Type": meta.contentType,
        "Content-Length": String(size),
        "Access-Control-Allow-Origin": "*",
        ...(meta.cacheControl ? { "Cache-Control": meta.cacheControl } : {}),
      };
      if (req.method === "HEAD") {
        res.writeHead(200, headers);
        return res.end();
      }
      res.writeHead(200, headers);
      return res.end(await readFile(p));
    } catch {
      return s3Error(res, 404, "NoSuchKey", "The specified key does not exist.");
    }
  }

  return s3Error(res, 405, "MethodNotAllowed", `${req.method} is not supported.`);
});

server.listen(PORT, () => {
  console.log(`fake-s3 listening on http://127.0.0.1:${PORT} (storage: ${ROOT})`);
});
