'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { authenticate, type AuthState } from '@/app/auth/actions';

type Mode = 'sign-in' | 'sign-up' | 'forgot' | 'reset';
export function AuthForm({ mode, next = '/', configured }: { mode: Mode; next?: string; configured: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {});
  const titles = { 'sign-in': 'Welcome back.', 'sign-up': 'Make every visit count.', forgot: 'Forgot your password?', reset: 'Choose a new password.' };
  const labels = { 'sign-in': 'Sign in', 'sign-up': 'Create account', forgot: 'Send reset link', reset: 'Update password' };
  return <main className="auth-shell"><section className="auth-card">
    <Link href="/sign-in" className="brand">✳ stamply.</Link>
    <p className="eyebrow">A LITTLE MORE LOYALTY</p>
    <h1>{titles[mode]}</h1>
    <p className="muted">{mode === 'sign-up' ? 'Create your business owner account to start your loyalty program.' : mode === 'sign-in' ? 'Sign in to your business workspace.' : mode === 'forgot' ? 'We will email you a link to reset your password.' : 'Use at least 8 characters for your new password.'}</p>
    {!configured && <p className="error" role="alert">Account access is not configured yet. The administrator needs to complete the Supabase setup.</p>}
    <form action={action}>
      <input type="hidden" name="mode" value={mode}/><input type="hidden" name="next" value={next}/>
      {mode === 'sign-up' && <label>Your name<input name="name" autoComplete="name" maxLength={80} required/></label>}
      {mode !== 'reset' && <label>Email address<input type="email" name="email" autoComplete="email" maxLength={254} required/></label>}
      {mode !== 'forgot' && <label>Password<input type="password" name="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={8} maxLength={128} required/></label>}
      {(mode === 'sign-up' || mode === 'reset') && <label>Confirm password<input type="password" name="confirmPassword" autoComplete="new-password" minLength={8} maxLength={128} required/></label>}
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.message && <p className="auth-message" role="status">{state.message}</p>}
      <button className="primary wide" disabled={pending || !configured}>{pending ? 'Please wait…' : labels[mode]}</button>
    </form>
    <div className="auth-links">
      {mode === 'sign-in' ? <><Link href={'/sign-up?next=' + encodeURIComponent(next)}>Create an account</Link><Link href="/forgot-password">Forgot password?</Link></> : <Link href={'/sign-in?next=' + encodeURIComponent(next)}>Back to sign in</Link>}
    </div>
  </section></main>;
}
