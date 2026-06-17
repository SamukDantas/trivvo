-- Migração 001: Schema Inicial da Plataforma de Suplementos
-- Executar via SQL Editor do Supabase Dashboard

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE objetivo AS ENUM (
  'hipertrofia',
  'emagrecimento',
  'saude',
  'performance',
  'longevidade'
);

CREATE TYPE tipo_dieta AS ENUM (
  'onivoro',
  'vegetariano',
  'vegano',
  'lowcarb',
  'cetogenica'
);

CREATE TYPE nivel_experiencia AS ENUM (
  'iniciante',
  'intermediario',
  'avancado'
);

CREATE TYPE faixa_orcamento AS ENUM (
  'baixo',
  'medio',
  'alto'
);

CREATE TYPE tipo_origem AS ENUM (
  'amazon',
  'mercadolivre',
  'fabricante',
  'loja_especializada'
);

-- ============================================================
-- TABELAS
-- ============================================================

-- Categorias de suplementos
CREATE TABLE categorias_suplementos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Suplementos (produtos, populado pelo scraper)
CREATE TABLE suplementos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL,
  marca TEXT NOT NULL,
  categoria_id BIGINT REFERENCES categorias_suplementos(id),
  imagem_url TEXT,
  url_origem TEXT,
  tipo_origem tipo_origem,
  ultima_coleta TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nome, marca)
);

-- Detalhes do suplemento (composição, 1:1 com suplementos)
CREATE TABLE detalhes_suplementos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  suplemento_id BIGINT REFERENCES suplementos(id) ON DELETE CASCADE UNIQUE,
  dose_porcao TEXT,
  porcoes_por_embalagem INTEGER,
  ingredientes JSONB DEFAULT '[]',
  certificacoes JSONB DEFAULT '[]',
  registro_anvisa TEXT,
  efeitos_observados JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de preços (1:N com suplementos)
CREATE TABLE precos_suplementos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  suplemento_id BIGINT REFERENCES suplementos(id) ON DELETE CASCADE,
  preco NUMERIC(10,2) NOT NULL,
  loja_nome TEXT,
  url_loja TEXT,
  data_coleta TIMESTAMPTZ DEFAULT NOW(),
  em_estoque BOOLEAN DEFAULT TRUE
);

-- Perfil do usuário (1:1 com auth.users)
CREATE TABLE perfis (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome TEXT,
  data_nascimento DATE,
  objetivo objetivo,
  tipo_dieta tipo_dieta,
  restricoes JSONB DEFAULT '[]',
  nivel_experiencia nivel_experiencia,
  faixa_orcamento faixa_orcamento,
  consentimento_lgpd BOOLEAN DEFAULT FALSE,
  consentimento_data TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Recomendações (cache por usuário, expira em 24h)
CREATE TABLE recomendacoes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  suplemento_id BIGINT REFERENCES suplementos(id) ON DELETE CASCADE,
  pontuacao NUMERIC(5,2),
  motivo TEXT,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_expiracao TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Favoritos do usuário
CREATE TABLE favoritos_usuario (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  suplemento_id BIGINT REFERENCES suplementos(id) ON DELETE CASCADE,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, suplemento_id)
);

