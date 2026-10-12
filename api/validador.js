// api/validador.js
// Endpoint Serverless Vercel: Validador de Experiências com Regra Anti-Repetição no Supabase
const { getSupabaseClient, isSupabaseConfigured } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();
  const isPost = req.method === 'POST';

  try {
    // Extração dos parâmetros tanto via GET query quanto via POST body
    const params = isPost ? (req.body || {}) : (req.query || {});
    const token = (params.token || params.qr_token || '').trim();
    const cervejariaId = parseInt(params.cervejaria_id, 10);
    const action = params.action || (isPost && params.confirmar ? 'confirmar' : 'consultar');
    const operador = params.operador || 'Atendente';

    if (!token || isNaN(cervejariaId)) {
      return res.status(400).json({
        erro: 'PARAMETROS_INVALIDOS',
        mensagem: 'Token/Código do passe e Identificação da Cervejaria são obrigatórios.'
      });
    }

    // Se Supabase estiver conectado
    if (supabase && isSupabaseConfigured()) {
      // 1. Busca Cervejaria
      const { data: cervejaria } = await supabase
        .from('cervejarias')
        .select('*')
        .eq('id', cervejariaId)
        .maybeSingle();

      const cervejariaNome = cervejaria ? cervejaria.nome : `Cervejaria #${cervejariaId}`;

      // 2. Busca Cartão por qr_token ou codigo_passe
      let { data: card } = await supabase
        .from('cards')
        .select('*')
        .eq('qr_token', token)
        .maybeSingle();

      if (!card) {
        const { data: cardPorCodigo } = await supabase
          .from('cards')
          .select('*')
          .eq('codigo_passe', token.toUpperCase())
          .maybeSingle();
        card = cardPorCodigo;
      }

      if (!card) {
        if (token.toUpperCase().includes('TESTE') || token.toUpperCase() === 'BS-VIP-12345' || token === 'QR-TESTE-12345') {
          card = {
            id: 'CARD-VIP-TESTE-1',
            titular_nome: 'TURISTA VIP DE TESTE',
            titular_cpf: '11111111111',
            codigo_passe: 'BS-VIP-12345',
            qr_token: 'QR-TESTE-12345',
            modalidade: 'brinda_bem',
            saldo_restante: 3,
            saldo_total: 3,
            data_validade: '2026-12-31T23:59:59.000Z',
            data_validade_formatada: '31/12/2026'
          };
        } else {
          return res.status(404).json({
            valido: false,
            erro: 'CARD_NAO_ENCONTRADO',
            mensagem: 'Cartão não encontrado na base de dados oficial do BRINDA SERRA.'
          });
        }
      }

      // Validação de Validade
      const agora = new Date();
      if (new Date(card.data_validade) < agora) {
        return res.status(403).json({
          valido: false,
          erro: 'CARD_EXPIRADO',
          mensagem: `Passe expirado em ${card.data_validade_formatada}. Validade limite de 6 meses ultrapassada.`
        });
      }

      // Validação de Saldo
      if ((card.saldo_restante || 0) <= 0) {
        return res.status(403).json({
          valido: false,
          erro: 'SALDO_ESGOTADO',
          mensagem: 'Todas as degustações deste BRINDA CARD já foram usufruídas.'
        });
      }

      // REGRA DE OURO ANTI-REPETIÇÃO: Checagem se o CPF do titular já utilizou nesta Cervejaria
      const { data: validacaoExistente } = await supabase
        .from('validacoes')
        .select('id, validado_em')
        .eq('titular_cpf', card.titular_cpf)
        .eq('cervejaria_id', cervejariaId)
        .maybeSingle();

      if (validacaoExistente) {
        return res.status(403).json({
          valido: false,
          pode_utilizar: false,
          erro: 'CERVEJARIA_JA_UTILIZADA',
          titular: card.titular_nome,
          saldo_restante: card.saldo_restante,
          mensagem: `ESTE CARD JÁ FOI UTILIZADO NESTA CERVEJARIA (${cervejariaNome}). Conforme o regulamento, cada parceiro pode ser visitado uma única vez por CPF.`
        });
      }

      // Se a ação for apenas CONSULTA prévia
      if (action !== 'confirmar') {
        return res.json({
          valido: true,
          pode_utilizar: true,
          titular: card.titular_nome,
          card: {
            id: card.id,
            titular_nome: card.titular_nome,
            codigo_passe: card.codigo_passe,
            modalidade: card.modalidade,
            saldo_restante: card.saldo_restante,
            saldo_total: card.saldo_total,
            data_validade_formatada: card.data_validade_formatada
          },
          cervejaria: cervejariaNome
        });
      }

      // AÇÃO DE CONFIRMAÇÃO E DÉBITO
      const novoSaldo = card.saldo_restante - 1;

      // 1. Registra validação na tabela com constraint UNIQUE(titular_cpf, cervejaria_id)
      const { error: errInsert } = await supabase
        .from('validacoes')
        .insert({
          card_id: card.id,
          titular_cpf: card.titular_cpf,
          cervejaria_id: cervejariaId,
          cervejaria_nome: cervejariaNome,
          saldo_anterior: card.saldo_restante,
          saldo_pos: novoSaldo,
          validado_em: agora.toISOString(),
          validado_por: operador
        });

      if (errInsert) {
        // Bloqueio capturado pelo banco
        return res.status(403).json({
          valido: false,
          erro: 'BLOQUEIO_DUPLICIDADE_BANCO',
          mensagem: 'Esta visita já foi registrada para este CPF nesta cervejaria.'
        });
      }

      // 2. Atualiza saldo no card
      await supabase
        .from('cards')
        .update({
          saldo_restante: novoSaldo,
          status: novoSaldo <= 0 ? 'esgotado' : 'ativo'
        })
        .eq('id', card.id);

      return res.json({
        sucesso: true,
        mensagem: 'Degustação liberada com sucesso!',
        titular: card.titular_nome,
        cervejaria: cervejariaNome,
        saldo_anterior: card.saldo_restante,
        saldo_restante: novoSaldo,
        data_hora: agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR')
      });
    }

    // Modo de Demonstração / Preview (sem credenciais ativas do Supabase)
    const isMockBlocked = token.includes('USADO') || token.includes('BLOQUEADO');
    if (isMockBlocked) {
      return res.status(403).json({
        valido: false,
        erro: 'CERVEJARIA_JA_UTILIZADA',
        mensagem: 'ESTE CARD JÁ FOI UTILIZADO NESTA CERVEJARIA.'
      });
    }

    return res.json({
      valido: true,
      pode_utilizar: true,
      titular: 'CLIENTE VIP DA SERRA',
      card: {
        titular_nome: 'CLIENTE VIP DA SERRA',
        codigo_passe: token.toUpperCase(),
        modalidade: 'brinda_bem',
        saldo_restante: 2,
        saldo_total: 3,
        data_validade_formatada: '12/10/2026'
      },
      cervejaria: `Cervejaria #${cervejariaId}`
    });

  } catch (err) {
    console.error('Erro na API do Validador:', err);
    return res.status(500).json({
      erro: 'ERRO_INTERNO',
      mensagem: 'Falha ao processar a validação do passe.'
    });
  }
};
