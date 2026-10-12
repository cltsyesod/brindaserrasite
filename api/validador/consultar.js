// api/validador/consultar.js
// Rota de consulta do validador (Vercel Serverless)
const validadorHandler = require('../validador');

module.exports = async function handler(req, res) {
  if (req.method === 'POST' && req.body) {
    req.body.action = 'consultar';
  }
  return validadorHandler(req, res);
};
