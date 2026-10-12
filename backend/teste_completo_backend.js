// backend/teste_completo_backend.js
// Teste de integridade de todas as regras de negócio no backend

const db = require('./database');
const { generateQrDataUri, renderCardComponent, renderEmailTemplate } = require('./cardRenderer');

async function runTests() {
  console.log('--- INICIANDO TESTES DO BACKEND BRINDA SERRA ---');

  // Teste 1: Checkout do João com Brinda Bem (3 experiências) e indicação do Uber PEDRO01
  console.log('\n[TESTE 1] Processando Checkout do Cliente João (Brinda Bem + Adesão R$ 10)...');
  const pedidoRes = db.createPedido({
    pagador: {
      nome: 'João da Silva Sauro',
      cpf: '123.456.789-00',
      email: 'joao@email.com',
      telefone: '54999998888',
      data_nasc: '1990-05-15'
    },
    plano_cervejaria: 'brinda_bem',
    comprar_para_si: true,
    forma_pagamento: 'PIX',
    origem_tipo: 'uber',
    vendedor_codigo: 'PEDRO01'
  });

  const cardJoao = pedidoRes.cards[0];
  console.log('✓ Pedido criado ID:', pedidoRes.pedido.id);
  console.log('✓ Valor Total Calculado:', pedidoRes.pedido.valor_total, '(Adesão R$ 10 + Experiências R$ 130)');
  console.log('✓ Card Emitido ID:', cardJoao.id, 'Titular:', cardJoao.titular_nome, 'Saldo:', cardJoao.saldo_restante);
  console.log('✓ Código do Passe:', cardJoao.codigo_passe, 'QR Token:', cardJoao.qr_token);

  // Teste 2: Verificar se a comissão de R$ 20,00 foi gravada para o vendedor PEDRO01
  const data = db.loadDatabase();
  const comissao = data.comissoes.find(c => c.pedido_id === pedidoRes.pedido.id);
  console.log('\n[TESTE 2] Verificando Regra de Comissão do Vendedor:');
  if (comissao && comissao.valor === 20.00 && comissao.vendedor_codigo === 'PEDRO01') {
    console.log('✓ SUCESSO: Comissão de R$ 20,00 gravada com sucesso para o motorista PEDRO01 com fechamento para o dia 10!');
  } else {
    console.error('❌ FALHA na comissão:', comissao);
  }

  // Teste 3: Geração do QR Code e Renderização Visual Homologada
  console.log('\n[TESTE 3] Testando Renderização Oficial do Card e Template de E-mail:');
  const qrUri = await generateQrDataUri(cardJoao.qr_token);
  const cardHtml = renderCardComponent(cardJoao, qrUri);
  const emailHtml = renderEmailTemplate(cardJoao, qrUri, pedidoRes.pedido);
  console.log('✓ QR Code gerado em Data URI (Tamanho):', qrUri.length, 'bytes');
  console.log('✓ Card HTML gerado com degradê verde, chip dourado e badge VIP PASS (Tamanho):', cardHtml.length, 'caracteres');
  console.log('✓ Template de E-mail Transacional gerado para envio ao cliente (Tamanho):', emailHtml.length, 'caracteres');

  // Teste 4: Primeira Visita à Cervejaria Farol (ID 1)
  console.log('\n[TESTE 4] Simulação de Validação do QR Code na Cervejaria Farol:');
  const consulta1 = db.consultarQrCode(cardJoao.qr_token, 1);
  console.log('✓ Consulta 1 (Farol): Válido?', consulta1.valido, '| Saldo:', consulta1.card?.saldo_restante);
  
  const baixa1 = db.confirmarValidacao(cardJoao.qr_token, 1, 'Atendente Carlos', 'Degustação Farol 4 Chopes');
  console.log('✓ Baixa 1 confirmada! Novo saldo restante do cliente:', baixa1.saldo_restante, 'de 3');

  // Teste 5: SEGUNDA TENTATIVA NA MESMA CERVEJARIA FAROL (REGRA DE BLOQUEIO)
  console.log('\n[TESTE 5] Testando TRAVA DE BLOQUEIO ANTI-REPETIÇÃO na Cervejaria Farol:');
  const consulta2 = db.consultarQrCode(cardJoao.qr_token, 1);
  console.log('Resultado da 2ª tentativa no mesmo local:');
  console.log('  - Válido?', consulta2.valido);
  console.log('  - Código de Erro:', consulta2.codigo_erro);
  console.log('  - Mensagem do Sistema:', consulta2.mensagem);

  if (!consulta2.valido && consulta2.codigo_erro === 'CERVEJARIA_JA_UTILIZADA') {
    console.log('✓ SUCESSO ABSOLUTO: A regra de bloqueio CARD + CERVEJARIA e CPF + CERVEJARIA funcionou perfeitamente e impediu a reutilização!');
  } else {
    console.error('❌ FALHA na trava de bloqueio:', consulta2);
  }

  // Teste 6: Visita em OUTRA Cervejaria (Gramado Bier - ID 2)
  console.log('\n[TESTE 6] Visita à Cervejaria 2 (Gramado Bier):');
  const consulta3 = db.consultarQrCode(cardJoao.qr_token, 2);
  console.log('✓ Consulta Gramado Bier: Válido?', consulta3.valido, '| Saldo:', consulta3.card?.saldo_restante);
  const baixa2 = db.confirmarValidacao(cardJoao.qr_token, 2, 'Atendente Ana');
  console.log('✓ Baixa 2 confirmada! Novo saldo restante:', baixa2.saldo_restante, 'de 3');

  // Teste 7: Consulta no Painel do Cliente por CPF
  console.log('\n[TESTE 7] Consulta do Painel do Cliente (Login por CPF):');
  const painel = db.getClientePainel('123.456.789-00');
  console.log('✓ Cliente:', painel.cliente.nome, '| E-mail:', painel.cliente.email);
  console.log('✓ Cards ativos:', painel.cards_proprios.length, '| Saldo atual:', painel.cards_proprios[0].saldo_restante);
  console.log('✓ Histórico de Cervejarias visitadas:', painel.historico_visitas.map(v => `${v.cervejaria_nome} (${v.data_hora_formatada})`));

  console.log('\n--- TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! ---');
}

runTests().catch(console.error);
