require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase environment variables not set. Supabase disabled.");
} else {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase connected");
    } catch (err) {
        console.error("❌ Supabase initialization failed:", err.message);
        supabase = null;
    }
}

module.exports = supabase;
