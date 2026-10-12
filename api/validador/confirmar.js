// api/validador/confirmar.js
// Rota de confirmação e baixa do validador (Vercel Serverless)
const validadorHandler = require('../validador');

module.exports = async function handler(req, res) {
  if (req.method === 'POST' && req.body) {
    req.body.action = 'confirmar';
  }
  return validadorHandler(req, res);
};
