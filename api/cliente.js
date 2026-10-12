// api/cliente.js
// Endpoint Serverless Vercel: Consulta de Minha Conta / Passes do Cliente no Supabase
const { getSupabaseClient, isSupabaseConfigured } = require('./supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const rawCpf = req.query.cpf || '';
    const cleanCpf = rawCpf.replace(/\D/g, '');

    if (!cleanCpf || cleanCpf.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido. Informe os 11 dígitos numéricos.' });
    }

    const supabase = getSupabaseClient();

    if (supabase && isSupabaseConfigured()) {
      // 1. Busca Cliente
      const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('cpf', cleanCpf)
        .maybeSingle();

      if (!cliente) {
        return res.status(404).json({
          sucesso: false,
          error: 'Nenhum cadastro ou passe encontrado para este CPF.'
        });
      }

      // 2. Busca Cards vinculados (seja como pagador ou como titular convidado)
      const { data: cards } = await supabase
        .from('cards')
        .select('*')
        .or(`pagador_cpf.eq.${cleanCpf},titular_cpf.eq.${cleanCpf}`)
        .order('is_pagador', { ascending: false });

      // 3. Busca Histórico de Validações realizadas
      const { data: validacoes } = await supabase
        .from('validacoes')
        .select('*')
        .eq('titular_cpf', cleanCpf)
        .order('validado_em', { ascending: false });

      return res.json({
        sucesso: true,
        cliente: {
          nome: cliente.nome,
          cpf: cliente.cpf,
          email: cliente.email,
          telefone: cliente.telefone
        },
        cards: cards || [],
        validacoes: validacoes || []
      });
    }

    // Modo Fallback Local / Demonstração
    return res.json({
      sucesso: true,
      origem: 'preview',
      cliente: {
        nome: 'CLIENTE VIP DA SERRA',
        cpf: cleanCpf,
        email: 'cliente@exemplo.com'
      },
      cards: [
        {
          id: `CARD-${cleanCpf}-0`,
          titular_nome: 'CLIENTE VIP DA SERRA',
          codigo_passe: `BS-VIP-${cleanCpf.slice(-4)}`,
          modalidade: 'brinda_bem',
          saldo_restante: 3,
          saldo_total: 3,
          data_validade_formatada: '12/10/2026',
          qr_token: `BS-${cleanCpf}-DEMO`,
          is_pagador: true
        }
      ],
      validacoes: []
    });

  } catch (err) {
    console.error('Erro na API de Cliente:', err);
    return res.status(500).json({ error: 'Erro ao consultar conta do cliente.' });
  }
};
