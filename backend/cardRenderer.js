// backend/cardRenderer.js
// Renderizador oficial do BRINDA CARD com fidelidade absoluta ao design homologado

const QRCode = require('qrcode');

/**
 * Gera o QR Code em Base64 Data URI
 */
async function generateQrDataUri(payload) {
  try {
    return await QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: {
        dark: '#1A1D1A',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err);
    return '';
  }
}

/**
 * Gera o HTML oficial do BRINDA CARD (Componente Visual Exato do Print)
 */
function renderCardComponent(cardData, qrCodeDataUri) {
  const nomeTitular = (cardData.titular_nome || 'CLIENTE VIP').toUpperCase();
  const validadeFormatada = cardData.data_validade_formatada || '6 Meses da Compra';
  const codigoPasse = cardData.codigo_passe || 'BS-2026-VIP';

  return `
  <div class="brinda-card-official" style="
    background: linear-gradient(135deg, #2D362C 0%, #3F4A3E 60%, #4D5A4C 100%);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 25px 60px -15px rgba(45, 54, 44, 0.45), 0 0 0 1px rgba(201, 168, 106, 0.35);
    color: #F4EEE4;
    aspect-ratio: 1.586 / 1;
    max-width: 480px;
    width: 100%;
    margin: 0 auto;
    font-family: 'Calibri', 'Carlito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    user-select: none;
    box-sizing: border-box;
  ">
    <div style="
      border: 1px solid rgba(201, 168, 106, 0.35);
      border-radius: 20px;
      height: calc(100% - 24px);
      margin: 12px;
      padding: 1.25rem 1.4rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      z-index: 2;
      box-sizing: border-box;
      background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.05), transparent 70%);
    ">
      <!-- Topo: Logo Oficial e Badge VIP -->
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="
            width: 46px; 
            height: 46px; 
            border-radius: 50%; 
            border: 1.5px solid #C9A86A; 
            background: #2D362C; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            overflow: hidden;
          ">
            <span style="font-size: 0.65rem; font-weight: bold; color: #C9A86A; text-align: center; line-height: 1;">BRINDA<br>SERRA</span>
          </div>
          <div>
            <span style="display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; color: #C9A86A; line-height: 1.1;">BRINDA CARD</span>
            <span style="font-size: 0.65rem; color: #D1D5DB; letter-spacing: 0.5px;">cartão virtual oficial</span>
          </div>
        </div>
        <div style="
          background: rgba(201, 168, 106, 0.2);
          border: 1px solid rgba(201, 168, 106, 0.6);
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: bold;
          color: #F8E2CE;
          letter-spacing: 1px;
          text-transform: uppercase;
        ">
          VIP PASS
        </div>
      </div>

      <!-- Centro: Chip Metálico e QR Code -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin: 6px 0;">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="
            width: 44px;
            height: 34px;
            border-radius: 8px;
            background: linear-gradient(135deg, #FDE68A 0%, #D97706 60%, #B45309 100%);
            border: 1px solid rgba(180, 83, 9, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.5);
          ">
            <div style="width: 26px; height: 20px; border: 1px solid rgba(120, 53, 15, 0.6); border-radius: 2px;"></div>
          </div>
          <span style="font-size: 0.65rem; color: #E5E7EB; letter-spacing: 1.5px; font-family: monospace;">DIGITAL MEMBER</span>
        </div>

        <div style="
          background: #FFFFFF;
          padding: 6px 8px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        ">
          <img src="${qrCodeDataUri}" alt="QR Code" style="width: 64px; height: 64px; display: block;" />
          <span style="font-size: 0.55rem; color: #374151; font-family: monospace; font-weight: bold; margin-top: 2px;">${codigoPasse}</span>
        </div>
      </div>

      <!-- Rodapé: Nome do Titular e Validade -->
      <div style="
        padding-top: 8px; 
        border-top: 1px solid rgba(201, 168, 106, 0.3); 
        display: flex; 
        align-items: flex-end; 
        justify-content: space-between;
      ">
        <div style="max-width: 65%;">
          <span style="font-size: 0.58rem; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; display: block;">TITULAR DO CARTÃO</span>
          <span style="font-size: 0.95rem; font-weight: bold; color: #FAF6EF; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
            ${nomeTitular}
          </span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.58rem; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; display: block;">VALIDADE</span>
          <span style="font-size: 0.78rem; font-weight: bold; color: #F8E2CE; white-space: nowrap;">
            ${validadeFormatada}
          </span>
        </div>
      </div>
    </div>
  </div>
  `;
}

/**
 * Gera o Template de E-mail Completo de Emissão para Envio ao Cliente
 */
