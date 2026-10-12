// api/vendedor.js
// Endpoint Serverless Vercel: Consulta do Painel do Vendedor / Promotor no Supabase
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
    const codigo = (req.query.codigo || '').trim().toUpperCase();

    if (!codigo) {
      return res.status(400).json({ error: 'Código de parceiro/vendedor não informado.' });
    }

    const supabase = getSupabaseClient();

    if (supabase && isSupabaseConfigured()) {
      // 1. Busca Vendedor
      const { data: vendedor } = await supabase
        .from('vendedores')
        .select('*')
        .eq('codigo', codigo)
        .maybeSingle();

      if (!vendedor) {
        return res.status(404).json({
          sucesso: false,
          error: 'Código de vendedor não localizado. Verifique os caracteres ou cadastre-se como parceiro.'
        });
      }

      // 2. Busca Comissões
      const { data: comissoes } = await supabase
        .from('comissoes')
        .select('*')
        .eq('vendedor_codigo', codigo)
        .order('created_at', { ascending: false });

      const totalComissao = (comissoes || []).reduce((acc, c) => acc + Number(c.valor_comissao || 0), 0);
      const totalPendente = (comissoes || []).filter(c => c.status_pagamento === 'pendente').reduce((acc, c) => acc + Number(c.valor_comissao || 0), 0);
      const totalPago = (comissoes || []).filter(c => c.status_pagamento === 'pago').reduce((acc, c) => acc + Number(c.valor_comissao || 0), 0);

      return res.json({
        sucesso: true,
        vendedor: {
          nome: vendedor.nome,
          codigo: vendedor.codigo,
          tipo: vendedor.tipo,
          hotel_nome: vendedor.hotel_nome,
          status: vendedor.status
        },
        resumo: {
          total_vendas: (comissoes || []).length,
          total_comissao: totalComissao,
          total_pendente: totalPendente,
          total_pago: totalPago
        },
        comissoes: comissoes || []
      });
    }

    // Modo Fallback Local / Demonstração
    return res.json({
      sucesso: true,
      origem: 'preview',
      vendedor: {
        nome: `Parceiro Demonstrativo (${codigo})`,
        codigo: codigo,
        tipo: 'promotor',
        status: 'ativo'
      },
      resumo: {
        total_vendas: 4,
        total_comissao: 80.00,
        total_pendente: 80.00,
        total_pago: 0.00
      },
      comissoes: [
        {
          id: 'COM-01',
          pedido_id: 'BS-ORD-DEMO',
          valor_comissao: 20.00,
          status_pagamento: 'pendente',
          data_fechamento: '31/10/2026',
          data_pagamento: '10/11/2026'
        }
      ]
    });

  } catch (err) {
    console.error('Erro na API de Vendedor:', err);
    return res.status(500).json({ error: 'Erro ao consultar painel do vendedor.' });
  }
};
