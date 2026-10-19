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

    // Função de resolução de planos individuais (Fim da venda casada - Art. 39 CDC)
    function resolvePlanDetails(planoKey) {
      if (planoKey === 'brinda_bem') {
        return { valorExp: 130.00, saldo: 3, modalidade: 'brinda_bem', nome: 'Brinda Bem (3 Cervejarias)' };
      }
      if (planoKey === 'brinda_premium') {
        return { valorExp: 190.00, saldo: 5, modalidade: 'brinda_premium', nome: 'Brinda Premium (5 Cervejarias)' };
      }
      return { valorExp: 0.00, saldo: 0, modalidade: 'none', nome: 'Apenas BRINDA CARD (Sem Experiências)' };
    }

    const terceirosLista = Array.isArray(terceiros) ? terceiros.slice(0, 3) : [];
    const compraParaSi = comprar_para_si !== false;
    const qtdCards = (compraParaSi ? 1 : 0) + terceirosLista.length;

    if (qtdCards <= 0) {
      return res.status(400).json({ error: 'Nenhum passe selecionado para emissão.' });
    }

    const taxaAdesaoUnitaria = 10.00; // Taxa de emissão vitalícia por cartão
    const taxaAdesaoTotal = taxaAdesaoUnitaria * qtdCards;
    const pedidoId = `BS-ORD-${Date.now()}`;

    // Montagem dos cards oficiais com escolhas individuais de experiências
    const cardsParaEmitir = [];
    let totalValorExperiencias = 0.00;
    let totalSaldoExperiencias = 0;

    if (compraParaSi) {
      const planoTitularKey = pagador.plano_cervejaria || plano_cervejaria || 'none';
      const planoTitular = resolvePlanDetails(planoTitularKey);
      totalValorExperiencias += planoTitular.valorExp;
      totalSaldoExperiencias += planoTitular.saldo;

      const codeSuffix = Math.floor(10000 + Math.random() * 90000);
      const tokenUuid = `BS-${cleanCpf}-${codeSuffix}`;
      cardsParaEmitir.push({
        id: `CARD-${cleanCpf}-0`,
        pedido_id: pedidoId,
        pagador_cpf: cleanCpf,
        titular_nome: pagador.nome.trim(),
        titular_cpf: cleanCpf,
        codigo_passe: `BS-VIP-${codeSuffix}`,
        modalidade: planoTitular.modalidade,
        saldo_total: planoTitular.saldo,
        saldo_restante: planoTitular.saldo,
        valor_experiencia: planoTitular.valorExp,
        data_emissao: hoje.toISOString(),
        data_validade: dataValidade.toISOString(),
        data_validade_formatada: validadeFormatada,
        status: planoTitular.saldo > 0 ? 'ativo' : 'cadastrado_sem_saldo',
        qr_token: tokenUuid,
        is_pagador: true
      });
    }

    terceirosLista.forEach((t, idx) => {
      const planoGuestKey = t.plano_cervejaria || plano_cervejaria || 'none';
      const planoGuest = resolvePlanDetails(planoGuestKey);
      totalValorExperiencias += planoGuest.valorExp;
      totalSaldoExperiencias += planoGuest.saldo;

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
        modalidade: planoGuest.modalidade,
        saldo_total: planoGuest.saldo,
        saldo_restante: planoGuest.saldo,
        valor_experiencia: planoGuest.valorExp,
        data_emissao: hoje.toISOString(),
        data_validade: dataValidade.toISOString(),
        data_validade_formatada: validadeFormatada,
        status: planoGuest.saldo > 0 ? 'ativo' : 'cadastrado_sem_saldo',
        qr_token: tokenUuid,
        is_pagador: false
      });
    });

    const totalGeral = taxaAdesaoTotal + totalValorExperiencias;

    const supabase = getSupabaseClient();

    // Se Supabase estiver conectado, persiste diretamente nas tabelas PostgreSQL
    if (supabase && isSupabaseConfigured()) {
      let codVendedorEfetivo = vendedor_codigo ? vendedor_codigo.trim().toUpperCase() : null;

      // Se não veio vendedor neste pedido, busca no cadastro histórico do cliente
      if (!codVendedorEfetivo) {
        try {
          const { data: clienteExistente } = await supabase
            .from('clientes')
            .select('vendedor_origem_codigo')
            .eq('cpf', cleanCpf)
            .maybeSingle();
          if (clienteExistente && clienteExistente.vendedor_origem_codigo) {
            codVendedorEfetivo = clienteExistente.vendedor_origem_codigo;
          }
        } catch (e) {}
      }

      // 1. Upsert Cliente (preserva ou vincula o vendedor de origem)
      await supabase.from('clientes').upsert({
        nome: pagador.nome.trim(),
        cpf: cleanCpf,
        email: pagador.email.trim(),
        telefone: pagador.telefone || '',
        data_nasc: pagador.data_nasc || null,
        tem_historico_compras: true,
        vendedor_origem_codigo: codVendedorEfetivo || null,
        origem_tipo: origem_tipo || null,
        origem_detalhe: origem_detalhe || null,
        updated_at: hoje.toISOString()
      }, { onConflict: 'cpf' });

      // 2. Insert Pedido
      await supabase.from('pedidos').insert({
        id: pedidoId,
        pagador_cpf: cleanCpf,
        pagador_nome: pagador.nome.trim(),
        plano_cervejaria: plano_cervejaria || (totalValorExperiencias > 0 ? 'personalizado' : 'base'),
        taxa_adesao: taxaAdesaoTotal,
        valor_unitario_exp: totalValorExperiencias,
        qtd_cards: qtdCards,
        valor_total: totalGeral,
        forma_pagamento: forma_pagamento || 'PIX',
        status: 'pago',
        origem_tipo: origem_tipo || 'direto',
        origem_detalhe: origem_detalhe || null,
        vendedor_codigo: codVendedorEfetivo || null,
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

      // 4. Registro de Comissão do Vendedor / Promotor
      // REGRA COMERCIAL OFICIAL HOMOLOGADA:
      // - A compra isolada de cartões (R$ 10,00) gera R$ 0,00 de comissão.
      // - Apenas pedidos contendo ao menos 1 experiência geram comissão.
      // - A comissão é de R$ 20,00 fixa e única na 1ª compra de experiências deste cliente.
      // - Aplica-se inclusive se a compra de experiências for destinada apenas a terceiros.
      if (codVendedorEfetivo && totalSaldoExperiencias > 0) {
        const { data: comissaoExistente } = await supabase
          .from('comissoes')
          .select('id')
          .eq('pagador_cpf', cleanCpf)
          .maybeSingle();

        if (!comissaoExistente) {
          const { data: vendedor } = await supabase
            .from('vendedores')
            .select('id, codigo')
            .eq('codigo', codVendedorEfetivo)
            .maybeSingle();

          if (vendedor) {
            const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            const diaPagamento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 10);
            await supabase.from('comissoes').insert({
              vendedor_id: vendedor.id,
              vendedor_codigo: vendedor.codigo,
              pedido_id: pedidoId,
              pagador_cpf: cleanCpf,
              valor_comissao: 20.00,
              status_pagamento: 'pendente',
              data_fechamento: ultimoDiaMes.toISOString().split('T')[0],
              data_pagamento: diaPagamento.toISOString().split('T')[0]
            });
          }
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
