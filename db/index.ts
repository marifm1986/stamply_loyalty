// Requests carry the signed-in user's JWT so PostgreSQL row policies apply.
export { createClient as getDb } from '@/lib/supabase/server';
