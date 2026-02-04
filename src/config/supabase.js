const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Client Configuration
 * Required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.error('❌ CRITICAL: Supabase URL or Anon Key is missing! Photo storage will not work.');
}

module.exports = supabase;
