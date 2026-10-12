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

  // Tratamento de POST (Ações de Gestão Administrativa: Criar, Desativar, Reativar, Excluir)
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
          if (!nome || !codigo) return res.status(400).json({ error: 'Nome e Código são obrigatórios.' });

          const { data } = await supabase.from('vendedores').insert({
            nome: nome.trim(),
            codigo: codigo.trim().toUpperCase(),
            tipo: (tipo || 'autonomo').trim(),
            hotel_nome: hotel_nome ? hotel_nome.trim() : null,
            telefone: telefone ? telefone.trim() : null,
            status: 'ativo'
          }).select().maybeSingle();

          return res.status(201).json({ sucesso: true, vendedor: data || payload });
        }

        // 2. Alterar Status do Vendedor (Ativar/Desativar)
        if (action === 'toggle_vendedor') {
          const { id, codigo, status } = payload || {};
          let q = supabase.from('vendedores').update({ status });
          if (id) q = q.eq('id', id);
          else if (codigo) q = q.eq('codigo', codigo);
          await q;
          return res.json({ sucesso: true, mensagem: `Vendedor ${status === 'ativo' ? 'reativado' : 'desativado'}.` });
        }

        // 3. Excluir Vendedor
        if (action === 'excluir_vendedor') {
          const { id, codigo } = payload || {};
          let q = supabase.from('vendedores').delete();
          if (id) q = q.eq('id', id);
          else if (codigo) q = q.eq('codigo', codigo);
          await q;
          return res.json({ sucesso: true, mensagem: 'Vendedor excluído com sucesso.' });
        }

        // 4. Cadastrar Hotel Parceiro
        if (action === 'criar_hotel') {
          const { nome, endereco, cidade, telefone, resp } = payload || {};
          if (!nome) return res.status(400).json({ error: 'Nome do hotel é obrigatório.' });

          const codigoHotel = `HOTEL${Math.floor(10 + Math.random() * 89)}`;
          await supabase.from('vendedores').insert({
            nome: `${resp || 'Concierge'} (${nome.trim()})`,
            codigo: codigoHotel,
            tipo: 'hotel',
            hotel_nome: nome.trim(),
            telefone: telefone || null,
            status: 'ativo'
          });

          return res.status(201).json({ sucesso: true, hotel: { nome, endereco, cidade, telefone, resp } });
        }

        // 5. Alterar Status do Hotel (Ativar/Desativar)
        if (action === 'toggle_hotel') {
          const { nome, status } = payload || {};
          if (nome) {
            await supabase.from('vendedores').update({ status }).eq('hotel_nome', nome);
          }
          return res.json({ sucesso: true, mensagem: `Hotel ${status === 'ativo' ? 'reativado' : 'desativado'}.` });
        }

        // 6. Excluir Hotel
        if (action === 'excluir_hotel') {
          const { nome } = payload || {};
          if (nome) {
            await supabase.from('vendedores').delete().eq('hotel_nome', nome);
          }
          return res.json({ sucesso: true, mensagem: 'Hotel excluído com sucesso.' });
        }

        // 7. Cadastrar Cervejaria Parceira
        if (action === 'criar_cervejaria') {
          const { nome, cidade, endereco, telefone, tour_guiado, pin_acesso } = payload || {};
          if (!nome || !cidade) return res.status(400).json({ error: 'Nome e Cidade são obrigatórios.' });

          const slug = nome.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(10 + Math.random() * 89);
          const { data } = await supabase.from('cervejarias').insert({
            nome: nome.trim(),
            cidade: cidade.trim(),
            slug: slug,
            endereco: endereco ? endereco.trim() : null,
            telefone: telefone ? telefone.trim() : null,
            tour_guiado: Boolean(tour_guiado),
            pin_acesso: pin_acesso || '1234',
            status: 'ativo'
          }).select().maybeSingle();

          return res.status(201).json({ sucesso: true, cervejaria: data || payload });
        }

        // 8. Alterar Status de Cervejaria (Ativar/Desativar)
        if (action === 'toggle_cervejaria') {
          const { id, nome, status } = payload || {};
          let q = supabase.from('cervejarias').update({ status });
          if (id) q = q.eq('id', id);
          else if (nome) q = q.eq('nome', nome);
          await q;
          return res.json({ sucesso: true, mensagem: `Cervejaria ${status === 'ativo' ? 'reativada' : 'desativada'}.` });
        }

        // 9. Excluir Cervejaria
        if (action === 'excluir_cervejaria') {
          const { id, nome } = payload || {};
          let q = supabase.from('cervejarias').delete();
          if (id) q = q.eq('id', id);
          else if (nome) q = q.eq('nome', nome);
          await q;
          return res.json({ sucesso: true, mensagem: 'Cervejaria excluída com sucesso.' });
        }

        // 10. Atualizar Status de Lead B2B
        if (action === 'atualizar_lead') {
          const { id, status } = payload || {};
          await supabase.from('leads').update({ status }).eq('id', id);
          return res.json({ sucesso: true, mensagem: `Status do lead atualizado.` });
        }

        // 11. Excluir Lead B2B
        if (action === 'excluir_lead') {
          const { id } = payload || {};
          await supabase.from('leads').delete().eq('id', id);
          return res.json({ sucesso: true, mensagem: 'Lead excluído com sucesso.' });
        }

        // 12. Pagar Comissão
        if (action === 'pagar_comissao') {
          const { vendedor_codigo, id } = payload || {};
          let query = supabase.from('comissoes').update({ status_pagamento: 'pago' });
          if (id) query = query.eq('id', id);
          else if (vendedor_codigo) query = query.eq('vendedor_codigo', vendedor_codigo).eq('status_pagamento', 'pendente');
          await query;
          return res.json({ sucesso: true, mensagem: 'Comissões marcadas como pagas.' });
        }

        // 13. Alterar Status de Card (Ativar/Bloquear)
        if (action === 'toggle_card') {
          const { id, codigo_passe, status } = payload || {};
          let q = supabase.from('cards').update({ status });
          if (id) q = q.eq('id', id);
          else if (codigo_passe) q = q.eq('codigo_passe', codigo_passe);
          await q;
          return res.json({ sucesso: true, mensagem: `Card ${status === 'ativo' ? 'reativado' : 'bloqueado'}.` });
        }

        // 14. Excluir Card
        if (action === 'excluir_card') {
          const { id, codigo_passe } = payload || {};
          let q = supabase.from('cards').delete();
          if (id) q = q.eq('id', id);
          else if (codigo_passe) q = q.eq('codigo_passe', codigo_passe);
          await q;
          return res.json({ sucesso: true, mensagem: 'Card excluído com sucesso.' });
        }
      }

      // Fallback para modo local
      return res.json({ sucesso: true, mensagem: 'Ação executada com sucesso.' });

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
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('cards').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('validacoes').select('*').order('validado_em', { ascending: false }).limit(200),
        supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('vendedores').select('*').order('created_at', { ascending: false }),
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

    // Exemplos de demonstração que NÃO substituem os dados reais, apenas somam se não existirem
    const mockVendedoresExemplo = [
      { id: 'V-MOCK-1', nome: 'Pedro da Silva (Motorista Uber)', codigo: 'PEDRO01', tipo: 'uber', hotel_nome: null, telefone: '(54) 99812-4455', status: 'ativo' },
      { id: 'V-MOCK-2', nome: 'Concierge Casa da Montanha', codigo: 'HOTEL01', tipo: 'hotel', hotel_nome: 'Hotel Casa da Montanha', telefone: '(54) 3286-5000', status: 'ativo' },
      { id: 'V-MOCK-3', nome: 'Lucas Promotor de Turismo', codigo: 'LUCASPROMO', tipo: 'autonomo', hotel_nome: null, telefone: '(54) 99123-9988', status: 'ativo' }
    ];

    const vendedoresMap = new Map();
    // 1. Vendedores reais de vendedores
    vendedores.forEach(v => vendedoresMap.set(v.codigo?.toUpperCase() || v.nome?.toUpperCase(), v));

    // 2. Leads do tipo 'vendedor': se cadastrou no site, entra DIRETO nos vendedores
    leads.forEach(l => {
      if (l.tipo === 'vendedor' || !l.tipo) {
        const primeiroNome = (l.nome?.trim().split(' ')[0] || 'VEND').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const code = `${primeiroNome}01`;
        if (!vendedoresMap.has(code) && !Array.from(vendedoresMap.values()).some(v => v.telefone === l.telefone)) {
          vendedoresMap.set(code, {
            id: l.id || Date.now(),
            nome: l.nome,
            codigo: code,
            tipo: l.categoria || 'autonomo',
            hotel_nome: l.empresa_nome || (l.cidade ? `Região: ${l.cidade}` : 'Autônomo'),
            telefone: l.telefone,
            status: 'ativo',
            created_at: l.created_at
          });
        }
      }
    });

    // 3. Adiciona exemplos se lista estiver com poucos
    if (vendedoresMap.size < 3) {
      mockVendedoresExemplo.forEach(mv => {
        if (!vendedoresMap.has(mv.codigo)) vendedoresMap.set(mv.codigo, mv);
      });
    }

    const vendedoresFinal = Array.from(vendedoresMap.values());

    // Cervejarias: combina oficiais + leads do tipo cervejaria para aparecerem na lista
    const cervejariasMap = new Map();
    cervejarias.forEach(c => cervejariasMap.set(c.nome?.toLowerCase(), c));

    // Se houver lead de cervejaria, adiciona na lista para que a administradora veja e aprove/gerencie
    leads.forEach(l => {
      if (l.tipo === 'cervejaria') {
        const bName = l.empresa_nome || (l.nome.includes('Cervejaria') ? l.nome : `Cervejaria ${l.nome}`);
        if (!cervejariasMap.has(bName.toLowerCase())) {
          cervejariasMap.set(bName.toLowerCase(), {
            id: l.id || Date.now(),
            nome: bName,
            cidade: l.cidade || 'Serra Gaúcha',
            endereco: `Contato: ${l.nome}`,
            telefone: l.telefone,
            tour_guiado: false,
            pin_acesso: '1234',
            status: l.status === 'aprovado' ? 'ativo' : 'ativo', // exibe ativa para testes
            created_at: l.created_at
          });
        }
      }
    });

    if (cervejariasMap.size < 5) {
      const defaultCervs = [
        { id: 1, nome: 'Cervejaria Farol', cidade: 'Canela', status: 'ativo' },
        { id: 2, nome: 'Cervejaria Gramado Bier', cidade: 'Gramado', status: 'ativo' },
        { id: 3, nome: 'Cervejaria Rasen Bier', cidade: 'Gramado', status: 'ativo' },
        { id: 4, nome: 'Cervejaria Edelbrau', cidade: 'Nova Petrópolis', status: 'ativo' },
        { id: 5, nome: 'Cervejaria Kraustin Bier', cidade: 'Canela', status: 'ativo' }
      ];
      defaultCervs.forEach(c => {
        if (!cervejariasMap.has(c.nome.toLowerCase())) cervejariasMap.set(c.nome.toLowerCase(), c);
      });
    }

    const cervejariasFinal = Array.from(cervejariasMap.values());

    // Pedidos e Cards de demonstração caso banco esteja zerado
    if (pedidos.length === 0) {
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
        }
      ];
    }

    if (cards.length === 0) {
      cards = [
        { id: 'CARD-MOCK-1', codigo_passe: 'BS-VIP-12345', titular_nome: 'TURISTA VIP DE TESTE', titular_cpf: '11111111111', modalidade: 'brinda_bem', saldo_total: 3, saldo_restante: 2, status: 'ativo', data_validade_formatada: '31/12/2026', qr_token: 'QR-TESTE-12345' },
        { id: 'CARD-MOCK-2', codigo_passe: 'BS-VIP-45891', titular_nome: 'Marcos Vinicius Santos', titular_cpf: '458.912.830-11', modalidade: 'brinda_bem', saldo_total: 3, saldo_restante: 3, status: 'ativo', data_validade_formatada: '12/10/2026', qr_token: 'BS-45891283011-9021' }
      ];
    }

    if (validacoes.length === 0) {
      validacoes = [
        { id: 'VAL-001', titular_cpf: '11111111111', titular_nome: 'TURISTA VIP DE TESTE', cervejaria_id: 1, cervejaria_nome: 'Cervejaria Farol', saldo_anterior: 3, saldo_pos: 2, validado_em: new Date(Date.now() - 1800000).toISOString(), validado_por: 'farol' }
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
    const vendedoresResumo = vendedoresFinal.map(v => {
      const vComissoes = comissoes.filter(c => c.vendedor_codigo === v.codigo);
      const qtdVendas = vComissoes.length || (v.codigo === 'PEDRO01' || v.codigo === 'HOTEL01' ? 1 : 0);
      const totalComissao = vComissoes.length > 0
        ? vComissoes.reduce((acc, c) => acc + Number(c.valor_comissao || 0), 0)
        : (qtdVendas * 20.00);
      const atingiuBonus = qtdVendas >= 20;
      const valorBonus = atingiuBonus ? 200.00 : 0.00;
      const pendente = totalComissao;

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
      cervejarias: cervejariasFinal
    });

  } catch (err) {
    console.error('Erro na API Administrativa:', err);
    return res.status(500).json({ error: 'Erro ao carregar dados do painel administrativo.' });
  }
};
