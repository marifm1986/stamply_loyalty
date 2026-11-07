'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { safeReturnPath } from '@/lib/auth/return-path';

export type AuthState = { error?: string; message?: string };
export async function authenticate(_previous: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: 'Account access is being configured. Please try again later.' };
  const mode = String(form.get('mode'));
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const next = safeReturnPath(String(form.get('next') || '/'));
  const supabase = await createClient();
  if (mode === 'forgot') {
    if (!email || email.length > 254) return { error: 'Enter a valid email address.' };
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) return { error: 'Password recovery is being configured. Please contact the business administrator.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: new URL('/auth/callback?next=/reset-password', siteUrl).href });
    if (error) return { error: 'Could not send a reset email. Please try again later.' };
    return { message: 'If an account exists for this email, you will receive a password reset link.' };
  }
  if (mode === 'reset') {
    if (password.length < 8 || password.length > 128) return { error: 'Use a password between 8 and 128 characters.' };
    if (password !== form.get('confirmPassword')) return { error: 'Passwords do not match.' };
    const { data } = await supabase.auth.getUser();
    if (!data.user) return { error: 'Your reset link has expired. Request another link.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    redirect('/');
  }
  if (!['sign-in', 'sign-up'].includes(mode)) return { error: 'Unknown account action.' };
  if (!email || email.length > 254) return { error: 'Enter a valid email address.' };
  if (password.length < 8 || password.length > 128) return { error: 'Use a password between 8 and 128 characters.' };
  if (mode === 'sign-up') {
    const name = String(form.get('name') || '').trim();
    if (!name || name.length > 80) return { error: 'Enter your name (up to 80 characters).' };
    if (password !== form.get('confirmPassword')) return { error: 'Passwords do not match.' };
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) return { error: 'Email confirmation is being configured. Please try again later.' };
    const { data, error } = await supabase.auth.signUp({ email, password, options: {
      data: { full_name: name },
      emailRedirectTo: new URL('/auth/callback', siteUrl).href,
    } });
    if (error) return { error: error.message };
    if (!data.session) return { message: 'Check your email to confirm your account, then sign in. If you already have an account, use Sign in.' };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Unable to sign in. Check your email and password, and confirm your email first.' };
  }
  redirect(next);
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error('Could not sign out. Please try again.');
  }
  redirect('/sign-in');
}
