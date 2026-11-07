import { redirect } from 'next/navigation';
import Dashboard from '@/components/dashboard';
import { getUser } from '@/lib/auth/user';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getUser();
  if (!user) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (typeof value === 'string') params.set(key, value);
    }
    const next = params.size ? '/?' + params.toString() : '/';
    redirect('/sign-in?next=' + encodeURIComponent(next));
  }
  const email = user.email || '';
  const name = typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : email.split('@')[0];
  return <Dashboard user={{ email, name }}/>;
}
