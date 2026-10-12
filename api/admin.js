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

    // 1. Leads Iniciais de Demonstração e Histórico (garante que nada seja perdido)
    const mockLeadsIniciais = [
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
      },
      {
        id: 'LEAD-03',
        tipo: 'vendedor',
        nome: 'Camila Rossi',
        empresa_nome: 'Promotora Turística Serra',
        telefone: '(54) 99188-3344',
        cidade: 'Gramado - RS',
        categoria: 'autonomo',
        status: 'aprovado',
        created_at: new Date(Date.now() - 3600000 * 1).toISOString()
      }
    ];

    const leadsMap = new Map();
    mockLeadsIniciais.forEach(l => leadsMap.set(l.telefone || l.nome, l));
    leads.forEach(l => leadsMap.set(l.telefone || l.nome, l));
    const leadsFinal = Array.from(leadsMap.values());

    // 2. Vendedores: combina vendedores padrão, leads de vendedores e cadastros reais
    const mockVendedoresExemplo = [
      { id: 'V-MOCK-1', nome: 'Pedro da Silva (Motorista Uber)', codigo: 'PEDRO01', tipo: 'uber', hotel_nome: null, telefone: '(54) 99812-4455', status: 'ativo' },
      { id: 'V-MOCK-2', nome: 'Concierge Casa da Montanha', codigo: 'HOTEL01', tipo: 'hotel', hotel_nome: 'Hotel Casa da Montanha', telefone: '(54) 3286-5000', status: 'ativo' },
      { id: 'V-MOCK-3', nome: 'Lucas Promotor de Turismo', codigo: 'LUCASPROMO', tipo: 'autonomo', hotel_nome: null, telefone: '(54) 99123-9988', status: 'ativo' },
      { id: 'V-MOCK-4', nome: 'Camila Rossi (Promotora)', codigo: 'CAMILA01', tipo: 'autonomo', hotel_nome: 'Região: Gramado - RS', telefone: '(54) 99188-3344', status: 'ativo' },
      { id: 'V-MOCK-5', nome: 'Roberto Carlos Silveira', codigo: 'ROBERTO01', tipo: 'uber', hotel_nome: 'Motorista Executivo Gramado', telefone: '(54) 99655-1122', status: 'ativo' }
    ];

    const vendedoresMap = new Map();
    mockVendedoresExemplo.forEach(mv => vendedoresMap.set(mv.codigo?.toUpperCase(), mv));
    vendedores.forEach(v => vendedoresMap.set(v.codigo?.toUpperCase() || v.nome?.toUpperCase(), v));

    leadsFinal.forEach(l => {
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

    const vendedoresFinal = Array.from(vendedoresMap.values());

    // 3. Cervejarias: combina oficiais, leads e cadastros
    const defaultCervs = [
      { id: 1, nome: 'Cervejaria Farol', cidade: 'Canela', status: 'ativo', endereco: 'R. Severino Inocente Zini, 150', telefone: '(54) 3282-7007' },
      { id: 2, nome: 'Cervejaria Gramado Bier', cidade: 'Gramado', status: 'ativo', endereco: 'Av. das Hortênsias, 5000', telefone: '(54) 3286-1234' },
      { id: 3, nome: 'Cervejaria Rasen Bier', cidade: 'Gramado', status: 'ativo', endereco: 'Rua Caxias do Sul, 356', telefone: '(54) 3286-6888' },
      { id: 4, nome: 'Cervejaria Edelbrau', cidade: 'Nova Petrópolis', status: 'ativo', endereco: 'Av. 15 de Novembro, 4024', telefone: '(54) 3281-4555' },
      { id: 5, nome: 'Cervejaria Kraustin Bier', cidade: 'Canela', status: 'ativo', endereco: 'Rua Borges de Medeiros, 800', telefone: '(54) 3282-9900' },
      { id: 6, nome: 'Cervejaria Gramado Sunset', cidade: 'Gramado', status: 'ativo', endereco: 'Contato: Fábio Goulart', telefone: '(54) 98111-7788' }
    ];

    const cervejariasMap = new Map();
    defaultCervs.forEach(c => cervejariasMap.set(c.nome.toLowerCase(), c));
    cervejarias.forEach(c => cervejariasMap.set(c.nome?.toLowerCase(), c));

    leadsFinal.forEach(l => {
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
            status: 'ativo',
            created_at: l.created_at
          });
        }
      }
    });

    const cervejariasFinal = Array.from(cervejariasMap.values());

    // 4. Hotéis Parceiros
    const defaultHoteis = [
      { id: 1, nome: 'Hotel Casa da Montanha', endereco: 'Av. Borges de Medeiros, 3166 - Gramado', tel: '(54) 3286-5000', resp: 'Concierge Chefe', status: 'ativo' },
      { id: 2, nome: 'Hotel Alpestre', endereco: 'Rua Ceará, 94 - Bairro Planalto - Gramado', tel: '(54) 3286-3555', resp: 'Recepção Executiva', status: 'ativo' },
      { id: 3, nome: 'Grande Hotel Canela', endereco: 'Rua Getúlio Vargas, 300 - Canela', tel: '(54) 3282-1285', resp: 'Gerência de Atendimento', status: 'ativo' },
      { id: 4, nome: 'Villa Bella Hotel & Spa', endereco: 'Rua Villa Bella, 125 - Gramado', tel: '(54) 3295-8100', resp: 'Equipe de Hospedagem', status: 'ativo' },
    ];

    // 5. Pedidos de demonstração e histórico
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
    }

    // 6. Cards de demonstração e histórico
    if (cards.length === 0) {
      cards = [
        { id: 'CARD-MOCK-1', codigo_passe: 'BS-VIP-12345', titular_nome: 'TURISTA VIP DE TESTE', titular_cpf: '11111111111', modalidade: 'brinda_bem', saldo_total: 3, saldo_restante: 2, status: 'ativo', data_validade_formatada: '31/12/2026', qr_token: 'QR-TESTE-12345' },
        { id: 'CARD-MOCK-2', codigo_passe: 'BS-VIP-45891', titular_nome: 'Marcos Vinicius Santos', titular_cpf: '458.912.830-11', modalidade: 'brinda_bem', saldo_total: 3, saldo_restante: 3, status: 'ativo', data_validade_formatada: '12/10/2026', qr_token: 'BS-45891283011-9021' },
        { id: 'CARD-MOCK-3', codigo_passe: 'BS-VIP-61234', titular_nome: 'Carla Beatriz Menezes', titular_cpf: '612.345.980-44', modalidade: 'brinda_premium', saldo_total: 5, saldo_restante: 4, status: 'ativo', data_validade_formatada: '12/10/2026', qr_token: 'BS-61234598044-9020' },
        { id: 'CARD-MOCK-4', codigo_passe: 'BS-VIP-61235', titular_nome: 'Lucas Menezes (Convidado)', titular_cpf: '612.999.000-22', modalidade: 'brinda_premium', saldo_total: 5, saldo_restante: 5, status: 'ativo', data_validade_formatada: '12/10/2026', qr_token: 'BS-61299900022-9020' }
      ];
    }

    // 7. Validações
    if (validacoes.length === 0) {
      validacoes = [
        { id: 'VAL-001', titular_cpf: '11111111111', titular_nome: 'TURISTA VIP DE TESTE', cervejaria_id: 1, cervejaria_nome: 'Cervejaria Farol', saldo_anterior: 3, saldo_pos: 2, validado_em: new Date(Date.now() - 1800000).toISOString(), validado_por: 'farol' },
        { id: 'VAL-002', titular_cpf: '612.345.980-44', titular_nome: 'Carla Beatriz Menezes', cervejaria_id: 3, cervejaria_nome: 'Cervejaria Rasen Bier', saldo_anterior: 5, saldo_pos: 4, validado_em: new Date(Date.now() - 7200000).toISOString(), validado_por: 'rasen' }
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
        leads_total: leadsFinal.length,
        origens: origensContagem
      },
      pedidos,
      cards,
      validacoes,
      vendedores: vendedoresResumo,
      comissoes,
      leads: leadsFinal,
      cervejarias: cervejariasFinal,
      hoteis: defaultHoteis
    });

  } catch (err) {
    console.error('Erro na API Administrativa:', err);
    return res.status(500).json({ error: 'Erro ao carregar dados do painel administrativo.' });
  }
};
