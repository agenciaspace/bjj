import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseApiKey = import.meta.env.VITE_SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseApiKey) {
    console.warn('Missing Supabase environment variables. Cloud sync will be disabled.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseApiKey || 'placeholder'
);
