// backend/database.js
// Banco de Dados estruturado e motor de regras de negócio do BRINDA SERRA

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data_store.json');

// Estrutura inicial do banco
const defaultData = {
  clientes: [],
  pedidos: [],
  cards: [],
  cervejarias: [
    { id: 1, nome: "Cervejaria Farol", cidade: "Canela", slug: "farol", tour_guiado: true, status: "ativo" },
    { id: 2, nome: "Cervejaria Gramado Bier", cidade: "Gramado", slug: "gramado-bier", tour_guiado: false, status: "ativo" },
    { id: 3, nome: "Cervejaria Rasen Bier", cidade: "Gramado", slug: "rasen-bier", tour_guiado: true, status: "ativo" },
    { id: 4, nome: "Cervejaria Edelbrau", cidade: "Nova Petrópolis", slug: "edelbrau", tour_guiado: true, status: "ativo" },
    { id: 5, nome: "Cervejaria Kraustin Bier", cidade: "Canela", slug: "kraustin", tour_guiado: false, status: "ativo" }
  ],
  vendedores: [
    { id: 1, nome: "Pedro da Silva (Motorista Uber)", codigo: "PEDRO01", tipo: "uber", status: "ativo" },
    { id: 2, nome: "Concierge Hotel Casa da Montanha", codigo: "HOTEL01", tipo: "hotel", hotel_nome: "Hotel Casa da Montanha", status: "ativo" },
    { id: 3, nome: "Lucas Promotor Autônomo", codigo: "LUCASPROMO", tipo: "autonomo", status: "ativo" }
  ],
  validacoes: [],
  comissoes: []
};

function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    saveDatabase(defaultData);
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler data_store.json, usando padrão:', err);
    return defaultData;
  }
}

function saveDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Cria ou recupera cliente por CPF
 */
function getOrCreateCliente(dados, existingDb = null) {
  const db = existingDb || loadDatabase();
  const cleanCpf = (dados.cpf || '').replace(/\D/g, '');
  let cliente = db.clientes.find(c => c.cpf === cleanCpf);

  if (!cliente) {
    cliente = {
      id: db.clientes.length + 1,
      nome: dados.nome,
      cpf: cleanCpf,
      email: dados.email,
      telefone: dados.telefone,
      data_nasc: dados.data_nasc || '',
      tem_historico_compras: false,
      criado_em: new Date().toISOString()
    };
    db.clientes.push(cliente);
    if (!existingDb) {
      saveDatabase(db);
    }
  }
  return cliente;
}

/**
 * Cria Pedido com cálculo automático de regras comerciais e comissões
 */
