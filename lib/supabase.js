// lib/supabase.js
// Cliente oficial do Supabase para Serverless Functions da Vercel
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://akuszjzdvafmtnrbckto.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_ANON_KEY 
  || process.env.SUPABASE_KEY 
  || process.env.SB_ANON_KEY 
  || process.env.SB_KEY 
  || process.env.ANON_KEY 
  || '';

let supabaseInstance = null;

function getSupabaseClient() {
  if (!SUPABASE_KEY) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return supabaseInstance;
}

function isSupabaseConfigured() {
  return Boolean(SUPABASE_KEY && SUPABASE_KEY.length > 10);
}

module.exports = {
  getSupabaseClient,
  isSupabaseConfigured,
  SUPABASE_URL
};
