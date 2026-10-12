// api/supabase.js
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

// Handler de status para Vercel Serverless Function
async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.json({
    sucesso: true,
    conectado: isSupabaseConfigured(),
    url: SUPABASE_URL
  });
}

handler.getSupabaseClient = getSupabaseClient;
handler.isSupabaseConfigured = isSupabaseConfigured;
handler.SUPABASE_URL = SUPABASE_URL;

module.exports = handler;
module.exports.getSupabaseClient = getSupabaseClient;
module.exports.isSupabaseConfigured = isSupabaseConfigured;
module.exports.SUPABASE_URL = SUPABASE_URL;
