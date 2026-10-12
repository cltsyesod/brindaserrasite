// api/checkout.js
// Endpoint Serverless Vercel: Processamento de Checkout e Emissão do BRINDA CARD no Supabase
const QRCode = require('qrcode');
const { getSupabaseClient, isSupabaseConfigured } = require('../lib/supabase');

async function generateQrDataUri(payload) {
  try {
    return await QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: { dark: '#1A1D1A', light: '#FFFFFF' }
    });
  } catch (err) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`;
  }
}

module.exports = async function handler(req, res) {
  // CORS
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
    const {
      pagador,
      plano_cervejaria,
      comprar_para_si,
      terceiros,
      forma_pagamento,
      origem_tipo,
      origem_detalhe,
      vendedor_codigo
    } = req.body || {};

    if (!pagador || !pagador.nome || !pagador.cpf || !pagador.email) {
      return res.status(400).json({
        error: 'Dados obrigatórios do titular não informados (Nome, CPF e E-mail).'
      });
    }

    const cleanCpf = pagador.cpf.replace(/\D/g, '');
    const hoje = new Date();
    const dataValidade = new Date(hoje);
    dataValidade.setMonth(dataValidade.getMonth() + 6);
    const validadeFormatada = dataValidade.toLocaleDateString('pt-BR');

    // Cálculo comercial homologado
    let valorExp = 0.00;
    let saldoPorCard = 0;
    if (plano_cervejaria === 'brinda_bem') {
      valorExp = 130.00;
      saldoPorCard = 3;
    } else if (plano_cervejaria === 'brinda_premium') {
      valorExp = 190.00;
      saldoPorCard = 5;
    }

    const terceirosLista = Array.isArray(terceiros) ? terceiros.slice(0, 3) : [];
    const compraParaSi = comprar_para_si !== false;
    const qtdCards = (compraParaSi ? 1 : 0) + terceirosLista.length;

    if (qtdCards <= 0) {
      return res.status(400).json({ error: 'Nenhum passe selecionado para emissão.' });
    }

    const taxaAdesao = 10.00; // Taxa única da 1ª emissão
    const totalGeral = taxaAdesao + (valorExp * qtdCards);
    const pedidoId = `BS-ORD-${Date.now()}`;

    // Montagem dos cards oficiais
    const cardsParaEmitir = [];

    if (compraParaSi) {
      const codeSuffix = Math.floor(10000 + Math.random() * 90000);
      const tokenUuid = `BS-${cleanCpf}-${codeSuffix}`;
      cardsParaEmitir.push({
        id: `CARD-${cleanCpf}-0`,
        pedido_id: pedidoId,
        pagador_cpf: cleanCpf,
        titular_nome: pagador.nome.trim(),
        titular_cpf: cleanCpf,
        codigo_passe: `BS-VIP-${codeSuffix}`,
        modalidade: plano_cervejaria || 'base',
        saldo_total: saldoPorCard,
        saldo_restante: saldoPorCard,
        data_emissao: hoje.toISOString(),
        data_validade: dataValidade.toISOString(),
        data_validade_formatada: validadeFormatada,
        status: saldoPorCard > 0 ? 'ativo' : 'cadastrado_sem_saldo',
        qr_token: tokenUuid,
        is_pagador: true
      });
    }

    terceirosLista.forEach((t, idx) => {
      const cleanTerceiroCpf = (t.cpf || '').replace(/\D/g, '') || `DEP-${cleanCpf}-${idx + 1}`;
      const codeSuffix = Math.floor(10000 + Math.random() * 90000);
      const tokenUuid = `BS-${cleanTerceiroCpf}-${codeSuffix}`;
      cardsParaEmitir.push({
        id: `CARD-${cleanCpf}-${idx + 1}`,
        pedido_id: pedidoId,
        pagador_cpf: cleanCpf,
        titular_nome: (t.nome || `Convidado ${idx + 1}`).trim(),
        titular_cpf: cleanTerceiroCpf,
        codigo_passe: `BS-VIP-${codeSuffix}`,
        modalidade: plano_cervejaria || 'base',
        saldo_total: saldoPorCard,
        saldo_restante: saldoPorCard,
        data_emissao: hoje.toISOString(),
        data_validade: dataValidade.toISOString(),
        data_validade_formatada: validadeFormatada,
        status: saldoPorCard > 0 ? 'ativo' : 'cadastrado_sem_saldo',
        qr_token: tokenUuid,
        is_pagador: false
      });
    });

    const supabase = getSupabaseClient();

    // Se Supabase estiver conectado, persiste diretamente nas tabelas PostgreSQL
    if (supabase && isSupabaseConfigured()) {
      // 1. Upsert Cliente
      await supabase.from('clientes').upsert({
        nome: pagador.nome.trim(),
        cpf: cleanCpf,
        email: pagador.email.trim(),
        telefone: pagador.telefone || '',
        data_nasc: pagador.data_nasc || null,
        tem_historico_compras: true,
        updated_at: hoje.toISOString()
      }, { onConflict: 'cpf' });

      // 2. Insert Pedido
      await supabase.from('pedidos').insert({
        id: pedidoId,
        pagador_cpf: cleanCpf,
        pagador_nome: pagador.nome.trim(),
        plano_cervejaria: plano_cervejaria || 'base',
        taxa_adesao: taxaAdesao,
        valor_unitario_exp: valorExp,
        qtd_cards: qtdCards,
        valor_total: totalGeral,
        forma_pagamento: forma_pagamento || 'PIX',
        status: 'pago',
        origem_tipo: origem_tipo || 'direto',
        origem_detalhe: origem_detalhe || null,
        vendedor_codigo: vendedor_codigo || null,
        created_at: hoje.toISOString()
      });

      // 3. Insert Cards
      for (const card of cardsParaEmitir) {
        await supabase.from('cards').insert({
          id: card.id,
          pedido_id: card.pedido_id,
          pagador_cpf: card.pagador_cpf,
          titular_nome: card.titular_nome,
          titular_cpf: card.titular_cpf,
          codigo_passe: card.codigo_passe,
          modalidade: card.modalidade,
          saldo_total: card.saldo_total,
          saldo_restante: card.saldo_restante,
          data_emissao: card.data_emissao,
          data_validade: card.data_validade,
          data_validade_formatada: card.data_validade_formatada,
          status: card.status,
          qr_token: card.qr_token,
          is_pagador: card.is_pagador
        });
      }

      // 4. Registro de Comissão do Vendedor / Promotor (se houver indicação comercial)
      if (vendedor_codigo && valorExp > 0) {
        const { data: vendedor } = await supabase
          .from('vendedores')
          .select('id, codigo')
          .eq('codigo', vendedor_codigo.trim().toUpperCase())
          .maybeSingle();

        if (vendedor) {
          const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
          const diaPagamento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 10);
          await supabase.from('comissoes').insert({
            vendedor_id: vendedor.id,
            vendedor_codigo: vendedor.codigo,
            pedido_id: pedidoId,
            pagador_cpf: cleanCpf,
            valor_comissao: 20.00 * qtdCards,
            status_pagamento: 'pendente',
            data_fechamento: ultimoDiaMes.toISOString().split('T')[0],
            data_pagamento: diaPagamento.toISOString().split('T')[0]
          });
        }
      }
    }

    // Gerar QR Codes em Base64 para exibição e impressão instantânea
    for (const card of cardsParaEmitir) {
      card.qr_image_base64 = await generateQrDataUri(card.qr_token);
    }

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Pedido aprovado e BRINDA CARD oficial emitido com sucesso!',
      origem_armazenamento: isSupabaseConfigured() ? 'supabase' : 'preview_local',
      pedido: {
        id: pedidoId,
        pagador_nome: pagador.nome,
        pagador_cpf: cleanCpf,
        plano_cervejaria,
        qtd_cards: qtdCards,
        valor_total: totalGeral,
        forma_pagamento: forma_pagamento || 'PIX'
      },
      cards: cardsParaEmitir
    });

  } catch (err) {
    console.error('Erro na API de Checkout:', err);
    return res.status(500).json({
      error: 'Erro interno ao processar a emissão do BRINDA CARD.',
      detalhes: err.message
    });
  }
};
