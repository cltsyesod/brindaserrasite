// api/cervejarias.js
// Endpoint Serverless Vercel: Listagem das Cervejarias Parceiras do Supabase
const { getSupabaseClient, isSupabaseConfigured } = require('./supabase');

const fallbackCervejarias = [
  { id: 1, nome: "Cervejaria Farol", cidade: "Canela", slug: "farol", tour_guiado: true },
  { id: 2, nome: "Cervejaria Gramado Bier", cidade: "Gramado", slug: "gramado-bier", tour_guiado: false },
  { id: 3, nome: "Cervejaria Rasen Bier", cidade: "Gramado", slug: "rasen-bier", tour_guiado: true },
  { id: 4, nome: "Cervejaria Edelbrau", cidade: "Nova Petrópolis", slug: "edelbrau", tour_guiado: true },
  { id: 5, nome: "Cervejaria Kraustin Bier", cidade: "Canela", slug: "kraustin", tour_guiado: false }
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();

  try {
    if (supabase && isSupabaseConfigured()) {
      const { data: cervejarias, error } = await supabase
        .from('cervejarias')
        .select('id, nome, cidade, slug, endereco, telefone, tour_guiado, status')
        .eq('status', 'ativo')
        .order('id', { ascending: true });

      if (!error && cervejarias && cervejarias.length > 0) {
        return res.json({ sucesso: true, cervejarias });
      }
    }

    return res.json({ sucesso: true, cervejarias: fallbackCervejarias });
  } catch (err) {
    return res.json({ sucesso: true, cervejarias: fallbackCervejarias });
  }
};
