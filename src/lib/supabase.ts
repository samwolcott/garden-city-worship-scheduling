import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const publishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabaseConfigured = Boolean(url && publishableKey);
let client: SupabaseClient | undefined;

export function getSupabase() {
	if (!supabaseConfigured) throw new Error('Supabase environment variables are not configured.');
	client ??= createClient(url!, publishableKey!);
	return client;
}
