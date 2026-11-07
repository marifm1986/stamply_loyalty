# Stamply source code — developer handoff

This is the complete source of the published private pilot, including the React/TypeScript UI, server API, QR generation, camera QR detection, D1 database schema, migration, dependency lockfile, and build scripts. Third-party dependencies and generated builds are excluded; install them with npm ci.

## Requirements
Node.js 22.13 or later, npm, and a Cloudflare Workers-compatible runtime for the backend and D1. This is a Vinext application using Next.js-compatible APIs, React 19, and Cloudflare D1.

## Install and build
From this folder:

```sh
npm ci
npm run build
npx tsc --noEmit
```

## Initialize the local database
Build first to generate dist/server/wrangler.json, then run once against a new local database:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_ambitious_komodo.sql
npm run start
```

Open the local URL printed by Wrangler. Use `npm run dev` for UI iteration; production-preview mode above is the documented path for the persisted local database.

## Authentication: read before testing writes
Hosted Sites supplies validated `oai-authenticated-user-id` and `oai-authenticated-user-email` headers. Local browsers do not receive those headers automatically, so the UI loads but data endpoints return 401 without a local identity gateway. For local API tests only, send those headers explicitly to localhost using an HTTP client. Never allow untrusted clients to supply identity headers on a publicly reachable deployment. When self-hosting outside Sites, replace app/chatgpt-auth.ts with a trusted server-side authentication integration before exposing the application.

## Deployment
.openai/hosting.json identifies the existing private Site and declares its DB binding. It is metadata, not a secret. Preserve its identity for updates to that Site; register a new Site and replace the project ID for an independent deployment. Outside Sites, provision D1, apply the SQL migration, configure the DB binding, and supply trusted authentication. The hosting platform does not transfer with this ZIP.

## Main files
- app/page.tsx: dashboard, program setup, customer list, QR scan and card dialogs
- app/globals.css: responsive design
- app/api/data/route.ts: authenticated reads, enrollment, settings, stamps and redemption
- app/chatgpt-auth.ts: platform identity integration
- db/schema.ts: program, customer and event schema
- drizzle/: initial SQL migration and Drizzle metadata
- package.json and package-lock.json: scripts and reproducible dependency versions
- scripts/, vite.config.ts and worker/: runtime and build integration

## Current functionality and boundaries
Real QR codes, staff-confirmed stamps, rewards, saved records and dashboard are implemented. Customer QR codes identify cards; they do not authorize stamps. Enrollment and card links currently require private owner access. Camera decoding uses browser BarcodeDetector with manual phone/link fallback. Apple Wallet / Google Wallet passes, notifications, billing, public enrollment, independent customer login, and staff roles are not implemented.

Before commercial launch, add transaction idempotency and fully atomic event accounting, staff permissions, public customer access and verification, subscription billing, consent records and deletion/export policies, and device-level camera tests. Do not present this pilot as a finished production SaaS.

## Validation already performed
Production build and TypeScript passed. Database SQL checks covered owner isolation, full-card limits, redemption eligibility and duplicate-redemption protection. Dashboard and enrollment QR were visually inspected. Authenticated browser transactions and phone-camera scanning were not verified end to end.
