// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ekqskiztmpipjzmikkct.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcXNraXp0bXBpcGp6bWlra2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NjY3MDIsImV4cCI6MjA1NTU0MjcwMn0.4E5-vzPdXoCWxyu_ugdREBBELsWYoF_kUQLa_n3LD08";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);