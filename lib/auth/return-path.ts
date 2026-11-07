export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  try {
    const url = new URL(value, 'https://stamply.local');
    if (url.origin !== 'https://stamply.local') return '/';
    if (/^\/(auth|sign-in|sign-up|forgot-password|reset-password)(\/|$)/.test(url.pathname)) return '/';
    return url.pathname + url.search;
  } catch { return '/'; }
}
