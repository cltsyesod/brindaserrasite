// backend/server.js
// Servidor oficial da API e regras de negócio do BRINDA SERRA

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { generateQrDataUri, renderCardComponent, renderEmailTemplate } = require('./cardRenderer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir frontend se necessário
app.use(express.static(path.join(__dirname, '..')));

// 1. Rota de Checkout e Emissão Automatizada
app.post('/api/checkout', async (req, res) => {
  try {
    const { pagador, plano_cervejaria, comprar_para_si, terceiros, forma_pagamento, origem_tipo, origem_detalhe, vendedor_codigo } = req.body;

    if (!pagador || !pagador.nome || !pagador.cpf || !pagador.email) {
      return res.status(400).json({ error: 'Dados obrigatórios do pagador não informados (Nome, CPF e E-mail).' });
    }

    const resultado = db.createPedido({
      pagador,
      plano_cervejaria, // 'base', 'brinda_bem' ou 'brinda_premium'
      comprar_para_si: comprar_para_si !== false,
      terceiros: terceiros || [],
      forma_pagamento: forma_pagamento || 'PIX',
      origem_tipo,
      origem_detalhe,
      vendedor_codigo
    });

    // Enriquecer cards com QR Code em imagem Base64
    for (const card of resultado.cards) {
      card.qr_image_base64 = await generateQrDataUri(card.qr_token);
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Pedido processado e BRINDA CARD(S) emitido(s) com sucesso!',
      pedido: resultado.pedido,
      cards: resultado.cards
    });
  } catch (err) {
    console.error('Erro no checkout:', err);
    res.status(500).json({ error: 'Erro interno ao processar pedido.' });
  }
});

// 2. Rota para Renderizar o BRINDA CARD Oficial (Design Exato do Print)
app.get('/api/cards/:qr_token/view', async (req, res) => {
  try {
    const data = db.loadDatabase();
    const card = data.cards.find(c => c.qr_token === req.params.qr_token);

    if (!card) {
      return res.status(404).send('<h3>Cartão não encontrado ou QR Code inválido.</h3>');
    }

    const qrDataUri = await generateQrDataUri(card.qr_token);
    const cardHtml = renderCardComponent(card, qrDataUri);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BRINDA CARD • ${card.titular_nome}</title>
      </head>
      <body style="margin: 0; padding: 40px 15px; background: #F4EEE4; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;">
        <div style="width: 100%; max-width: 480px;">
          ${cardHtml}
          <div style="margin-top: 25px; text-align: center; font-family: sans-serif;">
            <p style="color: #3F4A3E; font-size: 14px; margin: 0 0 8px 0;"><strong>Status:</strong> ${card.status.toUpperCase()} | <strong>Saldo:</strong> ${card.saldo_restante} de ${card.saldo_total} experiências</p>
            <p style="color: #888888; font-size: 12px; margin: 0;">Apresente este cartão com documento oficial com foto na cervejaria parceira.</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Erro ao renderizar cartão.');
  }
});

// 3. Rota para Visualizar o Template de E-mail Oficial Homologado
app.get('/api/cards/:qr_token/email', async (req, res) => {
  try {
    const data = db.loadDatabase();
    const card = data.cards.find(c => c.qr_token === req.params.qr_token);

    if (!card) {
      return res.status(404).send('Cartão não encontrado.');
    }

    const pedido = data.pedidos.find(p => p.id === card.pedido_id);
    const qrDataUri = await generateQrDataUri(card.qr_token);
    const emailHtml = renderEmailTemplate(card, qrDataUri, pedido);

    res.send(emailHtml);
  } catch (err) {
    res.status(500).send('Erro ao renderizar e-mail.');
  }
});

// 4. Validação na Cervejaria: Consulta Prévia do QR Code
app.post('/api/validador/consultar', (req, res) => {
  const { qr_token, cervejaria_id } = req.body;

  if (!qr_token || !cervejaria_id) {
    return res.status(400).json({ error: 'Parâmetros qr_token e cervejaria_id são obrigatórios.' });
  }

  const resultado = db.consultarQrCode(qr_token, cervejaria_id);
  if (!resultado.valido) {
    return res.status(403).json(resultado);
  }

  res.json(resultado);
});

// 5. Validação na Cervejaria: Confirmação e Baixa no Saldo
app.post('/api/validador/confirmar', (req, res) => {
  const { qr_token, cervejaria_id, operador, experiencia_tipo } = req.body;

  if (!qr_token || !cervejaria_id) {
    return res.status(400).json({ error: 'Parâmetros qr_token e cervejaria_id são obrigatórios.' });
  }

  const resultado = db.confirmarValidacao(qr_token, cervejaria_id, operador, experiencia_tipo);
  if (!resultado.sucesso) {
    return res.status(403).json(resultado);
  }

  res.json(resultado);
});

// 6. Área do Cliente: Login e Consulta por CPF
app.get('/api/cliente/:cpf', (req, res) => {
  const painel = db.getClientePainel(req.params.cpf);
  if (!painel) {
    return res.status(404).json({ error: 'Cliente não encontrado com o CPF informado.' });
  }
  res.json(painel);
});

// 7. Lista de Cervejarias Cadastradas
app.get('/api/cervejarias', (req, res) => {
  const data = db.loadDatabase();
  res.json(data.cervejarias);
});

// 8. Relatório da Administração (Vendas e Comissões para o dia 10)
app.get('/api/admin/relatorio', (req, res) => {
  const data = db.loadDatabase();
  res.json({
    total_pedidos: data.pedidos.length,
    total_cards_emitidos: data.cards.length,
    total_validacoes: data.validacoes.length,
    pedidos: data.pedidos,
    validacoes: data.validacoes,
    comissoes: data.comissoes,
    vendedores: data.vendedores
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🍺 Servidor BRINDA SERRA rodando na porta ${PORT}`);
    console.log(`👉 API de Checkout: http://localhost:${PORT}/api/checkout`);
    console.log(`👉 API de Validação: http://localhost:${PORT}/api/validador/consultar`);
  });
}

module.exports = app;
