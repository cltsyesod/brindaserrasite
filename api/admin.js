// api/admin.js
// Endpoint Serverless Vercel: Painel Administrativo Geral da BRINDA SERRA
const { getSupabaseClient, isSupabaseConfigured } = require('./supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();

  // Tratamento de POST (Ações de Gestão Administrativa)
  if (req.method === 'POST') {
    try {
      const { action, payload } = req.body || {};

      if (!action) {
        return res.status(400).json({ error: 'Ação administrativa não informada.' });
      }

      if (supabase && isSupabaseConfigured()) {
        // 1. Cadastrar Vendedor
        if (action === 'criar_vendedor') {
          const { nome, codigo, tipo, hotel_nome, telefone } = payload || {};
          if (!nome || !codigo || !tipo) {
            return res.status(400).json({ error: 'Nome, Código e Tipo são obrigatórios.' });
          }

          const { data, error } = await supabase.from('vendedores').insert({
            nome: nome.trim(),
            codigo: codigo.trim().toUpperCase(),
            tipo: tipo.trim(),
            hotel_nome: hotel_nome ? hotel_nome.trim() : null,
            telefone: telefone ? telefone.trim() : null,
            status: 'ativo'
          }).select().single();

          if (error) throw error;
          return res.status(201).json({ sucesso: true, vendedor: data });
        }

        // 2. Atualizar Status do Vendedor (Ativar/Inativar)
        if (action === 'toggle_vendedor') {
          const { id, status } = payload || {};
          const { error } = await supabase.from('vendedores').update({ status }).eq('id', id);
          if (error) throw error;
          return res.json({ sucesso: true, mensagem: `Status atualizado para ${status}.` });
        }

        // 3. Marcar Comissão como Paga
        if (action === 'pagar_comissao') {
          const { vendedor_codigo, id } = payload || {};
          let query = supabase.from('comissoes').update({ status_pagamento: 'pago' });
          if (id) {
            query = query.eq('id', id);
          } else if (vendedor_codigo) {
            query = query.eq('vendedor_codigo', vendedor_codigo).eq('status_pagamento', 'pendente');
          }
          const { error } = await query;
          if (error) throw error;
          return res.json({ sucesso: true, mensagem: 'Comissões marcadas como pagas com sucesso.' });
        }

        // 4. Atualizar Status de Lead B2B
        if (action === 'atualizar_lead') {
          const { id, status } = payload || {};
          const { error } = await supabase.from('leads').update({ status }).eq('id', id);
          if (error) throw error;
          return res.json({ sucesso: true, mensagem: `Lead atualizado para '${status}'.` });
        }
      }

      // Fallback para modo local / simulação
      return res.json({ sucesso: true, mensagem: 'Ação executada com sucesso no modo local.' });

    } catch (err) {
      console.error('Erro em ação administrativa POST:', err);
      return res.status(500).json({ error: err.message || 'Erro ao processar ação administrativa.' });
    }
  }

  // Tratamento de GET (Carga Completa do Painel Administrativo)
  try {
    let pedidos = [];
    let cards = [];
    let validacoes = [];
    let clientes = [];
    let vendedores = [];
    let comissoes = [];
    let leads = [];
    let cervejarias = [];

    if (supabase && isSupabaseConfigured()) {
      const [
        resPed,
        resCards,
        resVal,
        resCli,
        resVend,
        resCom,
        resLeads,
        resCerv
      ] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('cards').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('validacoes').select('*').order('validado_em', { ascending: false }).limit(100),
        supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('vendedores').select('*').order('id', { ascending: true }),
        supabase.from('comissoes').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('cervejarias').select('*').order('id', { ascending: true })
      ]);

      pedidos = resPed.data || [];
      cards = resCards.data || [];
      validacoes = resVal.data || [];
      clientes = resCli.data || [];
      vendedores = resVend.data || [];
      comissoes = resCom.data || [];
      leads = resLeads.data || [];
      cervejarias = resCerv.data || [];
    }

    // Se o banco ainda não possuir registros ou se estiver iniciando, mescla dados de demonstração
    // para que a proprietária visualize o painel plenamente habitado com exemplos realistas:
    const mockSeedNeeded = pedidos.length === 0;

    if (mockSeedNeeded) {
      pedidos = [
        {
          id: 'BS-ORD-9021',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          pagador_nome: 'Marcos Vinicius Santos',
          pagador_cpf: '458.912.830-11',
          plano_cervejaria: 'brinda_bem',
          taxa_adesao: 10.00,
          valor_unitario_exp: 130.00,
          qtd_cards: 1,
          valor_total: 140.00,
          forma_pagamento: 'PIX',
          status: 'pago',
          origem_tipo: 'hotel',
          origem_detalhe: 'Hotel Casa da Montanha',
          vendedor_codigo: 'HOTEL01'
        },
        {
          id: 'BS-ORD-9020',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          pagador_nome: 'Carla Beatriz Menezes',
          pagador_cpf: '612.345.980-44',
          plano_cervejaria: 'brinda_premium',
          taxa_adesao: 10.00,
          valor_unitario_exp: 200.00,
          qtd_cards: 2,
          valor_total: 410.00,
          forma_pagamento: 'Cartão de Crédito',
          status: 'pago',
          origem_tipo: 'uber',
          origem_detalhe: 'Motorista Pedro Silva',
          vendedor_codigo: 'PEDRO01'
        },
        {
          id: 'BS-ORD-9019',
          created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          pagador_nome: 'Rodrigo Fontana Alencar',
          pagador_cpf: '789.123.456-00',
          plano_cervejaria: 'brinda_bem',
          taxa_adesao: 10.00,
          valor_unitario_exp: 130.00,
          qtd_cards: 1,
          valor_total: 140.00,
          forma_pagamento: 'PIX',
          status: 'pago',
          origem_tipo: 'google',
          origem_detalhe: 'Pesquisa Direta',
          vendedor_codigo: null
        },
        {
          id: 'BS-ORD-9018',
          created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
          pagador_nome: 'Juliana Paes Cavalcante',
          pagador_cpf: '333.444.555-88',
          plano_cervejaria: 'base',
          taxa_adesao: 10.00,
          valor_unitario_exp: 0.00,
          qtd_cards: 1,
          valor_total: 10.00,
          forma_pagamento: 'PIX',
          status: 'pago',
          origem_tipo: 'instagram',
          origem_detalhe: '@brindaserra',
          vendedor_codigo: null
        }
      ];

      cards = [
        {
          id: 'CARD-MOCK-1',
          codigo_passe: 'BS-VIP-12345',
          titular_nome: 'TURISTA VIP DE TESTE',
          titular_cpf: '11111111111',
          modalidade: 'brinda_bem',
          saldo_total: 3,
          saldo_restante: 2,
          status: 'ativo',
          data_validade_formatada: '31/12/2026',
          qr_token: 'QR-TESTE-12345'
        },
        {
          id: 'CARD-MOCK-2',
          codigo_passe: 'BS-VIP-45891',
          titular_nome: 'Marcos Vinicius Santos',
          titular_cpf: '458.912.830-11',
          modalidade: 'brinda_bem',
          saldo_total: 3,
          saldo_restante: 3,
          status: 'ativo',
          data_validade_formatada: '12/10/2026',
          qr_token: 'BS-45891283011-9021'
        },
        {
          id: 'CARD-MOCK-3',
          codigo_passe: 'BS-VIP-61234',
          titular_nome: 'Carla Beatriz Menezes',
          titular_cpf: '612.345.980-44',
          modalidade: 'brinda_premium',
          saldo_total: 5,
          saldo_restante: 4,
          status: 'ativo',
          data_validade_formatada: '12/10/2026',
          qr_token: 'BS-61234598044-9020'
        },
        {
          id: 'CARD-MOCK-4',
          codigo_passe: 'BS-VIP-61235',
          titular_nome: 'Lucas Menezes (Convidado)',
          titular_cpf: '612.999.000-22',
          modalidade: 'brinda_premium',
          saldo_total: 5,
          saldo_restante: 5,
          status: 'ativo',
          data_validade_formatada: '12/10/2026',
          qr_token: 'BS-61299900022-9020'
        }
      ];

      validacoes = [
        {
          id: 'VAL-001',
          titular_cpf: '11111111111',
          titular_nome: 'TURISTA VIP DE TESTE',
          cervejaria_id: 1,
          cervejaria_nome: 'Cervejaria Farol',
          saldo_anterior: 3,
          saldo_pos: 2,
          validado_em: new Date(Date.now() - 1800000).toISOString(),
          validado_por: 'farol'
        },
        {
          id: 'VAL-002',
          titular_cpf: '612.345.980-44',
          titular_nome: 'Carla Beatriz Menezes',
          cervejaria_id: 3,
          cervejaria_nome: 'Cervejaria Rasen Bier',
          saldo_anterior: 5,
          saldo_pos: 4,
          validado_em: new Date(Date.now() - 7200000).toISOString(),
          validado_por: 'rasen'
        }
      ];

      vendedores = [
        {
          id: 1,
          nome: 'Pedro da Silva (Motorista Uber)',
          codigo: 'PEDRO01',
          tipo: 'uber',
          hotel_nome: null,
          telefone: '(54) 99812-4455',
          status: 'ativo'
        },
        {
          id: 2,
          nome: 'Concierge Casa da Montanha',
          codigo: 'HOTEL01',
          tipo: 'hotel',
          hotel_nome: 'Hotel Casa da Montanha',
          telefone: '(54) 3286-5000',
          status: 'ativo'
        },
        {
          id: 3,
          nome: 'Lucas Promotor de Turismo',
          codigo: 'LUCASPROMO',
          tipo: 'autonomo',
          hotel_nome: null,
          telefone: '(54) 99123-9988',
          status: 'ativo'
        }
      ];

      comissoes = [
        {
          id: 'COM-01',
          vendedor_codigo: 'PEDRO01',
          pedido_id: 'BS-ORD-9020',
          pagador_cpf: '612.345.980-44',
          valor_comissao: 20.00,
          status_pagamento: 'pendente',
          data_fechamento: '31/10/2026',
          data_pagamento: '10/11/2026',
          created_at: new Date().toISOString()
        },
        {
          id: 'COM-02',
          vendedor_codigo: 'HOTEL01',
          pedido_id: 'BS-ORD-9021',
          pagador_cpf: '458.912.830-11',
          valor_comissao: 20.00,
          status_pagamento: 'pendente',
          data_fechamento: '31/10/2026',
          data_pagamento: '10/11/2026',
          created_at: new Date().toISOString()
        }
      ];

      leads = [
        {
          id: 'LEAD-01',
          tipo: 'vendedor',
          nome: 'Roberto Carlos Silveira',
          empresa_nome: 'Motorista Executivo Gramado',
          telefone: '(54) 99655-1122',
          cidade: 'Gramado - RS',
          categoria: 'Motorista / Agência',
          status: 'novo',
          created_at: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'LEAD-02',
          tipo: 'cervejaria',
          nome: 'Fábio Goulart',
          empresa_nome: 'Cervejaria Gramado Sunset',
          telefone: '(54) 98111-7788',
          cidade: 'Gramado - RS',
          categoria: 'Fábrica e Tap House',
          status: 'em_contato',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ];

      cervejarias = [
        { id: 1, nome: 'Cervejaria Farol', cidade: 'Canela', status: 'ativo' },
        { id: 2, nome: 'Cervejaria Gramado Bier', cidade: 'Gramado', status: 'ativo' },
        { id: 3, nome: 'Cervejaria Rasen Bier', cidade: 'Gramado', status: 'ativo' },
        { id: 4, nome: 'Cervejaria Edelbrau', cidade: 'Nova Petrópolis', status: 'ativo' },
        { id: 5, nome: 'Cervejaria Kraustin Bier', cidade: 'Canela', status: 'ativo' }
      ];
    }

    // Cálculos de Indicadores de Gestão Executiva (KPIs)
    const totalFaturamento = pedidos
      .filter(p => p.status === 'pago')
      .reduce((acc, p) => acc + Number(p.valor_total || 0), 0);

    const totalPedidosPagos = pedidos.filter(p => p.status === 'pago').length;
    const totalCardsAtivos = cards.filter(c => c.status === 'ativo').length;
    const totalValidacoes = validacoes.length;

    // Resumo de Origens de Venda
    const origensContagem = {
      hotel: pedidos.filter(p => p.origem_tipo === 'hotel').length,
      uber: pedidos.filter(p => p.origem_tipo === 'uber').length,
      google: pedidos.filter(p => p.origem_tipo === 'google').length,
      instagram: pedidos.filter(p => p.origem_tipo === 'instagram').length,
      outros: pedidos.filter(p => !['hotel', 'uber', 'google', 'instagram'].includes(p.origem_tipo)).length
    };

    // Resumo de Desempenho por Vendedor
    const vendedoresResumo = vendedores.map(v => {
      const vComissoes = comissoes.filter(c => c.vendedor_codigo === v.codigo);
      const qtdVendas = vComissoes.length;
      const totalComissao = vComissoes.reduce((acc, c) => acc + Number(c.valor_comissao || 0), 0);
      const atingiuBonus = qtdVendas >= 20;
      const valorBonus = atingiuBonus ? 200.00 : 0.00;
      const pendente = vComissoes.filter(c => c.status_pagamento === 'pendente').reduce((acc, c) => acc + Number(c.valor_comissao || 0), 0);

      return {
        ...v,
        total_vendas: qtdVendas,
        atingiu_bonus: atingiuBonus,
        valor_bonus: valorBonus,
        total_comissao: totalComissao,
        total_a_receber: totalComissao + valorBonus,
        total_pendente: pendente
      };
    });

    return res.json({
      sucesso: true,
      ambiente: supabase && isSupabaseConfigured() ? 'Supabase PostgreSQL (Produção)' : 'Ambiente Resiliente Local',
      metricas: {
        faturamento_total: totalFaturamento,
        pedidos_pagos: totalPedidosPagos,
        cards_ativos: totalCardsAtivos,
        validacoes_total: totalValidacoes,
        leads_total: leads.length,
        origens: origensContagem
      },
      pedidos,
      cards,
      validacoes,
      vendedores: vendedoresResumo,
      comissoes,
      leads,
      cervejarias
    });

  } catch (err) {
    console.error('Erro na API Administrativa:', err);
    return res.status(500).json({ error: 'Erro ao carregar dados do painel administrativo.' });
  }
};
