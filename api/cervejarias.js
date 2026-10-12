// api/cervejarias.js
// Endpoint Serverless Vercel: Listagem das Cervejarias Parceiras Ativas
const { getSupabaseClient, isSupabaseConfigured } = require('../lib/supabase');
const { store, getEffectiveStatus, isExcluido } = require('../lib/store');

const fallbackCervejarias = [
  { id: 1, nome: "Cervejaria Farol", cidade: "Canela", slug: "farol", tour_guiado: true, status: 'ativo' },
  { id: 2, nome: "Cervejaria Gramado Bier", cidade: "Gramado", slug: "gramado-bier", tour_guiado: false, status: 'ativo' },
  { id: 3, nome: "Cervejaria Rasen Bier", cidade: "Gramado", slug: "rasen-bier", tour_guiado: true, status: 'ativo' },
  { id: 4, nome: "Cervejaria Edelbrau", cidade: "Nova Petrópolis", slug: "edelbrau", tour_guiado: true, status: 'ativo' },
  { id: 5, nome: "Cervejaria Kraustin Bier", cidade: "Canela", slug: "kraustin", tour_guiado: false, status: 'ativo' }
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();
  const showAll = (req.query || {}).all === 'true';

  try {
    let dbCervejarias = [];
    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('cervejarias')
        .select('id, nome, cidade, slug, endereco, telefone, tour_guiado, status')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        dbCervejarias = data;
      }
    }

    const cervMap = new Map();
    fallbackCervejarias.forEach(c => cervMap.set(c.nome.toLowerCase().trim(), c));
    store.cervejarias.forEach(c => cervMap.set(c.nome.toLowerCase().trim(), c));
    dbCervejarias.forEach(c => cervMap.set(c.nome.toLowerCase().trim(), c));

    let list = Array.from(cervMap.values())
      .map(c => {
        const effectiveStatus = getEffectiveStatus('cervejarias', c.nome, c.status || 'ativo');
        return { ...c, status: effectiveStatus };
      })
      .filter(c => !isExcluido('cervejarias', c.nome));

    if (!showAll) {
      list = list.filter(c => c.status === 'ativo');
    }

    return res.json({ sucesso: true, cervejarias: list });
  } catch (err) {
    let list = fallbackCervejarias
      .map(c => {
        const effectiveStatus = getEffectiveStatus('cervejarias', c.nome, c.status || 'ativo');
        return { ...c, status: effectiveStatus };
      })
      .filter(c => !isExcluido('cervejarias', c.nome));

    if (!showAll) {
      list = list.filter(c => c.status === 'ativo');
    }

    return res.json({ sucesso: true, cervejarias: list });
  }
};
