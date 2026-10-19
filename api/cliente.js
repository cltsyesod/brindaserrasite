// api/cliente.js
// Endpoint Serverless Vercel: Consulta de Minha Conta / Passes do Cliente no Supabase
const { getSupabaseClient, isSupabaseConfigured } = require('../lib/supabase');
const { store, addAuditLog } = require('../lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ATUALIZAÇÃO DE CONTATO DO CLIENTE (Nome e CPF são estritamente bloqueados)
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { cpf, email, telefone } = req.body || {};
      const cleanCpf = String(cpf || '').replace(/\D/g, '');

      if (!cleanCpf || cleanCpf.length !== 11) {
        return res.status(400).json({ error: 'CPF inválido. Informe os 11 dígitos numéricos.' });
      }

      const emailTrim = String(email || '').trim();
      const telTrim = String(telefone || '').trim();

      if (!emailTrim || !emailTrim.includes('@')) {
        return res.status(400).json({ error: 'Por favor, informe um endereço de e-mail válido.' });
      }

      // Conta de Teste
      if (cleanCpf === '11111111111' || cleanCpf === '12345678900') {
        const auditEntry = {
          data: new Date().toISOString(),
          cpf: cleanCpf,
          nome: 'TURISTA VIP DE TESTE',
          email_anterior: 'teste@brindaserra.com.br',
          email_novo: emailTrim,
          telefone_anterior: '54999999999',
          telefone_novo: telTrim,
          canal: 'area_do_cliente'
        };
        addAuditLog(auditEntry);
        return res.json({
          sucesso: true,
          mensagem: 'Dados de contato atualizados com sucesso.',
          cliente: {
            nome: 'TURISTA VIP DE TESTE',
            cpf: cleanCpf,
            email: emailTrim,
            telefone: telTrim
          }
        });
      }

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        const { data: cliente, error: errCliente } = await supabase
          .from('clientes')
          .select('*')
          .eq('cpf', cleanCpf)
          .maybeSingle();

        if (errCliente || !cliente) {
          return res.status(404).json({ error: 'Cliente não localizado para este CPF.' });
        }

        const auditEntry = {
          data: new Date().toISOString(),
          cpf: cleanCpf,
          nome: cliente.nome,
          email_anterior: cliente.email || '',
          email_novo: emailTrim,
          telefone_anterior: cliente.telefone || '',
          telefone_novo: telTrim,
          canal: 'area_do_cliente'
        };
        addAuditLog(auditEntry);

        let historicoAtual = [];
        try {
          historicoAtual = Array.isArray(cliente.historico_alteracoes)
            ? cliente.historico_alteracoes
            : JSON.parse(cliente.historico_alteracoes || '[]');
        } catch (e) {
          historicoAtual = [];
        }
        historicoAtual.push(auditEntry);

        await supabase
          .from('clientes')
          .update({
            email: emailTrim,
            telefone: telTrim,
            historico_alteracoes: historicoAtual,
            updated_at: new Date().toISOString()
          })
          .eq('cpf', cleanCpf);

        return res.json({
          sucesso: true,
          mensagem: 'Dados de contato atualizados com sucesso.',
          cliente: {
            nome: cliente.nome,
            cpf: cleanCpf,
            email: emailTrim,
            telefone: telTrim
          }
        });
      }

      // Fallback em memória
      const auditEntry = {
        data: new Date().toISOString(),
        cpf: cleanCpf,
        email_anterior: '',
        email_novo: emailTrim,
        telefone_anterior: '',
        telefone_novo: telTrim,
        canal: 'area_do_cliente_local'
      };
      addAuditLog(auditEntry);

      return res.json({
        sucesso: true,
        mensagem: 'Dados atualizados localmente com sucesso.',
        cliente: {
          nome: 'Cliente BRINDA SERRA',
          cpf: cleanCpf,
          email: emailTrim,
          telefone: telTrim
        }
      });

    } catch (err) {
      console.error('Erro ao atualizar contato do cliente:', err);
      return res.status(500).json({ error: 'Erro ao processar a atualização dos dados.' });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const rawCpf = req.query.cpf || '';
    const cleanCpf = rawCpf.replace(/\D/g, '');

    if (!cleanCpf || cleanCpf.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido. Informe os 11 dígitos numéricos.' });
    }

    // Conta Oficial de Teste / Homologação (Permite validar telas e fluxos com CPF simples)
    if (cleanCpf === '11111111111' || cleanCpf === '12345678900') {
      return res.json({
        sucesso: true,
        cliente: {
          nome: 'TURISTA VIP DE TESTE',
          cpf: cleanCpf,
          email: 'teste@brindaserra.com.br',
          telefone: '54999999999'
        },
        cards: [
          {
            id: 'CARD-VIP-TESTE-1',
            titular_nome: 'TURISTA VIP DE TESTE',
            titular_cpf: cleanCpf,
            codigo_passe: 'BS-VIP-12345',
            qr_token: 'QR-TESTE-12345',
            modalidade: 'brinda_bem',
            saldo_restante: 3,
            saldo_total: 3,
            data_validade_formatada: '31/12/2026',
            is_pagador: true
          }
        ],
        validacoes: []
      });
    }

    const supabase = getSupabaseClient();

    if (supabase && isSupabaseConfigured()) {
      // 1. Busca Cliente
      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('cpf', cleanCpf)
        .maybeSingle();

      if (errCliente || !cliente) {
        return res.status(404).json({
          sucesso: false,
          error: 'CPF_NAO_ENCONTRADO',
          mensagem: 'Nenhum cadastro ou passe encontrado para este CPF no BRINDA SERRA.'
        });
      }

      // 2. Busca Cards vinculados (seja como pagador ou como titular convidado)
      const { data: cards } = await supabase
        .from('cards')
        .select('*')
        .or(`pagador_cpf.eq.${cleanCpf},titular_cpf.eq.${cleanCpf}`)
        .order('is_pagador', { ascending: false });

      if (!cards || cards.length === 0) {
        return res.status(404).json({
          sucesso: false,
          error: 'SEM_CARDS',
          mensagem: 'Cliente localizado, mas nenhum BRINDA CARD ativo encontrado.'
        });
      }

      // 3. Busca Histórico de Validações realizadas
      const { data: validacoes } = await supabase
        .from('validacoes')
        .select('*')
        .eq('titular_cpf', cleanCpf)
        .order('validado_em', { ascending: false });

      return res.json({
        sucesso: true,
        cliente: {
          nome: cliente.nome,
          cpf: cliente.cpf,
          email: cliente.email,
          telefone: cliente.telefone
        },
        cards: cards || [],
        validacoes: validacoes || []
      });
    }

    // Se o Supabase não estiver configurado ou CPF não existir:
    // NUNCA retorna cliente fictício ou anônimo! Retorna 404 estrito!
    return res.status(404).json({
      sucesso: false,
      error: 'CPF_NAO_ENCONTRADO',
      mensagem: 'Nenhum BRINDA CARD encontrado para este CPF.'
    });

  } catch (err) {
    console.error('Erro na API de Cliente:', err);
    return res.status(500).json({ error: 'Erro ao consultar conta do cliente.' });
  }
};
