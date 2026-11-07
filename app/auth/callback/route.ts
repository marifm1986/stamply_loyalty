import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { safeReturnPath } from '@/lib/auth/return-path';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  // Recovery is the only auth page that may be a callback destination.
  const rawNext = request.nextUrl.searchParams.get('next');
  const next = rawNext === '/reset-password' ? rawNext : safeReturnPath(rawNext);
  if (isSupabaseConfigured() && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url), { headers: { 'Cache-Control': 'private, no-store' } });
  }
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
