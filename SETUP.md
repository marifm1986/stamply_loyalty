# Stamply setup: Next.js + Supabase

The app now runs on Next.js with Supabase Auth and PostgreSQL. Vercel builds
with npm run build and serves .next. The old Sites identity gateway and D1
binding are no longer used by app/ or db/.

## 1. Create and configure Supabase

Create a Supabase project. In its SQL Editor, run
supabase/migrations/202611080001_workspace.sql once against the new database.
Alternatively, link the Supabase CLI to your project and use supabase db push.

The migration creates shops, members, events, row-level security policies,
and mutate_workspace. Owners can read only their own data. Direct writes are
denied; the mutation function derives the owner from the verified JWT and
performs changes, event logging, and retry recording in one transaction.

Do not apply the legacy SQLite migrations in drizzle/ to PostgreSQL.
db/schema.ts is a reference for tooling; the Supabase SQL migration is the
authoritative schema, including permissions and stored functions. Do not use
drizzle-kit push against production.

## 2. Environment variables

Copy .env.example to .env.local and fill in:

- NEXT_PUBLIC_SUPABASE_URL: project URL from Supabase.
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: the project's publishable key.
- NEXT_PUBLIC_SITE_URL: http://localhost:3000 locally, or your exact HTTPS
  Vercel/custom-domain origin in production, without a trailing slash.

Add the same three variables to Vercel's project Environment Variables before
building. Public variables are embedded at build time; redeploy after changing
them. Use a separate Supabase project for development when possible.

The application does not need a service-role key or database password.
Never expose a service-role key through NEXT_PUBLIC_ variables.

## 3. Authentication and email

In Supabase Authentication settings:

1. Enable the Email provider and Confirm email.
2. Set Site URL to the same origin as NEXT_PUBLIC_SITE_URL.
3. Allow these Redirect URLs for each environment you use:
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/callback?next=/reset-password
   https://YOUR_DOMAIN/auth/callback
   https://YOUR_DOMAIN/auth/callback?next=/reset-password
4. Configure custom SMTP for delivery to your users. Supabase's built-in mail
   service is intended for limited testing; do not assume it can email arbitrary
   new users.
5. Use the following links in the Confirm signup and Reset password email
   templates. These token-hash links work when an email is opened in a different
   browser. The Site URL must point to the environment receiving the email.

Confirm signup link:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm email</a>
```

Reset password link:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset password</a>
```

The app also supports Supabase's default PKCE code callbacks at /auth/callback.
Those callbacks require the browser that initiated the flow.

Account pages are /sign-in, /sign-up, /forgot-password, and /reset-password.
The dashboard at / requires a verified session. Card/join query parameters
survive the redirect to sign-in. Sign out is in the dashboard header.
Only business owners create accounts; customers remain loyalty-card records.

## 4. Run and verify

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a production build:

```sh
npm run build
npm run start
```

Run npm test for embedded PostgreSQL tests of the actual migration, RLS,
cross-business access, retries, full cards, redemption, and transaction rollback,
plus safe return URL tests. No external database is needed for these tests.

Before launch, test with two real accounts: sign up, confirm email, sign in,
create programs, enroll customers, stamp, redeem, sign out, reset a password,
and confirm neither owner can see the other's records. Live email/session
flows require the configured Supabase project and SMTP; local SQL tests do not
verify those external services.

## Existing D1 data

This migration creates a new empty database. It does not import or delete D1
data, and it preserves local .wrangler state and legacy source tooling.

If you have existing records, back up/export D1 first. Create and verify the
corresponding Supabase owner accounts, then map each old Sites owner ID to the
new auth.users UUID. Import shops first, then members, then events using a
trusted administrative connection. Preserve member and event UUIDs; replace
owner IDs in every table. Normalize timestamps and resolve duplicate owner/phone
pairs before importing. Verify row counts and balances before switching traffic.
Do not infer owner mappings from unverified client input.

## Operational notes and current boundaries

Use one stable production origin for auth emails. Vercel preview URLs need their
own configured redirect URLs and environment settings to test authentication.

Mutation retries reuse a request UUID while the dashboard remains mounted.
PostgreSQL serializes writes per business and records successful request IDs.
Do not prune workspace_requests until your intended retry retention period has
passed. Separate intentional purchases must use separate request IDs.

The workspace currently fetches up to 500 recent activity events. Its activity
analytics reflect that window. QR enrollment and card links still require the
business owner's account. Public customer enrollment, customer accounts, staff
roles, wallet passes, billing, and notifications remain future work.

Legacy Cloudflare/Vite scripts and their development dependencies remain in the
repository for historical reference, but npm dev/build/start use Next.js only.
Do not deploy the old Worker expecting it to run the new Supabase application.
