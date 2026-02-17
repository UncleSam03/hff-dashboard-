import { createClient } from "@supabase/supabase-js";

import { getEnv } from "./env.js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Resilient configuration check
const isConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "YOUR_SUPABASE_URL" &&
    supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY";

let supabase = null;

if (isConfigured) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase, isConfigured };
