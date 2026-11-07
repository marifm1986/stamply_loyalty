# Stamply

A merchant loyalty workspace built with Next.js, Supabase Auth, and Supabase
PostgreSQL, deployed on Vercel.

Business owners can sign up, confirm their email, sign in, recover passwords,
configure a program, enroll customers, scan QR cards, award stamps, and redeem
rewards. PostgreSQL policies isolate each business. Stamp changes and activity
events are transactional and protected against retries with the same request ID.

See SETUP.md for Supabase SQL, environment variables, email configuration,
Vercel deployment, validation, and migrating existing D1 data.

## Local development

Copy .env.example to .env.local and configure your Supabase project first.

```sh
npm ci
npm run dev
```

npm run build creates the production Next.js build.
npm run start serves it. npm test runs local PostgreSQL and redirect tests.

## Current boundaries

Accounts are for business owners. Customer card and enrollment links require
owner access. Public enrollment, customer accounts, staff invitations, billing,
wallet passes, and messaging are not implemented. Camera QR decoding depends
on browser BarcodeDetector support; phone/card-link lookup is available.
