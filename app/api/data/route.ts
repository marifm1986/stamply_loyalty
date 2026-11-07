import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';
const text = (max: number) => z.string().trim().min(1).max(max);
const mutation = z.discriminatedUnion('action', [
  z.object({ action: z.literal('settings'), name: text(80), reward: text(120), goal: z.number().int().min(2).max(30), requestId: z.string().uuid() }),
  z.object({ action: z.literal('enroll'), name: text(80), phone: text(30), requestId: z.string().uuid() }),
  z.object({ action: z.literal('stamp'), id: z.string().uuid(), requestId: z.string().uuid() }),
  z.object({ action: z.literal('redeem'), id: z.string().uuid(), requestId: z.string().uuid() }),
]);
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
async function context() {
  if (!isSupabaseConfigured()) return { response: json({ error: 'Supabase is not configured. See SETUP.md.' }, 503) };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { response: json({ error: 'Sign in to access your business.' }, 401) };
  return { supabase, user: data.user };
}
async function workspace(supabase: Awaited<ReturnType<typeof createClient>>, owner: string) {
  // Supabase caps each response at 1,000 rows by default. Page through the
  // member list so an established business never silently loses customers.
  async function allMembers() {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 500) {
      const page = await supabase.from('members').select('*').eq('owner', owner)
        .order('last', { ascending: false }).order('id').range(offset, offset + 499);
      if (page.error) return { data: null, error: page.error };
      rows.push(...page.data);
      if (page.data.length < 500) return { data: rows, error: null };
    }
  }
  const [shop, members, events] = await Promise.all([
    supabase.from('shops').select('*').eq('owner', owner).maybeSingle(),
    allMembers(),
    supabase.from('events').select('*').eq('owner', owner).order('at', { ascending: false }).limit(500),
  ]);
  if (shop.error || members.error || events.error) return json({ error: 'Could not load your workspace. Check the database setup and try again.' }, 503);
  return json({ shop: shop.data, members: members.data, events: events.data });
}
export async function GET() {
  const ctx = await context();
  if (ctx.response) return ctx.response;
  return workspace(ctx.supabase, ctx.user.id);
}
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return json({ error: 'Invalid request origin.' }, 403);
  if (Number(request.headers.get('content-length') || 0) > 4096) return json({ error: 'Request too large.' }, 413);
  const ctx = await context();
  if (ctx.response) return ctx.response;
  let raw: unknown;
  try { const body = await request.text(); if (body.length > 4096) return json({ error: 'Request too large.' }, 413); raw = JSON.parse(body); }
  catch { return json({ error: 'Invalid JSON.' }, 400); }
  const parsed = mutation.safeParse(raw);
  if (!parsed.success) return json({ error: 'Check the form values and try again.' }, 400);
  const { requestId, ...payload } = parsed.data;
  const { error } = await ctx.supabase.rpc('mutate_workspace', { payload, request_id: requestId });
  if (error) return json({ error: error.code === 'P0001' ? error.message : 'Could not save your change. Please try again.' }, error.code === 'P0001' ? 400 : 503);
  return workspace(ctx.supabase, ctx.user.id);
}