-- Fontes de coleta (URLs alvo do scraper)
CREATE TABLE fontes_coleta (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL,
  url_base TEXT NOT NULL,
  tipo tipo_origem,
  ativa BOOLEAN DEFAULT TRUE,
  ultima_execucao TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Log de execução do scraper
CREATE TABLE logs_coleta (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fonte_id BIGINT REFERENCES fontes_coleta(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  mensagem TEXT,
  duracao_ms INTEGER,
  data_execucao TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_suplementos_categoria ON suplementos(categoria_id);
CREATE INDEX idx_suplementos_marca ON suplementos(marca);
CREATE INDEX idx_suplementos_ativo ON suplementos(ativo) WHERE ativo = TRUE;
CREATE INDEX idx_precos_suplemento ON precos_suplementos(suplemento_id);
CREATE INDEX idx_precos_data ON precos_suplementos(data_coleta DESC);
CREATE INDEX idx_recomendacoes_usuario ON recomendacoes(usuario_id);
CREATE INDEX idx_recomendacoes_expiracao ON recomendacoes(data_expiracao);
CREATE INDEX idx_favoritos_usuario ON favoritos_usuario(usuario_id);
CREATE INDEX idx_logs_coleta_fonte ON logs_coleta(fonte_id);
CREATE INDEX idx_logs_coleta_data ON logs_coleta(data_execucao DESC);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

-- perfis: usuário só vê e edita o próprio
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprio_perfil" ON perfis
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "usuario_cria_proprio_perfil" ON perfis
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "usuario_atualiza_proprio_perfil" ON perfis
  FOR UPDATE USING (auth.uid() = usuario_id);

-- favoritos_usuario: usuário só gerencia os próprios
ALTER TABLE favoritos_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprios_favoritos" ON favoritos_usuario
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "usuario_adiciona_favorito" ON favoritos_usuario
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "usuario_remove_favorito" ON favoritos_usuario
  FOR DELETE USING (auth.uid() = usuario_id);

-- recomendacoes: usuário só vê as próprias
ALTER TABLE recomendacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprias_recomendacoes" ON recomendacoes
  FOR SELECT USING (auth.uid() = usuario_id);

-- Leitura pública para tabelas de produtos
ALTER TABLE suplementos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura_publica_suplementos" ON suplementos
  FOR SELECT USING (TRUE);

ALTER TABLE precos_suplementos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura_publica_precos" ON precos_suplementos
  FOR SELECT USING (TRUE);

ALTER TABLE categorias_suplementos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura_publica_categorias" ON categorias_suplementos
  FOR SELECT USING (TRUE);

ALTER TABLE detalhes_suplementos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura_publica_detalhes" ON detalhes_suplementos
  FOR SELECT USING (TRUE);

-- fontes_coleta e logs_coleta: apenas service_role (admin)
ALTER TABLE fontes_coleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_coleta ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GATILHO: Criar perfil automaticamente ao cadastrar usuário
-- ============================================================

CREATE OR REPLACE FUNCTION criar_perfil_novo_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO perfis (usuario_id, consentimento_lgpd, consentimento_data)
  VALUES (NEW.id, FALSE, NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER ao_criar_usuario
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION criar_perfil_novo_usuario();

-- ============================================================
-- DADOS INICIAIS: Categorias de suplementos
-- ============================================================

INSERT INTO categorias_suplementos (nome, slug, descricao) VALUES
  ('Whey Protein', 'whey_protein', 'Proteína do soro do leite para recuperação e construção muscular'),
  ('Creatina', 'creatina', 'Melhora performance e recuperação em treinos de força e explosão'),
  ('BCAA', 'bcaa', 'Aminoácidos de cadeia ramificada para recuperação muscular'),
  ('Beta-Alanina', 'beta_alanina', 'Tamponamento de ácido lático para performance prolongada'),
  ('Glutamina', 'glutamina', 'Aminoácido para recuperação muscular e suporte imunológico'),
  ('Termogênicos', 'termogenicos', 'Aceleram o metabolismo para auxiliar no emagrecimento'),
  ('Cafeína', 'cafeina', 'Estimulante para foco, energia e performance'),
  ('CLA', 'cla', 'Ácido linoleico conjugado para composição corporal'),
  ('L-Carnitina', 'l_carnitina', 'Transporte de ácidos graxos para mitocôndrias'),
  ('Fibras', 'fibras', 'Saúde digestiva e promoção de saciedade'),
  ('Multivitamínicos', 'multivitaminicos', 'Vitaminas e minerais essenciais para o dia a dia'),
  ('Ômega 3', 'omega_3', 'Ácidos graxos essenciais para saúde cardiovascular e cerebral'),
  ('Vitamina D', 'vitamina_d', 'Saúde óssea, imunidade e regulação hormonal'),
  ('Probióticos', 'probioticos', 'Saúde da microbiota intestinal e imunidade'),
  ('Magnésio', 'magnesio', 'Relaxamento muscular, qualidade do sono e +300 reações enzimáticas'),
  ('Pré-Treino', 'pre_treino', 'Energia, foco e vasodilatação para o momento do treino'),
  ('Carboidratos', 'carboidratos', 'Energia rápida e reposição de glicogênio para performance'),
  ('Nitratos', 'nitratos', 'Vasodilatação e melhora do fluxo sanguíneo'),
  ('Coenzima Q10', 'coenzima_q10', 'Antioxidante para energia celular e saúde cardiovascular'),
  ('Resveratrol', 'resveratrol', 'Polifenol antioxidante associado à longevidade'),
  ('Colágeno', 'colageno', 'Saúde articular, elasticidade da pele e integridade dos tecidos'),
  ('Curcumina', 'curcumina', 'Anti-inflamatório natural com propriedades antioxidantes');
