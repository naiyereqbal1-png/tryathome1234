import { createClient } from "@supabase/supabase-js";

// Typecast import.meta as any to bypass Vite environment compiler checks
const meta = import.meta as any;

const supabaseUrl =
  (typeof import.meta !== "undefined" && meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
  "https://zelxvhqqcqxsqjctgrto.supabase.co";

const supabaseKey =
  (typeof import.meta !== "undefined" && meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_ANON_KEY) ||
  "sb_publishable_oQe42p0raRGgikzWI-6ukw_A_mupsVK";

if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
  console.warn("Supabase credentials are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const createSupabaseClient = () => supabase;
