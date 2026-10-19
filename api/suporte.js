// api/suporte.js
// Endpoint Serverless Vercel: Atendimento ao Cliente (SAC) com Base de Conhecimento e Fila de Handover Humano
const { getSupabaseClient, isSupabaseConfigured } = require('../lib/supabase');
const { store, addTicket } = require('../lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. POST: Criação de Ticket de Atendimento Humano ou Consulta
  if (req.method === 'POST') {
    try {
      const { nome, email, telefone, mensagem, historico_chat } = req.body || {};

      if (!nome || (!email && !telefone) || !mensagem) {
        return res.status(400).json({
          error: 'Por favor, informe seu nome, um meio de contato (e-mail ou WhatsApp) e a sua dúvida.'
        });
      }

      const ticketId = `SAC-${Math.floor(1000 + Math.random() * 9000)}`;
      const novoTicket = {
        id: ticketId,
        nome: String(nome).trim(),
        email: String(email || '').trim(),
        telefone: String(telefone || '').trim(),
        mensagem: String(mensagem).trim(),
        historico_chat: Array.isArray(historico_chat) ? historico_chat : [],
        status: 'aberto',
        resposta_admin: null,
        created_at: new Date().toISOString()
      };

      addTicket(novoTicket);

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase.from('tickets_suporte').insert({
            id: ticketId,
            nome: novoTicket.nome,
            email: novoTicket.email,
            telefone: novoTicket.telefone,
            mensagem: novoTicket.mensagem,
            status: 'aberto',
            created_at: novoTicket.created_at
          });
        } catch (dbErr) {
          console.warn('Tabela tickets_suporte não presente no Supabase, mantido em memória:', dbErr.message);
        }
      }

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Sua solicitação foi enviada com sucesso! Nossa equipe entrará em contato em breve.',
        ticket: novoTicket
      });

    } catch (err) {
      console.error('Erro ao processar ticket de suporte:', err);
      return res.status(500).json({ error: 'Erro ao registrar solicitação de suporte.' });
    }
  }

  // 2. GET: Listar tickets para administração ou verificar status
  try {
    const supabase = getSupabaseClient();
    let ticketsDb = [];

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('tickets_suporte').select('*').order('created_at', { ascending: false });
        if (data) ticketsDb = data;
      } catch (e) {}
    }

    const map = new Map();
    (store.tickets || []).forEach(t => map.set(t.id, t));
    ticketsDb.forEach(t => map.set(t.id, t));

    return res.json({
      sucesso: true,
      tickets: Array.from(map.values())
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar tickets.' });
  }
};
