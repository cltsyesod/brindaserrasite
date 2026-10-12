// api/hoteis.js
// Endpoint Serverless Vercel: Gestão e Consulta Dinâmica de Hotéis Parceiros
const { getSupabaseClient, isSupabaseConfigured } = require('../lib/supabase');
const { store, getEffectiveStatus, setOverride, addExclusao, addHotel, isExcluido } = require('../lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();
  const showAll = (req.query || {}).all === 'true';

  // GET: Retorna hotéis ativos (ou todos se solicitado pelo admin)
  if (req.method === 'GET') {
    try {
      let dbHoteis = [];
      if (supabase && isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('vendedores')
          .select('id, nome, hotel_nome, telefone, status')
          .eq('tipo', 'hotel');

        if (!error && data && data.length > 0) {
          dbHoteis = data.map(h => ({
            id: h.id,
            nome: h.hotel_nome || h.nome,
            tel: h.telefone,
            status: h.status || 'ativo'
          }));
        }
      }

      // Combina com memória local de store
      const map = new Map();
      store.hoteis.forEach(h => {
        const status = getEffectiveStatus('hoteis', h.nome, h.status || 'ativo');
        map.set(h.nome.toLowerCase().trim(), { ...h, status });
      });

      dbHoteis.forEach(h => {
        const status = getEffectiveStatus('hoteis', h.nome, h.status || 'ativo');
        map.set(h.nome.toLowerCase().trim(), { ...h, status });
      });

      let list = Array.from(map.values()).filter(h => !isExcluido('hoteis', h.nome));
      if (!showAll) {
        list = list.filter(h => h.status === 'ativo');
      }

      return res.json({ sucesso: true, hoteis: list });
    } catch (err) {
      let list = store.hoteis.map(h => {
        const status = getEffectiveStatus('hoteis', h.nome, h.status || 'ativo');
        return { ...h, status };
      }).filter(h => !isExcluido('hoteis', h.nome));

      if (!showAll) {
        list = list.filter(h => h.status === 'ativo');
      }
      return res.json({ sucesso: true, hoteis: list });
    }
  }

  // POST: Cadastrar, atualizar status ou excluir hotel
  if (req.method === 'POST') {
    try {
      const { action, payload } = req.body || {};
      const { nome, status, endereco, cidade, tel, resp } = payload || req.body || {};

      if (action === 'toggle' || status) {
        const newStatus = status || 'ativo';
        setOverride(nome, newStatus);

        // Atualiza no store
        store.hoteis = store.hoteis.map(h => {
          if (h.nome.toLowerCase().trim() === String(nome).toLowerCase().trim()) {
            return { ...h, status: newStatus };
          }
          return h;
        });

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('vendedores').update({ status: newStatus }).eq('hotel_nome', nome);
        }

        return res.json({ sucesso: true, mensagem: `Hotel "${nome}" agora está ${newStatus}.` });
      }

      if (action === 'excluir') {
        addExclusao('hoteis', nome);
        store.hoteis = store.hoteis.filter(h => h.nome.toLowerCase().trim() !== String(nome).toLowerCase().trim());

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('vendedores').delete().eq('hotel_nome', nome);
        }

        return res.json({ sucesso: true, mensagem: `Hotel "${nome}" foi excluído.` });
      }

      // Adicionar novo hotel
      if (nome) {
        const novo = {
          id: Date.now(),
          nome: nome.trim(),
          cidade: cidade || 'Serra Gaúcha',
          endereco: endereco || '',
          tel: tel || '',
          resp: resp || 'Concierge',
          status: 'ativo'
        };
        addHotel(novo);

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('vendedores').insert({
            nome: `${resp || 'Concierge'} (${nome.trim()})`,
            codigo: `HOTEL${Math.floor(10 + Math.random() * 89)}`,
            tipo: 'hotel',
            hotel_nome: nome.trim(),
            telefone: tel || null,
            status: 'ativo'
          });
        }

        return res.status(201).json({ sucesso: true, hotel: novo });
      }

      return res.status(400).json({ error: 'Dados insuficientes.' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Método não suportado.' });
};
