import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getUser } from '@/lib/auth/user';
export const dynamic = 'force-dynamic';
export default async function Page() {
  if (!await getUser()) redirect('/forgot-password');
  return <AuthForm mode="reset" configured/>;
}
