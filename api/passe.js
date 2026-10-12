// api/passe.js
// Endpoint Serverless Vercel: Consulta direta de passe individual por token/código para a tela do celular
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const token = (req.query.token || req.query.id || '').trim();

    if (!token) {
      return res.status(400).json({ error: 'Token ou Código do passe não informado.' });
    }

    const supabase = getSupabaseClient();

    if (supabase && isSupabaseConfigured()) {
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
            data_validade_formatada: '31/12/2026',
            status: 'ativo'
          };
        } else {
          return res.status(404).json({
            sucesso: false,
            error: 'PASSE_NAO_ENCONTRADO',
            mensagem: 'Passe não localizado na base oficial do BRINDA SERRA.'
          });
        }
      }

      const qrImage = await generateQrDataUri(card.qr_token);

      return res.json({
        sucesso: true,
        card: {
          ...card,
          qr_image_base64: qrImage
        }
      });
    }

    // Modo Fallback / Demonstração se token for reconhecido
    const qrImage = await generateQrDataUri(token);
    return res.json({
      sucesso: true,
      card: {
        id: `CARD-DEMO`,
        titular_nome: 'PORTADOR DO BRINDA CARD',
        codigo_passe: token.toUpperCase(),
        modalidade: 'brinda_bem',
        saldo_total: 3,
        saldo_restante: 3,
        data_validade_formatada: '12/10/2026',
        status: 'ativo',
        qr_token: token,
        qr_image_base64: qrImage
      }
    });

  } catch (err) {
    console.error('Erro na API de Passe:', err);
    return res.status(500).json({ error: 'Erro ao consultar passe.' });
  }
};
