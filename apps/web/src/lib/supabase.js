import { createClient } from '@supabase/supabase-js';
import 'dotenv';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const SUPABASE_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
export function createServerClient() {
    return createClient(SUPABASE_URL, SUPABASE_SVC, { auth: { persistSession: false } });
}
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { session: data.session, user: data.user, error };
}
export async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: name ?? email.split('@')[0] } },
    });
    return { session: data.session, user: data.user, error };
}
export async function signOut() {
    return await supabase.auth.signOut();
}
export async function resetPassword(email) {
    return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });
}
//# sourceMappingURL=supabase.js.map