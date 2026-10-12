// api/leads.js
// Endpoint Serverless Vercel: Captação de Leads B2B (Promotores, Motoristas e Cervejarias)
const { getSupabaseClient, isSupabaseConfigured } = require('./supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { tipo, nome, empresa_nome, telefone, cidade, categoria, mensagem } = req.body || {};

    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e Telefone/WhatsApp são obrigatórios.' });
    }

    const leadData = {
      tipo: tipo || 'geral', // 'vendedor' ou 'cervejaria'
      nome: nome.trim(),
      empresa_nome: empresa_nome ? empresa_nome.trim() : null,
      telefone: telefone.trim(),
      cidade: cidade ? cidade.trim() : null,
      categoria: categoria || null,
      mensagem: mensagem || null,
      status: 'novo',
      created_at: new Date().toISOString()
    };

    const supabase = getSupabaseClient();

    if (supabase && isSupabaseConfigured()) {
      const { error } = await supabase.from('leads').insert(leadData);
      if (error) {
        console.warn('Erro ao inserir lead na tabela leads do Supabase:', error.message);
      }
    }

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Sua solicitação de parceria foi registrada com sucesso! Nossa equipe entrará em contato via WhatsApp.',
      lead: leadData
    });

  } catch (err) {
    console.error('Erro na API de Leads:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar solicitação de parceria.' });
  }
};
