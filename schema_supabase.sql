-- ==============================================================
-- BRINDA SERRA • SCHEMA OFICIAL SUPABASE (POSTGRESQL)
-- Projeto: akuszjzdvafmtnrbckto.supabase.co
-- Versão: 2.0 (Fase 2 - Produção)
-- ==============================================================

-- 1. TABELA DE CLIENTES (Login por CPF e Dados Cadastrais)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email TEXT NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    data_nasc DATE,
    tem_historico_compras BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida de clientes por CPF
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON public.clientes(cpf);

-- 2. TABELA DE PEDIDOS (Transações Financeiras e Checkout)
CREATE TABLE IF NOT EXISTS public.pedidos (
    id TEXT PRIMARY KEY,
    pagador_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    pagador_cpf VARCHAR(14) NOT NULL,
    pagador_nome TEXT NOT NULL,
    plano_cervejaria VARCHAR(50) NOT NULL, -- 'base', 'brinda_bem', 'brinda_premium'
    taxa_adesao NUMERIC(10,2) DEFAULT 10.00,
    valor_unitario_exp NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    qtd_cards INT NOT NULL DEFAULT 1,
    valor_total NUMERIC(10,2) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL DEFAULT 'PIX',
    status VARCHAR(50) DEFAULT 'pago', -- 'pendente', 'pago', 'cancelado'
    origem_tipo VARCHAR(50) DEFAULT 'direto', -- 'hotel', 'uber', 'outros', 'direto'
    origem_detalhe TEXT,
    vendedor_codigo VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_pagador_cpf ON public.pedidos(pagador_cpf);

-- 3. TABELA DE CARDS (Passaportes Virtuais e QR Tokens)
CREATE TABLE IF NOT EXISTS public.cards (
    id TEXT PRIMARY KEY,
    pedido_id TEXT REFERENCES public.pedidos(id) ON DELETE CASCADE,
    pagador_cpf VARCHAR(14) NOT NULL,
    titular_nome TEXT NOT NULL,
    titular_cpf VARCHAR(14),
    codigo_passe VARCHAR(50) UNIQUE NOT NULL,
    modalidade VARCHAR(50) NOT NULL, -- 'base', 'brinda_bem', 'brinda_premium'
    saldo_total INT NOT NULL DEFAULT 0,
    saldo_restante INT NOT NULL DEFAULT 0,
    data_emissao TIMESTAMPTZ DEFAULT NOW(),
    data_validade TIMESTAMPTZ NOT NULL,
    data_validade_formatada VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ativo', -- 'ativo', 'cadastrado_sem_saldo', 'expirado'
    qr_token TEXT UNIQUE NOT NULL,
    is_pagador BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_qr_token ON public.cards(qr_token);
CREATE INDEX IF NOT EXISTS idx_cards_titular_cpf ON public.cards(titular_cpf);
CREATE INDEX IF NOT EXISTS idx_cards_pagador_cpf ON public.cards(pagador_cpf);

-- 4. TABELA DE CERVEJARIAS (Estabelecimentos Credenciados)
CREATE TABLE IF NOT EXISTS public.cervejarias (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    endereco TEXT,
    telefone VARCHAR(30),
    tour_guiado BOOLEAN DEFAULT FALSE,
    pin_acesso VARCHAR(10) DEFAULT '1234', -- PIN simples para o tablet/celular da casa
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de Cervejarias Oficiais
INSERT INTO public.cervejarias (id, nome, cidade, slug, tour_guiado, pin_acesso, status) VALUES
(1, 'Cervejaria Farol', 'Canela', 'farol', true, '1234', 'ativo'),
(2, 'Cervejaria Gramado Bier', 'Gramado', 'gramado-bier', false, '1234', 'ativo'),
(3, 'Cervejaria Rasen Bier', 'Gramado', 'rasen-bier', true, '1234', 'ativo'),
(4, 'Cervejaria Edelbrau', 'Nova Petrópolis', 'edelbrau', true, '1234', 'ativo'),
(5, 'Cervejaria Kraustin Bier', 'Canela', 'kraustin', false, '1234', 'ativo')
ON CONFLICT (id) DO NOTHING;

-- 5. TABELA DE VALIDAÇÕES (Registro de Degustações com TRAVA ANTI-REPETIÇÃO)
CREATE TABLE IF NOT EXISTS public.validacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id TEXT REFERENCES public.cards(id) ON DELETE CASCADE,
    titular_cpf VARCHAR(14) NOT NULL,
    cervejaria_id INT REFERENCES public.cervejarias(id) ON DELETE RESTRICT,
    cervejaria_nome TEXT NOT NULL,
    saldo_anterior INT NOT NULL,
    saldo_pos INT NOT NULL,
    validado_em TIMESTAMPTZ DEFAULT NOW(),
    validado_por TEXT DEFAULT 'atendente',
    -- TRAVA MATEMÁTICA DEFINITIVA NO BANCO: impede repetição de visita por CPF na mesma cervejaria
    CONSTRAINT unique_cpf_cervejaria UNIQUE (titular_cpf, cervejaria_id)
);

CREATE INDEX IF NOT EXISTS idx_validacoes_card_cervejaria ON public.validacoes(card_id, cervejaria_id);
CREATE INDEX IF NOT EXISTS idx_validacoes_cpf_cervejaria ON public.validacoes(titular_cpf, cervejaria_id);

-- 6. TABELA DE VENDEDORES (Parceiros Comerciais B2B)
CREATE TABLE IF NOT EXISTS public.vendedores (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'uber', 'hotel', 'autonomo', 'guia'
    hotel_nome TEXT,
    telefone VARCHAR(30),
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de Vendedores Iniciais
INSERT INTO public.vendedores (id, nome, codigo, tipo, hotel_nome, status) VALUES
(1, 'Pedro da Silva (Motorista Uber)', 'PEDRO01', 'uber', NULL, 'ativo'),
(2, 'Concierge Hotel Casa da Montanha', 'HOTEL01', 'hotel', 'Hotel Casa da Montanha', 'ativo'),
(3, 'Lucas Promotor Autônomo', 'LUCASPROMO', 'autonomo', NULL, 'ativo')
ON CONFLICT (id) DO NOTHING;

-- 7. TABELA DE COMISSÕES (Apuração Mensal de R$ 20 e Bônus)
CREATE TABLE IF NOT EXISTS public.comissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendedor_id INT REFERENCES public.vendedores(id) ON DELETE CASCADE,
    vendedor_codigo VARCHAR(50) NOT NULL,
    pedido_id TEXT REFERENCES public.pedidos(id) ON DELETE CASCADE,
    pagador_cpf VARCHAR(14) NOT NULL,
    valor_comissao NUMERIC(10,2) DEFAULT 20.00,
    status_pagamento VARCHAR(30) DEFAULT 'pendente', -- 'pendente', 'pago'
    data_fechamento DATE NOT NULL,
    data_pagamento DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comissoes_vendedor_mes ON public.comissoes(vendedor_codigo, data_fechamento);

-- 8. TABELA DE LEADS B2B (Quero Vender e Seja uma Cervejaria Parceira)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL, -- 'vendedor' ou 'cervejaria'
    nome TEXT NOT NULL,
    empresa_nome TEXT,
    telefone VARCHAR(30) NOT NULL,
    cidade VARCHAR(100),
    categoria VARCHAR(50),
    mensagem TEXT,
    status VARCHAR(30) DEFAULT 'novo', -- 'novo', 'em_contato', 'aprovado'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cervejarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas de Leitura e Inserção para Aplicação Web
CREATE POLICY "Leitura pública de cervejarias ativas" ON public.cervejarias FOR SELECT USING (status = 'ativo');
CREATE POLICY "Leitura pública de vendedores ativos" ON public.vendedores FOR SELECT USING (status = 'ativo');
CREATE POLICY "Consulta de cartões por QR Token" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Criação de clientes e pedidos no checkout" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Criação de pedidos no checkout" ON public.pedidos FOR ALL USING (true);
CREATE POLICY "Validação de cartões" ON public.validacoes FOR ALL USING (true);
CREATE POLICY "Inserção de leads de parceiros" ON public.leads FOR ALL USING (true);

