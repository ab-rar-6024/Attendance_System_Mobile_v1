const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Client Configuration
 * Required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL or Anon Key is missing. Storage features will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
