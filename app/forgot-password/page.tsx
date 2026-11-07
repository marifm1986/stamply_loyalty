import { AuthForm } from '@/components/auth-form';
import { isSupabaseConfigured } from '@/lib/supabase/config';
export default function Page() { return <AuthForm mode="forgot" configured={isSupabaseConfigured()}/>; }
