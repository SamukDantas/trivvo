export type Objetivo = 'hipertrofia' | 'emagrecimento' | 'saude' | 'performance' | 'longevidade';

export type TipoDieta = 'onivoro' | 'vegetariano' | 'vegano' | 'lowcarb' | 'cetogenica';

export type NivelExperiencia = 'iniciante' | 'intermediario' | 'avancado';

export type FaixaOrcamento = 'baixo' | 'medio' | 'alto';

/**
 * Categorias de suplementos compatíveis com cada objetivo.
 * As slugs devem corresponder à coluna `slug` da tabela `categorias_suplementos`.
 */
export const OBJETIVO_PARA_CATEGORIAS: Record<Objetivo, string[]> = {
  hipertrofia: ['creatina', 'whey_protein', 'bcaa', 'beta_alanina', 'glutamina'],
  emagrecimento: ['termogenicos', 'cafeina', 'cla', 'l_carnitina', 'fibras'],
  saude: ['multivitaminicos', 'omega_3', 'vitamina_d', 'probioticos', 'magnesio'],
  performance: ['pre_treino', 'cafeina', 'beta_alanina', 'carboidratos', 'nitratos'],
  longevidade: ['coenzima_q10', 'resveratrol', 'colageno', 'omega_3', 'curcumina'],
};

/**
 * Ingredientes que cada restrição alimentar deve evitar.
 * Mapeamento: chave da restrição → lista de termos a serem procurados nos ingredientes.
 */
export const RESTRICAO_PARA_INGREDIENTES: Record<string, string[]> = {
  lactose: ['whey', 'leite', 'lactose', 'caseina'],
  gluten: ['gluten', 'trigo', 'cevada', 'malte'],
  soja: ['soja', 'proteina de soja'],
  edulcorantes: ['aspartame', 'sucralose', 'acessulfame'],
  corantes: ['corante', 'tartrazina'],
};

/** Categorias consideradas básicas — ideais para iniciantes. */
export const CATEGORIAS_BASICAS = [
  'creatina',
  'whey_protein',
  'multivitaminicos',
  'omega_3',
  'vitamina_d',
];

/** Categorias avançadas — exigem mais conhecimento para uso adequado. */
export const CATEGORIAS_AVANCADAS = ['nitratos', 'resveratrol', 'coenzima_q10', 'pre_treino'];

/**
 * Multiplicador aplicado ao critério de custo‑benefício com base na faixa de orçamento.
 * Orçamento baixo → custo‑benefício pesa mais. Orçamento alto → pesa menos.
 */
export const PESO_ORCAMENTO: Record<FaixaOrcamento, number> = {
  baixo: 2,
  medio: 1,
  alto: 0.5,
};

/** Pontuação máxima de cada critério. */
export const PESOS_CRITERIOS = {
  objetivo: 40,
  custoBeneficio: 25,
  qualidade: 20,
  restricoes: 10,
  experiencia: 5,
} as const;
