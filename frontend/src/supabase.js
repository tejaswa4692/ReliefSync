import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://cdfpbekupewojgtzrctt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZnBiZWt1cGV3b2pndHpyY3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDE4ODQsImV4cCI6MjA5MjQxNzg4NH0.Vi1mCJi6EePrw-Ggnog3EK39sUhdjGW3EAeUA2NDfbg';

// In a real production app, use import.meta.env.VITE_SUPABASE_URL

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
