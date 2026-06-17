import type { DadosBrutos, DadosNormalizados } from './tipos';
import { normalizarMarca } from './utils';

// ============================================================
// Mapeamento de certificacoes para nomes padronizados
// ============================================================

const MAPEAMENTO_CERTIFICACOES: Record<string, string> = {
  creapure: 'creapure',
  'creapure®': 'creapure',
  'creapure ™': 'creapure',
  creapure_original: 'creapure',
  'hormone free': 'hormone_free',
  'hormone-free': 'hormone_free',
  sem_hormonios: 'hormone_free',
  'gmo free': 'gmo_free',
  'gmo-free': 'gmo_free',
  nao_transgenico: 'gmo_free',
  'não transgênico': 'gmo_free',
  gluten_free: 'gluten_free',
  'gluten-free': 'gluten_free',
  sem_gluten: 'gluten_free',
  'sem glúten': 'gluten_free',
  lactose_free: 'lactose_free',
  'lactose-free': 'lactose_free',
  sem_lactose: 'lactose_free',
  'sem lactose': 'lactose_free',
  vegano: 'vegano',
  vegan: 'vegano',
  '100% vegan': 'vegano',
  'gmp certified': 'gmp',
  gmp: 'gmp',
  boas_praticas_fabricacao: 'gmp',
  'iso 9001': 'iso_9001',
  iso9001: 'iso_9001',
  'iso 22000': 'iso_22000',
  iso22000: 'iso_22000',
  fsma: 'fsma',
  'fda registered': 'fda',
  fda: 'fda',
  anvisa: 'anvisa',
  'registro anvisa': 'anvisa',
  'sem corantes': 'sem_corantes',
  sem_corantes_artificiais: 'sem_corantes',
  'sem conservantes': 'sem_conservantes',
  sem_conservantes: 'sem_conservantes',
  'sem adocantes': 'sem_adocantes',
  sem_adocantes_artificiais: 'sem_adocantes',
  'third party tested': 'testado_terceira_parte',
  third_party_tested: 'testado_terceira_parte',
  testado_por_terceiros: 'testado_terceira_parte',
  'informed sport': 'informed_sport',
  informed_sport: 'informed_sport',
  'informed choice': 'informed_choice',
  informed_choice: 'informed_choice',
  'banned substance free': 'substancias_proibidas_livre',
  banned_substance_free: 'substancias_proibidas_livre',
  'livre de substâncias proibidas': 'substancias_proibidas_livre',
};

function normalizarCertificacao(raw: string): string {
  const chave = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[®™©]/g, '') // remove simbolos de marca
    .replace(/[^a-z0-9_]/g, '_') // substitui nao alfanumericos por _
    .replace(/_+/g, '_') // remove underscores duplicados
    .replace(/^_|_$/g, ''); // remove underscores nas bordas

  return MAPEAMENTO_CERTIFICACOES[chave] || chave;
}

// ============================================================
// Limpeza de nome de produto
// ============================================================

function limparNomeProduto(nome: string): string {
  return (
    nome
      .trim()
      .replace(/\s+/g, ' ')
      // Remove palavras promocionais comuns
      .replace(
        /\b(promoção|promocao|oferta|imperdível|imperdivel|frete grátis|frete gratis|entrega rápida|entrega rapida)\b/gi,
        ''
      )
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// ============================================================
// Deducao de lista de ingredientes
// ============================================================

function deduplicarIngredientes(ingredientes: string[]): string[] {
  const normalizados = ingredientes.map((i) =>
    i
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  );
  return [...new Set(normalizados)].map((i) => i.charAt(0).toUpperCase() + i.slice(1));
}

// ============================================================
// Normalizador principal
// ============================================================

export function normalizarDados(brutos: DadosBrutos, tipoOrigem: string): DadosNormalizados {
  const nome = limparNomeProduto(brutos.nome);
  const marca = normalizarMarca(brutos.marca);

  const ingredientes = brutos.ingredientes ? deduplicarIngredientes(brutos.ingredientes) : [];

  const certificacoes = brutos.certificacoes
    ? [...new Set(brutos.certificacoes.map(normalizarCertificacao))]
    : [];

  return {
    suplemento: {
      nome,
      marca,
      imagem_url: brutos.imagem_url || '',
      url_origem: brutos.url_loja,
      tipo_origem: tipoOrigem,
    },
    detalhes: {
      dose_porcao: brutos.dose_porcao || '',
      porcoes_por_embalagem: brutos.porcoes_por_embalagem || 0,
      ingredientes,
      certificacoes,
      registro_anvisa: brutos.registro_anvisa || '',
      efeitos_observados: [],
    },
    preco: {
      preco: brutos.preco,
      loja_nome: brutos.loja_nome,
      url_loja: brutos.url_loja,
      em_estoque: brutos.em_estoque,
    },
  };
}
