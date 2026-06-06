import 'dotenv';
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare function createServerClient(): import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare function signIn(email: string, password: string): Promise<{
    session: import("@supabase/auth-js").Session | null;
    user: import("@supabase/auth-js").User | null;
    error: import("@supabase/auth-js").AuthError | null;
}>;
export declare function signUp(email: string, password: string, name?: string): Promise<{
    session: import("@supabase/auth-js").Session | null;
    user: import("@supabase/auth-js").User | null;
    error: import("@supabase/auth-js").AuthError | null;
}>;
export declare function signOut(): Promise<{
    error: import("@supabase/auth-js").AuthError | null;
}>;
export declare function resetPassword(email: string): Promise<{
    data: {};
    error: null;
} | {
    data: null;
    error: import("@supabase/auth-js").AuthError;
}>;
//# sourceMappingURL=supabase.d.ts.map