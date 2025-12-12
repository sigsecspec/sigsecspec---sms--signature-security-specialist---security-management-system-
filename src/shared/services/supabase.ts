
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mqvxaxcjvvkqfblddtkq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xdnhheGNqdnZrcWZibGRkdGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjY4NDgsImV4cCI6MjA3Nzk0Mjg0OH0.R3xAR864O8z5r09hKJjr27zZPuoZpWEMcBNmZtJ3T2o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'site',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