function createPedido(dadosPedido) {
  const db = loadDatabase();
  const pagador = getOrCreateCliente(dadosPedido.pagador, db);

  const taxaAdesao = pagador.tem_historico_compras ? 0.00 : 10.00; // R$ 10 apenas na 1ª compra
  let valorExperiencias = 0;
  let saldoPorCard = 0;

  if (dadosPedido.plano_cervejaria === 'brinda_bem') {
    valorExperiencias = 130.00;
    saldoPorCard = 3;
  } else if (dadosPedido.plano_cervejaria === 'brinda_premium') {
    valorExperiencias = 190.00;
    saldoPorCard = 5;
  } else {
    // Apenas Cartão Base (conforme CDC contra venda casada)
    valorExperiencias = 0.00;
    saldoPorCard = 0;
  }

  // Tratamento de Terceiros (máximo 3 convidados adicionais)
  const terceiros = Array.isArray(dadosPedido.terceiros) ? dadosPedido.terceiros.slice(0, 3) : [];
  const qtdCards = (dadosPedido.comprar_para_si ? 1 : 0) + terceiros.length;
  const valorTotal = taxaAdesao + (valorExperiencias * qtdCards);

  const pedido = {
    id: 'PED-' + Date.now().toString().slice(-6),
    pagador_id: pagador.id,
    pagador_cpf: pagador.cpf,
    pagador_nome: pagador.nome,
    plano_cervejaria: dadosPedido.plano_cervejaria || 'base',
    taxa_adesao: taxaAdesao,
    valor_unitario_experiencia: valorExperiencias,
    qtd_cards: qtdCards,
    valor_total: valorTotal,
    forma_pagamento: dadosPedido.forma_pagamento || 'PIX',
    status: 'pago', // No MVP simulado para aprovação imediata ou webhook
    origem_tipo: dadosPedido.origem_tipo || 'direto', // hotel, uber, outros, direto
    origem_detalhe: dadosPedido.origem_detalhe || '',
    vendedor_codigo: (dadosPedido.vendedor_codigo || '').trim().toUpperCase(),
    criado_em: new Date().toISOString()
  };

  db.pedidos.push(pedido);

  // GERAÇÃO DOS CARDS NOMINAIS (Regra de Emissão)
  const cardsEmitidos = [];
  const validade6Meses = new Date();
  validade6Meses.setMonth(validade6Meses.getMonth() + 6);
  const dataValidadeIso = validade6Meses.toISOString();
  const dataValidadeFormatada = validade6Meses.toLocaleDateString('pt-BR');

  // 1. Card do próprio pagador (se marcou para si)
  if (dadosPedido.comprar_para_si) {
    const cardProprio = {
      id: 'CARD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      pedido_id: pedido.id,
      pagador_cpf: pagador.cpf,
      titular_nome: pagador.nome,
      titular_cpf: pagador.cpf,
      codigo_passe: 'BS-VIP-' + pagador.cpf.slice(0, 3) + pagador.cpf.slice(-2),
      modalidade: dadosPedido.plano_cervejaria || 'base',
      saldo_total: saldoPorCard,
      saldo_restante: saldoPorCard,
      data_emissao: new Date().toISOString(),
      data_validade: dataValidadeIso,
      data_validade_formatada: dataValidadeFormatada,
      status: saldoPorCard > 0 ? 'ativo' : 'cadastrado_sem_saldo',
      qr_token: 'QR-' + Math.random().toString(36).substring(2, 12).toUpperCase()
    };
    db.cards.push(cardProprio);
    cardsEmitidos.push(cardProprio);
  }

  // 2. Cards dos Terceiros (Convidados)
  terceiros.forEach((terc, idx) => {
    const cleanTercCpf = (terc.cpf || '').replace(/\D/g, '');
    const cardTerceiro = {
      id: 'CARD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      pedido_id: pedido.id,
      pagador_cpf: pagador.cpf,
      titular_nome: terc.nome || `Convidado ${idx + 1}`,
      titular_cpf: cleanTercCpf,
      codigo_passe: 'BS-VIP-' + (cleanTercCpf ? cleanTercCpf.slice(0, 3) + cleanTercCpf.slice(-2) : 'TERC' + idx),
      modalidade: dadosPedido.plano_cervejaria || 'base',
      saldo_total: saldoPorCard,
      saldo_restante: saldoPorCard,
      data_emissao: new Date().toISOString(),
      data_validade: dataValidadeIso,
      data_validade_formatada: dataValidadeFormatada,
      status: saldoPorCard > 0 ? 'ativo' : 'cadastrado_sem_saldo',
      qr_token: 'QR-' + Math.random().toString(36).substring(2, 12).toUpperCase()
    };
    db.cards.push(cardTerceiro);
    cardsEmitidos.push(cardTerceiro);
  });

  // REGRA DE COMISSÃO AO VENDEDOR:
  // Só gera comissão de R$ 20 se:
  // 1. For a 1ª compra do pagador
  // 2. Houver compra de EXPERIÊNCIAS (Brinda Bem ou Premium) e NÃO apenas o card avulso de R$ 10
  // 3. Houver código de vendedor informado e válido
  if (!pagador.tem_historico_compras && valorExperiencias > 0 && pedido.vendedor_codigo) {
    const vendedor = db.vendedores.find(v => v.codigo === pedido.vendedor_codigo);
    if (vendedor) {
      const hoje = new Date();
      const mesRef = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
      const comissao = {
        id: 'COM-' + Date.now().toString().slice(-6),
        pedido_id: pedido.id,
        vendedor_id: vendedor.id,
        vendedor_nome: vendedor.nome,
        vendedor_codigo: vendedor.codigo,
        valor: 20.00,
        mes_referencia: mesRef,
        status: 'aprovada_para_dia_10',
        criado_em: new Date().toISOString()
      };
      db.comissoes.push(comissao);
    }
  }

  // Atualiza histórico do pagador
  pagador.tem_historico_compras = true;
  saveDatabase(db);

  return {
    pedido,
    cards: cardsEmitidos
  };
}

/**
 * Consulta de QR Code na Cervejaria com TRAVA ANTI-REPETIÇÃO POR CPF
 */
