import { AuthForm } from '@/components/auth-form';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { safeReturnPath } from '@/lib/auth/return-path';
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthForm mode="sign-up" configured={isSupabaseConfigured()} next={safeReturnPath((await searchParams).next)}/>;
}