function renderEmailTemplate(cardData, qrCodeDataUri, pedidoData) {
  const cardHtml = renderCardComponent(cardData, qrCodeDataUri);
  const nomeCliente = cardData.titular_nome || 'Amigo da Serra';
  const modalidade = cardData.modalidade === 'brinda_premium' ? 'BRINDA PREMIUM (5 experiências)' : (cardData.modalidade === 'brinda_bem' ? 'BRINDA BEM (3 experiências)' : 'BRINDA CARD BASE (Acesso Vitalício)');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Seu BRINDA CARD Chegou!</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #F4EEE4; font-family: 'Calibri', 'Carlito', Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #E7DEC9;">
    
    <!-- Cabeçalho do E-mail -->
    <div style="background-color: #3F4A3E; padding: 30px 20px; text-align: center;">
      <h1 style="color: #FAF6EF; font-size: 24px; margin: 0 0 6px 0; font-weight: bold;">BRINDA SERRA</h1>
      <p style="color: #E7B8A0; font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Seu Passaporte Oficial de Experiências</p>
    </div>

    <!-- Corpo com Mensagem -->
    <div style="padding: 30px 25px;">
      <h2 style="color: #2D362C; font-size: 20px; margin: 0 0 12px 0;">Olá, ${nomeCliente}! 🍺</h2>
      <p style="color: #555555; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">
        Seu pagamento foi confirmado com sucesso e o seu <strong>BRINDA CARD</strong> já está ativo e pronto para uso!
      </p>

      <!-- Cartão Virtual Oficial Homologado -->
      <div style="margin: 25px 0;">
        ${cardHtml}
      </div>

      <!-- Detalhes do Passe -->
      <div style="background-color: #FAF6EF; border: 1px solid #E7DEC9; border-radius: 14px; padding: 18px; margin: 25px 0;">
        <h3 style="color: #3F4A3E; font-size: 15px; margin: 0 0 10px 0; font-weight: bold;">📋 Resumo do Seu Passe:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4B5563; font-size: 14px; line-height: 1.6;">
          <li><strong>Produto:</strong> ${modalidade}</li>
          <li><strong>Saldo de Visitas:</strong> ${cardData.saldo_restante} degustações disponíveis</li>
          <li><strong>Validade das Experiências:</strong> 6 meses a contar de hoje</li>
          <li><strong>Acesso ao Cadastro:</strong> Vitalício (com seu CPF)</li>
        </ul>
      </div>

      <!-- Instruções de Uso na Cervejaria -->
      <h3 style="color: #2D362C; font-size: 16px; margin: 25px 0 10px 0; font-weight: bold;">📍 Como Utilizar nas Cervejarias:</h3>
      <ol style="margin: 0 0 25px 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.6;">
        <li>Acesse o catálogo em <a href="https://www.brindaserra.com.br" style="color: #C96C4A; font-weight: bold;">www.brindaserra.com.br</a> e escolha a cervejaria participante.</li>
        <li>Ao chegar ao estabelecimento, apresente este <strong>QR Code direto na tela do seu celular</strong>.</li>
        <li>Apresente seu <strong>documento oficial com foto</strong> (RG ou CNH) para conferência nominal.</li>
        <li>O atendente fará a validação instantânea e liberará a sua experiência exclusiva da casa!</li>
      </ol>

      <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 12px; border-radius: 6px; font-size: 13px; color: #92400E; margin-bottom: 25px;">
        <strong>Importante:</strong> Cada QR Code dá direito a 1 visita em cada cervejaria parceira. A mesma cervejaria não pode ser repetida com o mesmo passe.
      </div>

      <div style="text-align: center;">
        <a href="https://www.brindaserra.com.br#brinda-card" style="display: inline-block; background-color: #C96C4A; color: #FFFFFF; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-size: 14px; box-shadow: 0 4px 15px rgba(201, 108, 74, 0.4);">
          Acessar Minha Conta no Site
        </a>
      </div>
    </div>

    <!-- Rodapé do E-mail -->
    <div style="background-color: #FAF6EF; padding: 20px; text-align: center; border-top: 1px solid #E7DEC9; color: #888888; font-size: 12px;">
      <p style="margin: 0 0 6px 0;">BRINDA SERRA • Experiências Inesquecíveis na Serra Gaúcha</p>
      <p style="margin: 0;">Dúvidas? Entre em contato pelo e-mail <a href="mailto:brindacard@gmail.com" style="color: #3F4A3E;">brindacard@gmail.com</a></p>
    </div>

  </div>
</body>
</html>
  `;
}

module.exports = {
  generateQrDataUri,
  renderCardComponent,
  renderEmailTemplate
};