function consultarQrCode(qrToken, cervejariaId) {
  const db = loadDatabase();
  const card = db.cards.find(c => c.qr_token === qrToken);
  const cervejaria = db.cervejarias.find(cv => cv.id == cervejariaId);

  if (!card) {
    return { valido: false, codigo_erro: 'CARD_NAO_ENCONTRADO', mensagem: 'QR Code inválido ou inexistente.' };
  }

  if (!cervejaria) {
    return { valido: false, codigo_erro: 'CERVEJARIA_INVALIDA', mensagem: 'Cervejaria parceira não identificada.' };
  }

  // Checa validade de data (6 meses)
  const hoje = new Date();
  const dataValidade = new Date(card.data_validade);
  if (hoje > dataValidade) {
    card.status = 'expirado';
    saveDatabase(db);
    return { valido: false, codigo_erro: 'CARD_EXPIRADO', mensagem: 'Este Card expirou o prazo limite de 6 meses.' };
  }

  // Checa saldo de experiências
  if (card.saldo_restante <= 0) {
    card.status = 'esgotado';
    saveDatabase(db);
    return { valido: false, codigo_erro: 'SEM_SALDO', mensagem: 'Este Card já utilizou todas as experiências contratadas.' };
  }

  // REGRA DE OURO: TRAVA DE REPETIÇÃO NA MESMA CERVEJARIA (POR CPF E POR CARD)
  // Conforme apontamento de Paula Paschoalin, o cliente NÃO pode retornar à mesma cervejaria.
  const jaVisitou = db.validacoes.some(v => 
    v.cervejaria_id == cervejariaId && 
    (v.card_id === card.id || (card.titular_cpf && v.titular_cpf === card.titular_cpf))
  );

  if (jaVisitou) {
    return {
      valido: false,
      codigo_erro: 'CERVEJARIA_JA_UTILIZADA',
      mensagem: `ESTE CARD JÁ FOI UTILIZADO NESTA CERVEJARIA. Você pode utilizar suas ${card.saldo_restante} experiências restantes em outras cervejarias participantes.`
    };
  }

  return {
    valido: true,
    card: {
      id: card.id,
      titular_nome: card.titular_nome,
      titular_cpf: card.titular_cpf,
      codigo_passe: card.codigo_passe,
      modalidade: card.modalidade,
      saldo_restante: card.saldo_restante,
      saldo_total: card.saldo_total,
      data_validade_formatada: card.data_validade_formatada
    },
    cervejaria: {
      id: cervejaria.id,
      nome: cervejaria.nome,
      tour_guiado: cervejaria.tour_guiado
    }
  };
}

/**
 * Confirmação da Validação da Degustação pela Cervejaria
 */
function confirmarValidacao(qrToken, cervejariaId, operadorUsuario, experienciaTipo) {
  const consulta = consultarQrCode(qrToken, cervejariaId);
  if (!consulta.valido) {
    return consulta;
  }

  const db = loadDatabase();
  const card = db.cards.find(c => c.qr_token === qrToken);
  const cervejaria = db.cervejarias.find(cv => cv.id == cervejariaId);

  // Debita 1 experiência do saldo
  card.saldo_restante -= 1;
  if (card.saldo_restante === 0) {
    card.status = 'esgotado';
  }

  const validacao = {
    id: 'VAL-' + Date.now().toString().slice(-6),
    card_id: card.id,
    titular_nome: card.titular_nome,
    titular_cpf: card.titular_cpf,
    cervejaria_id: cervejaria.id,
    cervejaria_nome: cervejaria.nome,
    experiencia_tipo: experienciaTipo || 'Degustação Cervejeira Oficial',
    data_hora: new Date().toISOString(),
    data_hora_formatada: new Date().toLocaleString('pt-BR'),
    operador: operadorUsuario || 'Atendente da Casa'
  };

  db.validacoes.push(validacao);
  saveDatabase(db);

  return {
    sucesso: true,
    mensagem: 'Degustação confirmada e validada com sucesso!',
    saldo_restante: card.saldo_restante,
    validacao
  };
}

/**
 * Consulta histórico e cartões do cliente por CPF (Área do Cliente)
 */
function getClientePainel(cpf) {
  const db = loadDatabase();
  const cleanCpf = (cpf || '').replace(/\D/g, '');
  const cliente = db.clientes.find(c => c.cpf === cleanCpf);

  if (!cliente) {
    return null;
  }

  const cardsProprios = db.cards.filter(c => c.titular_cpf === cleanCpf);
  const cardsCompradosParaTerceiros = db.cards.filter(c => c.pagador_cpf === cleanCpf && c.titular_cpf !== cleanCpf);
  const historicoVisitas = db.validacoes.filter(v => v.titular_cpf === cleanCpf);

  return {
    cliente,
    cards_proprios: cardsProprios,
    cards_terceiros: cardsCompradosParaTerceiros,
    historico_visitas: historicoVisitas
  };
}

/**
 * Consulta comissões e painel do vendedor/promotor
 */
function getVendedorPainel(codigo) {
  const db = loadDatabase();
  const cleanCode = (codigo || '').trim().toUpperCase();
  const vendedor = db.vendedores.find(v => v.codigo === cleanCode);
  const comissoes = db.comissoes.filter(c => c.vendedor_codigo === cleanCode);
  const totalComissoes = comissoes.reduce((acc, c) => acc + (c.valor_comissao || 0), 0);
  const metaBonus = comissoes.length >= 20;

  return {
    sucesso: true,
    vendedor: vendedor || { nome: `Parceiro (${cleanCode})`, codigo: cleanCode, tipo: 'promotor' },
    total_vendas: comissoes.length,
    total_comissoes: totalComissoes,
    atingiu_bonus: metaBonus,
    valor_bonus: metaBonus ? 200.00 : 0.00,
    fechamento_mensal: 'Dia 31',
    data_pagamento: 'Dia 10'
  };
}

module.exports = {
  loadDatabase,
  getOrCreateCliente,
  createPedido,
  consultarQrCode,
  confirmarValidacao,
  getClientePainel,
  getVendedorPainel
};

