import Link from 'next/link';
export default function Page() {
  return <main className="auth-shell"><section className="auth-card"><h1>This link could not be verified.</h1><p className="muted">It may have expired or already been used. Sign in if your account is confirmed, or request a new password reset email.</p><div className="auth-links"><Link href="/sign-in">Sign in</Link><Link href="/forgot-password">Reset password</Link></div></section></main>;
}
