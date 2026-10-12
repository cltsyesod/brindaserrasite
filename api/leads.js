// api/leads.js
// Endpoint Serverless Vercel: Captação de Leads B2B (Promotores, Motoristas e Cervejarias)
const { getSupabaseClient, isSupabaseConfigured } = require('../lib/supabase');
const { addLead, addVendedor, addCervejaria } = require('../lib/store');

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
      id: `LEAD-${Date.now()}`,
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

    // Registra na memória compartilhada
    addLead(leadData);

    const supabase = getSupabaseClient();

    // Se for vendedor, gera código único para que apareça automaticamente na gestão de vendedores
    let novoVendedor = null;
    if (tipo === 'vendedor') {
      const primeiroNome = (nome.trim().split(' ')[0] || 'VEND').replace(/[^a-zA-Z]/g, '').toUpperCase();
      const randomNum = Math.floor(10 + Math.random() * 89);
      const codigoVendedor = `${primeiroNome}${randomNum}`;

      novoVendedor = {
        id: Date.now(),
        nome: leadData.nome,
        codigo: codigoVendedor,
        tipo: categoria || 'autonomo',
        hotel_nome: empresa_nome || (cidade ? `Região: ${cidade}` : null),
        telefone: leadData.telefone,
        status: 'ativo',
        created_at: leadData.created_at
      };
      addVendedor(novoVendedor);
    }

    // Se for cervejaria, cadastra também em cervejarias para que apareça automaticamente na gestão de cervejarias
    let novaCervejaria = null;
    if (tipo === 'cervejaria') {
      const breweryTitle = empresa_nome ? empresa_nome.trim() : (nome.trim().includes('Cervejaria') ? nome.trim() : `Cervejaria ${nome.trim()}`);
      const slug = breweryTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(10 + Math.random() * 89);
      novaCervejaria = {
        id: Date.now(),
        nome: breweryTitle,
        cidade: cidade ? cidade.trim() : 'Serra Gaúcha',
        slug: slug,
        endereco: `Contato: ${leadData.nome}`,
        telefone: leadData.telefone,
        tour_guiado: false,
        pin_acesso: '1234',
        status: 'ativo',
        created_at: leadData.created_at
      };
      addCervejaria(novaCervejaria);
    }

    if (supabase && isSupabaseConfigured()) {
      // 1. Salva em leads
      const { error: errLead } = await supabase.from('leads').insert(leadData);
      if (errLead) {
        console.warn('Erro ao inserir na tabela leads do Supabase:', errLead.message);
      }

      // 2. Se for vendedor, cadastra também em vendedores
      if (novoVendedor) {
        const { error: errVend } = await supabase.from('vendedores').insert(novoVendedor);
        if (errVend) {
          console.warn('Erro ao cadastrar vendedor na tabela vendedores do Supabase:', errVend.message);
        }
      }

      // 3. Se for cervejaria, cadastra também em cervejarias
      if (novaCervejaria) {
        const { error: errCerv } = await supabase.from('cervejarias').insert(novaCervejaria);
        if (errCerv) {
          console.warn('Erro ao cadastrar cervejaria na tabela cervejarias do Supabase:', errCerv.message);
        }
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
