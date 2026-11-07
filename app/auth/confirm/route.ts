import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (isSupabaseConfigured() && token_hash && (type === 'email' || type === 'recovery')) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) return NextResponse.redirect(new URL(type === 'recovery' ? '/reset-password' : '/', request.url), { headers: { 'Cache-Control': 'private, no-store' } });
  }
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
