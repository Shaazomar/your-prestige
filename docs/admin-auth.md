# Admin authentication

## Required before deploy: `ADMIN_PASSKEY`

The admin panel is entered with a single passkey. That passkey used to be the
literal string `your@prestige`, hardcoded in `src/lib/auth.ts` and committed
to this repository. Anyone who could read the source — or who guessed a phrase
printed on the site's own masthead — had full access to the catalogue,
customer orders, enquiry records including names and phone numbers, and the
CMS.

It is now read from the environment:

```bash
ADMIN_PASSKEY="<a long random string>"
```

There is no fallback value. If `ADMIN_PASSKEY` is unset, every sign-in is
refused and a line is written to the server log. That is deliberate: a
missing auth secret should lock the door, not leave a published one in place.

**Set this in the deployment environment before the next deploy, or the admin
panel will be unreachable.** Generate one with:

```bash
openssl rand -base64 32
```

Treat it as a credential: it goes in the hosting provider's environment
settings, never in a committed file. `.env*` is gitignored.

Because the old passkey was public for as long as it was in the repository,
assume it is compromised and do not reuse it. Rotating it is a single
environment-variable change and takes effect on the next deploy; everyone
signed in keeps their session until it expires, so rotate and then tell the
team the new phrase.

## Known limitation: this is a shared credential, not a user account

Fixing the hardcoded value closes the immediate hole but does not make this
real per-user authentication. Everyone shares one passkey, and `authorize()`
then attaches the session to whichever account it happens to find first — the
`SEED_ADMIN_EMAIL` user, else any active `SUPER_ADMIN`/`MANAGER`, else any
active user. The consequences are worth being explicit about:

- **No individual accountability.** `AuditLog` records every action against
  that one resolved account, whoever actually performed it.
- **Deactivating a person does not revoke their access.** They still know the
  shared passkey, and the lookup simply resolves to a different account.
- **The role system is not doing what it looks like it is doing.** `User.role`,
  `permissions.ts`, `rbac.ts` and the admin Permission Matrix are all real and
  enforced *after* sign-in — but since every sign-in lands on the same
  resolved account, everyone gets that account's role. A `STAFF` row in the
  users table does not produce a staff-limited session.
- **`User.password` is unused.** The column holds bcrypt hashes (written by
  `scripts/seed.mjs` and the Users module) that nothing ever verifies.

Moving to per-user sign-in means adding email + password to the credentials
provider and verifying against `User.password`, which already exists and is
already hashed. It changes how the team signs in, so it needs the owner's
decision rather than being done quietly — but until it happens, the role and
audit features should not be relied on for anything that matters.

There is also no rate limiting or lockout on the login form, so the passkey
can be attacked at the speed of the server. A long random value is what
currently makes that impractical.
