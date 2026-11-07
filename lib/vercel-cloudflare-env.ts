// Vercel cannot supply a Cloudflare Worker D1 binding. Keep it absent so
// API handlers report unavailability instead of trying to use a fake database.
export const env: { DB?: D1Database } = {};
