import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tufepmuglmezhnehezyg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0p4bFKgwQFPOG2HdBUmkOg__XnsDoKH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
