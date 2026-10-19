// api/admin.js
// Endpoint Serverless Vercel: Painel Administrativo de Controle e Auditoria
const { getSupabaseClient, isSupabaseConfigured } = require('../lib/supabase');
const { 
  store, 
  getEffectiveStatus, 
  setOverride, 
  addExclusao, 
  isExcluido,
  addVendedor,
  addHotel,
  addCervejaria
} = require('../lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();

  // Tratamento de POST (Ações Administrativas)
  if (req.method === 'POST') {
    try {
      const { action, payload } = req.body || {};

      if (!action) {
        return res.status(400).json({ error: 'Ação administrativa não informada.' });
      }

      // 1. Cadastrar Vendedor
      if (action === 'criar_vendedor') {
        const { nome, codigo, tipo, hotel_nome, telefone } = payload || {};
        if (!nome || !codigo) return res.status(400).json({ error: 'Nome e Código são obrigatórios.' });

        const novo = {
          id: Date.now(),
          nome: nome.trim(),
          codigo: codigo.trim().toUpperCase(),
          tipo: (tipo || 'autonomo').trim(),
          hotel_nome: hotel_nome ? hotel_nome.trim() : null,
          telefone: telefone ? telefone.trim() : null,
          status: 'ativo',
          created_at: new Date().toISOString()
        };
        addVendedor(novo);

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('vendedores').insert(novo);
        }

        return res.status(201).json({ sucesso: true, vendedor: novo });
      }

      // 2. Alterar Status do Vendedor (Ativar/Desativar)
      if (action === 'toggle_vendedor') {
        const { id, codigo, nome, status } = payload || {};
        const key = codigo || nome || String(id);
        const newStatus = status || 'ativo';
        setOverride(key, newStatus);
        if (nome) setOverride(nome, newStatus);
        if (codigo) setOverride(codigo, newStatus);

        if (supabase && isSupabaseConfigured()) {
          let q = supabase.from('vendedores').update({ status: newStatus });
          if (id) q = q.eq('id', id);
          else if (codigo) q = q.eq('codigo', codigo);
          await q;
        }

        return res.json({ sucesso: true, mensagem: `Vendedor ${newStatus === 'ativo' ? 'reativado' : 'desativado'}.` });
      }

      // 3. Excluir Vendedor
      if (action === 'excluir_vendedor') {
        const { id, codigo, nome } = payload || {};
        const key = codigo || nome || String(id);
        addExclusao('vendedores', key);
        if (codigo) addExclusao('vendedores', codigo);
        if (nome) addExclusao('vendedores', nome);

        store.vendedores = store.vendedores.filter(v => 
          v.codigo !== codigo && v.nome !== nome && String(v.id) !== String(id)
        );

        if (supabase && isSupabaseConfigured()) {
          let q = supabase.from('vendedores').delete();
          if (id) q = q.eq('id', id);
          else if (codigo) q = q.eq('codigo', codigo);
          await q;
        }

        return res.json({ sucesso: true, mensagem: 'Vendedor excluído com sucesso.' });
      }

      // 3.1 Atualizar Dados do Vendedor
      if (action === 'atualizar_vendedor') {
        const { codigoOriginal, nome, codigo, tipo, hotel_nome, telefone, status } = payload || {};
        const targetCodigo = (codigoOriginal || codigo || '').trim().toUpperCase();
        if (!targetCodigo) return res.status(400).json({ error: 'Código do vendedor é obrigatório.' });

        const novoCodigo = (codigo || targetCodigo).trim().toUpperCase();
        const novoStatus = status || 'ativo';

        store.vendedores = store.vendedores.map(v => {
          if (v.codigo && v.codigo.toUpperCase() === targetCodigo) {
            return {
              ...v,
              nome: (nome || v.nome).trim(),
              codigo: novoCodigo,
              tipo: tipo || v.tipo,
              hotel_nome: hotel_nome !== undefined ? hotel_nome : v.hotel_nome,
              telefone: telefone || v.telefone,
              status: novoStatus
            };
          }
          return v;
        });

        setOverride(novoCodigo, novoStatus);

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('vendedores').update({
            nome: (nome || '').trim(),
            codigo: novoCodigo,
            tipo: tipo || 'autonomo',
            hotel_nome: hotel_nome || null,
            telefone: telefone || null,
            status: novoStatus
          }).eq('codigo', targetCodigo);
        }

        return res.json({ sucesso: true, mensagem: 'Dados do vendedor atualizados com sucesso.' });
      }

      // 4. Cadastrar Hotel Parceiro
      if (action === 'criar_hotel') {
        const { nome, endereco, cidade, telefone, resp } = payload || {};
        if (!nome) return res.status(400).json({ error: 'Nome do hotel é obrigatório.' });

        const novo = {
          id: Date.now(),
          nome: nome.trim(),
          cidade: cidade || 'Serra Gaúcha',
          endereco: endereco || '',
          tel: telefone || '',
          resp: resp || 'Concierge',
          status: 'ativo'
        };
        addHotel(novo);

        if (supabase && isSupabaseConfigured()) {
          const codigoHotel = `HOTEL${Math.floor(10 + Math.random() * 89)}`;
          await supabase.from('vendedores').insert({
            nome: `${resp || 'Concierge'} (${nome.trim()})`,
            codigo: codigoHotel,
            tipo: 'hotel',
            hotel_nome: nome.trim(),
            telefone: telefone || null,
            status: 'ativo'
          });
        }

        return res.status(201).json({ sucesso: true, hotel: novo });
      }

      // 5. Alterar Status do Hotel (Ativar/Desativar)
      if (action === 'toggle_hotel') {
        const { nome, status } = payload || {};
        const newStatus = status || 'ativo';
        if (nome) {
          setOverride(nome, newStatus);
          store.hoteis = store.hoteis.map(h => {
            if (h.nome.toLowerCase().trim() === String(nome).toLowerCase().trim()) {
              return { ...h, status: newStatus };
            }
            return h;
          });
        }

        if (supabase && isSupabaseConfigured() && nome) {
          await supabase.from('vendedores').update({ status: newStatus }).eq('hotel_nome', nome);
        }

        return res.json({ sucesso: true, mensagem: `Hotel ${newStatus === 'ativo' ? 'reativado' : 'desativado'}.` });
      }

      // 6. Excluir Hotel
      if (action === 'excluir_hotel') {
        const { nome } = payload || {};
        if (nome) {
          addExclusao('hoteis', nome);
          store.hoteis = store.hoteis.filter(h => h.nome.toLowerCase().trim() !== String(nome).toLowerCase().trim());
        }

        if (supabase && isSupabaseConfigured() && nome) {
          await supabase.from('vendedores').delete().eq('hotel_nome', nome);
        }

        return res.json({ sucesso: true, mensagem: 'Hotel excluído com sucesso.' });
      }

      // 6.1 Atualizar Hotel Parceiro
      if (action === 'atualizar_hotel') {
        const { nomeOriginal, nome, endereco, cidade, telefone, resp, status } = payload || {};
        const targetNome = nomeOriginal || nome;
        if (!targetNome) return res.status(400).json({ error: 'Nome do hotel é obrigatório.' });

        const novoNome = (nome || targetNome).trim();
        const novoStatus = status || 'ativo';

        store.hoteis = store.hoteis.map(h => {
          if (h.nome.toLowerCase().trim() === targetNome.toLowerCase().trim()) {
            return {
              ...h,
              nome: novoNome,
              cidade: cidade || h.cidade,
              endereco: endereco !== undefined ? endereco : h.endereco,
              tel: telefone !== undefined ? telefone : h.tel,
              resp: resp !== undefined ? resp : h.resp,
              status: novoStatus
            };
          }
          return h;
        });

        setOverride(novoNome, novoStatus);

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('vendedores').update({
            hotel_nome: novoNome,
            nome: `${resp || 'Concierge'} (${novoNome})`,
            telefone: telefone || null,
            status: novoStatus
          }).eq('hotel_nome', targetNome);
        }

        return res.json({ sucesso: true, mensagem: 'Dados do hotel atualizados com sucesso.' });
      }

      // 7. Cadastrar Cervejaria Parceira
      if (action === 'criar_cervejaria') {
        const { nome, cidade, endereco, telefone, tour_guiado, pin_acesso } = payload || {};
        if (!nome || !cidade) return res.status(400).json({ error: 'Nome e Cidade são obrigatórios.' });

        const slug = nome.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(10 + Math.random() * 89);
        const nova = {
          id: Date.now(),
          nome: nome.trim(),
          cidade: cidade.trim(),
          slug: slug,
          endereco: endereco ? endereco.trim() : null,
          telefone: telefone ? telefone.trim() : null,
          tour_guiado: Boolean(tour_guiado),
          pin_acesso: pin_acesso || '1234',
          status: 'ativo',
          created_at: new Date().toISOString()
        };
        addCervejaria(nova);

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('cervejarias').insert(nova);
        }

        return res.status(201).json({ sucesso: true, cervejaria: nova });
      }

      // 8. Alterar Status de Cervejaria (Ativar/Desativar)
      if (action === 'toggle_cervejaria') {
        const { id, nome, status } = payload || {};
        const newStatus = status || 'ativo';
        if (nome) setOverride(nome, newStatus);
        if (id) setOverride(String(id), newStatus);

        if (supabase && isSupabaseConfigured()) {
          let q = supabase.from('cervejarias').update({ status: newStatus });
          if (id) q = q.eq('id', id);
          else if (nome) q = q.eq('nome', nome);
          await q;
        }

        return res.json({ sucesso: true, mensagem: `Cervejaria ${newStatus === 'ativo' ? 'reativada' : 'desativada'}.` });
      }

      // 9. Excluir Cervejaria
      if (action === 'excluir_cervejaria') {
        const { id, nome } = payload || {};
        if (nome) addExclusao('cervejarias', nome);
        if (id) addExclusao('cervejarias', String(id));

        store.cervejarias = store.cervejarias.filter(c => 
          c.nome !== nome && String(c.id) !== String(id)
        );

        if (supabase && isSupabaseConfigured()) {
          let q = supabase.from('cervejarias').delete();
          if (id) q = q.eq('id', id);
          else if (nome) q = q.eq('nome', nome);
          await q;
        }

        return res.json({ sucesso: true, mensagem: 'Cervejaria excluída com sucesso.' });
      }

      // 9.1 Atualizar Cervejaria
      if (action === 'atualizar_cervejaria') {
        const { nomeOriginal, nome, cidade, endereco, telefone, tour_guiado, status } = payload || {};
        const targetNome = nomeOriginal || nome;
        if (!targetNome) return res.status(400).json({ error: 'Nome da cervejaria é obrigatório.' });

        const novoNome = (nome || targetNome).trim();
        const novoStatus = status || 'ativo';

        store.cervejarias = store.cervejarias.map(c => {
          if (c.nome.toLowerCase().trim() === targetNome.toLowerCase().trim()) {
            return {
              ...c,
              nome: novoNome,
              cidade: cidade || c.cidade,
              endereco: endereco !== undefined ? endereco : c.endereco,
              telefone: telefone || c.telefone,
              tour_guiado: tour_guiado !== undefined ? Boolean(tour_guiado) : c.tour_guiado,
              status: novoStatus
            };
          }
          return c;
        });

        setOverride(novoNome, novoStatus);

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('cervejarias').update({
            nome: novoNome,
            cidade: cidade || 'Serra Gaúcha',
            endereco: endereco || null,
            telefone: telefone || null,
            tour_guiado: Boolean(tour_guiado),
            status: novoStatus
          }).eq('nome', targetNome);
        }

        return res.json({ sucesso: true, mensagem: 'Dados da cervejaria atualizados com sucesso.' });
      }

      // 9.2 Atualizar Status do Ticket de Suporte (SAC)
      if (action === 'atualizar_ticket') {
        const { id, status, resposta_admin } = payload || {};
        if (!id) return res.status(400).json({ error: 'ID do ticket é obrigatório.' });

        store.tickets = (store.tickets || []).map(t => {
          if (t.id === id) {
            return {
              ...t,
              status: status || t.status,
              resposta_admin: resposta_admin !== undefined ? resposta_admin : t.resposta_admin,
              respondido_em: new Date().toISOString()
            };
          }
          return t;
        });

        if (supabase && isSupabaseConfigured()) {
          try {
            await supabase.from('tickets_suporte').update({
              status: status || 'respondido',
              resposta_admin: resposta_admin || null,
              updated_at: new Date().toISOString()
            }).eq('id', id);
          } catch (e) {}
        }

        return res.json({ sucesso: true, mensagem: 'Ticket atualizado com sucesso.' });
      }

      // 10. Atualizar Status de Lead B2B
      if (action === 'atualizar_lead') {
        const { id, status } = payload || {};
        setOverride(id, status);

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('leads').update({ status }).eq('id', id);
        }

        return res.json({ sucesso: true, mensagem: `Status do lead atualizado para ${status}.` });
      }

      // 11. Excluir Lead B2B
      if (action === 'excluir_lead') {
        const { id, nome } = payload || {};
        if (id) addExclusao('leads', id);
        if (nome) addExclusao('leads', nome);

        store.leads = store.leads.filter(l => l.id !== id && l.nome !== nome);

        if (supabase && isSupabaseConfigured()) {
          await supabase.from('leads').delete().eq('id', id);
        }

        return res.json({ sucesso: true, mensagem: 'Lead excluído com sucesso.' });
      }

      // 12. Pagar Comissão
      if (action === 'pagar_comissao') {
        const { vendedor_codigo, id } = payload || {};
        if (supabase && isSupabaseConfigured()) {
          let query = supabase.from('comissoes').update({ status_pagamento: 'pago' });
          if (id) query = query.eq('id', id);
          else if (vendedor_codigo) query = query.eq('vendedor_codigo', vendedor_codigo).eq('status_pagamento', 'pendente');
          await query;
        }
        return res.json({ sucesso: true, mensagem: 'Comissões marcadas como pagas.' });
      }

      // 13. Alterar Status de Card (Ativar/Bloquear)
      if (action === 'toggle_card') {
        const { id, codigo_passe, status } = payload || {};
        const newStatus = status || 'ativo';
        if (codigo_passe) setOverride(codigo_passe, newStatus);
        if (id) setOverride(id, newStatus);

        if (supabase && isSupabaseConfigured()) {
          let q = supabase.from('cards').update({ status: newStatus });
          if (id) q = q.eq('id', id);
          else if (codigo_passe) q = q.eq('codigo_passe', codigo_passe);
          await q;
        }

        return res.json({ sucesso: true, mensagem: `Card ${newStatus === 'ativo' ? 'reativado' : 'bloqueado'}.` });
      }

      // 14. Excluir Card
      if (action === 'excluir_card') {
        const { id, codigo_passe } = payload || {};
        if (codigo_passe) addExclusao('cards', codigo_passe);
        if (id) addExclusao('cards', id);

        if (supabase && isSupabaseConfigured()) {
          let q = supabase.from('cards').delete();
          if (id) q = q.eq('id', id);
          else if (codigo_passe) q = q.eq('codigo_passe', codigo_passe);
          await q;
        }

        return res.json({ sucesso: true, mensagem: 'Card excluído com sucesso.' });
      }

      return res.json({ sucesso: true, mensagem: 'Ação executada.' });

    } catch (err) {
      console.error('Erro em ação administrativa POST:', err);
      return res.status(500).json({ error: err.message || 'Erro ao processar ação administrativa.' });
    }
  }

  // Tratamento de GET (Carga Consolidada do Painel de Controle)
  try {
    let pedidos = [];
    let cards = [];
    let validacoes = [];
    let vendedores = [];
    let comissoes = [];
    let leads = [];
    let cervejarias = [];
    let clientes = [];
    let tickets = [];

    if (supabase && isSupabaseConfigured()) {
      const [
        resPed,
        resCards,
        resVal,
        resVend,
        resCom,
        resLeads,
        resCerv,
        resCli,
        resTick
      ] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('cards').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('validacoes').select('*').order('validado_em', { ascending: false }).limit(200),
        supabase.from('vendedores').select('*').order('created_at', { ascending: false }),
        supabase.from('comissoes').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('cervejarias').select('*').order('id', { ascending: true }),
        supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(200).catch(() => ({ data: [] })),
        supabase.from('tickets_suporte').select('*').order('created_at', { ascending: false }).limit(200).catch(() => ({ data: [] }))
      ]);

      pedidos = resPed.data || [];
      cards = resCards.data || [];
      validacoes = resVal.data || [];
      vendedores = resVend.data || [];
      comissoes = resCom.data || [];
      leads = resLeads.data || [];
      cervejarias = resCerv.data || [];
      clientes = resCli?.data || [];
      tickets = resTick?.data || [];
    }

    // 1. Leads: mescla Supabase e Store (sem mock falso)
    const leadsMap = new Map();
    leads.forEach(l => leadsMap.set(String(l.id || l.telefone || l.nome).toLowerCase(), l));
    store.leads.forEach(l => leadsMap.set(String(l.id || l.telefone || l.nome).toLowerCase(), l));

    const leadsFinal = Array.from(leadsMap.values())
      .map(l => {
        const status = getEffectiveStatus('leads', l.id || l.nome, l.status || 'novo');
        return { ...l, status };
      })
      .filter(l => !isExcluido('leads', l.id) && !isExcluido('leads', l.nome));

    // 2. Vendedores: padrão oficial + banco + cadastros
    const defaultVendedores = [
      { id: 1, nome: 'Pedro da Silva (Motorista Uber)', codigo: 'PEDRO01', tipo: 'uber', hotel_nome: null, telefone: '(54) 99812-4455', status: 'ativo' },
      { id: 2, nome: 'Concierge Casa da Montanha', codigo: 'HOTEL01', tipo: 'hotel', hotel_nome: 'Hotel Casa da Montanha', telefone: '(54) 3286-5000', status: 'ativo' },
      { id: 3, nome: 'Lucas Promotor de Turismo', codigo: 'LUCASPROMO', tipo: 'autonomo', hotel_nome: null, telefone: '(54) 99123-9988', status: 'ativo' }
    ];

    const vendMap = new Map();
    defaultVendedores.forEach(v => vendMap.set(v.codigo.toUpperCase(), v));
    vendedores.forEach(v => vendMap.set(v.codigo?.toUpperCase(), v));
    store.vendedores.forEach(v => vendMap.set(v.codigo?.toUpperCase(), v));

    // Inclui leads de vendedores como parceiros no painel
    leadsFinal.forEach(l => {
      if (l.tipo === 'vendedor') {
        const first = (l.nome?.split(' ')[0] || 'VEND').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const code = `${first}01`;
        if (!vendMap.has(code) && !Array.from(vendMap.values()).some(v => v.telefone === l.telefone)) {
          vendMap.set(code, {
            id: l.id || Date.now(),
            nome: l.nome,
            codigo: code,
            tipo: l.categoria || 'autonomo',
            hotel_nome: l.empresa_nome || (l.cidade ? `Região: ${l.cidade}` : 'Autônomo'),
            telefone: l.telefone,
            status: l.status === 'desativado' ? 'inativo' : 'ativo'
          });
        }
      }
    });

    const vendedoresFinal = Array.from(vendMap.values())
      .map(v => {
        const status = getEffectiveStatus('vendedores', v.codigo || v.nome, v.status || 'ativo');
        return { ...v, status };
      })
      .filter(v => !isExcluido('vendedores', v.codigo) && !isExcluido('vendedores', v.nome));

    // 3. Cervejarias: padrão oficial + banco + store + leads
    const defaultCervs = [
      { id: 1, nome: 'Cervejaria Farol', cidade: 'Canela', status: 'ativo', endereco: 'R. Severino Inocente Zini, 150', telefone: '(54) 3282-7007' },
      { id: 2, nome: 'Cervejaria Gramado Bier', cidade: 'Gramado', status: 'ativo', endereco: 'Av. das Hortênsias, 5000', telefone: '(54) 3286-1234' },
      { id: 3, nome: 'Cervejaria Rasen Bier', cidade: 'Gramado', status: 'ativo', endereco: 'Rua Caxias do Sul, 356', telefone: '(54) 3286-6888' },
      { id: 4, nome: 'Cervejaria Edelbrau', cidade: 'Nova Petrópolis', status: 'ativo', endereco: 'Av. 15 de Novembro, 4024', telefone: '(54) 3281-4555' },
      { id: 5, nome: 'Cervejaria Kraustin Bier', cidade: 'Canela', status: 'ativo', endereco: 'Rua Borges de Medeiros, 800', telefone: '(54) 3282-9900' }
    ];

    const cervMap = new Map();
    defaultCervs.forEach(c => cervMap.set(c.nome.toLowerCase().trim(), c));
    store.cervejarias.forEach(c => cervMap.set(c.nome.toLowerCase().trim(), c));
    cervejarias.forEach(c => cervMap.set(c.nome?.toLowerCase().trim(), c));

    // Se houver lead de cervejaria, exibe também na lista
    leadsFinal.forEach(l => {
      if (l.tipo === 'cervejaria') {
        const bName = l.empresa_nome || (l.nome.includes('Cervejaria') ? l.nome : `Cervejaria ${l.nome}`);
        const key = bName.toLowerCase().trim();
        if (!cervMap.has(key)) {
          cervMap.set(key, {
            id: l.id || Date.now(),
            nome: bName,
            cidade: l.cidade || 'Serra Gaúcha',
            endereco: `Contato: ${l.nome}`,
            telefone: l.telefone,
            tour_guiado: false,
            pin_acesso: '1234',
            status: l.status === 'desativado' ? 'inativo' : 'ativo',
            created_at: l.created_at
          });
        }
      }
    });

    const cervejariasFinal = Array.from(cervMap.values())
      .map(c => {
        const status = getEffectiveStatus('cervejarias', c.nome, c.status || 'ativo');
        return { ...c, status };
      })
      .filter(c => !isExcluido('cervejarias', c.nome));

    // 4. Hotéis Parceiros: padrão + store + supabase
    const hotelMap = new Map();
    store.hoteis.forEach(h => {
      const status = getEffectiveStatus('hoteis', h.nome, h.status || 'ativo');
      hotelMap.set(h.nome.toLowerCase().trim(), { ...h, status });
    });

    const hoteisFinal = Array.from(hotelMap.values())
      .filter(h => !isExcluido('hoteis', h.nome));

    // 5. Pedidos de demonstração se banco estiver vazio
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
          valor_unitario_exp: 190.00,
          qtd_cards: 2,
          valor_total: 390.00,
          forma_pagamento: 'CARTAO_CREDITO',
          status: 'pago',
          origem_tipo: 'uber',
          origem_detalhe: 'Motorista Pedro Silva',
          vendedor_codigo: 'PEDRO01'
        }
      ];
    }

    // 6. Cards de demonstração se banco estiver vazio
    if (cards.length === 0) {
      cards = [
        { id: 'CARD-MOCK-1', codigo_passe: 'BS-VIP-12345', titular_nome: 'TURISTA VIP DE TESTE', titular_cpf: '11111111111', modalidade: 'brinda_bem', saldo_total: 3, saldo_restante: 2, status: 'ativo', data_validade_formatada: '31/12/2026', qr_token: 'QR-TESTE-12345' },
        { id: 'CARD-MOCK-2', codigo_passe: 'BS-VIP-45891', titular_nome: 'Marcos Vinicius Santos', titular_cpf: '458.912.830-11', modalidade: 'brinda_bem', saldo_total: 3, saldo_restante: 3, status: 'ativo', data_validade_formatada: '12/10/2026', qr_token: 'BS-45891283011-9021' }
      ];
    }

    // 7. Validações se banco estiver vazio
    if (validacoes.length === 0) {
      validacoes = [
        { id: 'VAL-001', titular_cpf: '11111111111', titular_nome: 'TURISTA VIP DE TESTE', cervejaria_id: 1, cervejaria_nome: 'Cervejaria Farol', saldo_anterior: 3, saldo_pos: 2, validado_em: new Date(Date.now() - 1800000).toISOString(), validado_por: 'farol' }
      ];
    }

    // 8. Comissões
    if (comissoes.length === 0) {
      comissoes = [
        { id: 'COM-01', vendedor_codigo: 'PEDRO01', pedido_id: 'BS-ORD-9020', pagador_cpf: '612.345.980-44', valor_comissao: 20.00, status_pagamento: 'pendente', data_fechamento: '31/10/2026', data_pagamento: '10/11/2026', created_at: new Date().toISOString() },
        { id: 'COM-02', vendedor_codigo: 'HOTEL01', pedido_id: 'BS-ORD-9021', pagador_cpf: '458.912.830-11', valor_comissao: 20.00, status_pagamento: 'pendente', data_fechamento: '31/10/2026', data_pagamento: '10/11/2026', created_at: new Date().toISOString() }
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

    // Mesclar tickets do store com banco
    const ticketsMap = new Map();
    (store.tickets || []).forEach(t => ticketsMap.set(t.id, t));
    tickets.forEach(t => ticketsMap.set(t.id, t));
    const ticketsFinal = Array.from(ticketsMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Audit logs consolidados
    const auditLogsFinal = [...(store.audit_logs || [])];
    clientes.forEach(c => {
      let historico = [];
      try {
        historico = Array.isArray(c.historico_alteracoes) ? c.historico_alteracoes : JSON.parse(c.historico_alteracoes || '[]');
      } catch (e) {}
      historico.forEach(entry => auditLogsFinal.push(entry));
    });

    return res.json({
      sucesso: true,
      ambiente: supabase && isSupabaseConfigured() ? 'Supabase PostgreSQL (Produção)' : 'Ambiente Resiliente Local',
      metricas: {
        faturamento_total: totalFaturamento,
        pedidos_pagos: totalPedidosPagos,
        cards_ativos: totalCardsAtivos,
        validacoes_total: totalValidacoes,
        leads_total: leadsFinal.length,
        tickets_abertos: ticketsFinal.filter(t => t.status === 'aberto').length,
        origens: origensContagem
      },
      pedidos,
      cards,
      validacoes,
      vendedores: vendedoresResumo,
      comissoes,
      leads: leadsFinal,
      cervejarias: cervejariasFinal,
      hoteis: hoteisFinal,
      tickets: ticketsFinal,
      clientes,
      audit_logs: auditLogsFinal
    });

  } catch (err) {
    console.error('Erro na API Administrativa:', err);
    return res.status(500).json({ error: 'Erro ao carregar dados do painel administrativo.' });
  }
};
