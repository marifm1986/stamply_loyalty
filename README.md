# Stamply — private working pilot

QR loyalty workspace based on the supplied video. Includes merchant program configuration, customer registration, real enrollment/card QR codes, camera scanning with BarcodeDetector when supported, phone/card-link fallback, stamp confirmation, reward redemption, persistent D1 records, overview and activity log.

## Current boundaries
Private owner access through Sites / ChatGPT identity. Enrollment QR and customer card links currently open the owner's workspace. No public customer portal, staff invitations, billing, Apple or Google Wallet signing, messaging, or production marketing consent service. Camera QR decoding requires browser BarcodeDetector support (fallback lookup is available).

Each signed-in owner has an isolated program. All data operations verify identity server-side; owner filtering applies to reads and writes. Customers cannot self-award a stamp. Goal changes are locked once customers exist. Records start empty; no fabricated analytics.

Before commercial release: add scoped staff memberships, public enrollment with verification and abuse controls, customer-owned access, atomic idempotent event processing, billing, wallet credentials and pass update service, consent records, retention/export/delete policies, and platform-specific scanner testing.

## Run
Install dependencies, run npm run db:generate after schema edits, and build through Sites. Apply generated migrations locally before preview. Production migrations are applied by Sites during publication.
