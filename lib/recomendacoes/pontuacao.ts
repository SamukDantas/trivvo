import {
  type FaixaOrcamento,
  type NivelExperiencia,
  type Objetivo,
  CATEGORIAS_AVANCADAS,
  CATEGORIAS_BASICAS,
  OBJETIVO_PARA_CATEGORIAS,
  PESO_ORCAMENTO,
  PESOS_CRITERIOS,
  RESTRICAO_PARA_INGREDIENTES,
} from './mapeamentos';

/**
 * Calcula a pontuação de alinhamento com o objetivo do usuário.
 *
 * Se a categoria do suplemento estiver entre as categorias compatíveis
 * com o objetivo, retorna a pontuação máxima (40). Caso contrário, 0.
 */
export function calcularPontuacaoObjetivo(categoriaSlug: string, objetivo: Objetivo): number {
  const categorias = OBJETIVO_PARA_CATEGORIAS[objetivo] ?? [];
  return categorias.includes(categoriaSlug) ? PESOS_CRITERIOS.objetivo : 0;
}

/**
 * Calcula a pontuação de custo‑benefício com base no preço por dose.
 *
 * O menor custoPorDose recebe a nota máxima (25) e o maior recebe 0.
 * O resultado é multiplicado pelo peso do orçamento do usuário,
 * sem ultrapassar o teto de 25.
 */
export function calcularPontuacaoCustoBeneficio(
  custoPorDose: number | null,
  menorCusto: number,
  maiorCusto: number,
  faixaOrcamento: FaixaOrcamento
): number {
  if (custoPorDose === null || maiorCusto <= menorCusto) {
    return PESOS_CRITERIOS.custoBeneficio * PESO_ORCAMENTO[faixaOrcamento];
  }

  const normalizado = (maiorCusto - custoPorDose) / (maiorCusto - menorCusto);

  const bruto = Math.round(normalizado * PESOS_CRITERIOS.custoBeneficio);
  const ponderado = Math.round(bruto * PESO_ORCAMENTO[faixaOrcamento]);

  return Math.min(ponderado, PESOS_CRITERIOS.custoBeneficio);
}

/** Valor de cada certificação para o critério de qualidade. */
const PONTOS_CERTIFICACAO: Record<string, number> = {
  creapure: 15,
  informed_sport: 10,
  anvisa_ativo: 10,
  laudo_pureza: 5,
};

/**
 * Calcula a pontuação de qualidade com base nas certificações do suplemento.
 *
 * Cada certificação presente no JSONB `certificacoes` contribui com
 * uma quantidade fixa de pontos, limitada ao teto de 20.
 */
export function calcularPontuacaoQualidade(certificacoes: string[]): number {
  let soma = 0;

  for (const cert of certificacoes) {
    const chave = cert.toLowerCase().trim();
    soma += PONTOS_CERTIFICACAO[chave] ?? 0;
  }

  return Math.min(soma, PESOS_CRITERIOS.qualidade);
}

/**
 * Calcula a penalidade por restrições alimentares.
 *
 * Cada ingrediente do suplemento é comparado (busca parcial, case‑insensitive)
 * com a lista de ingredientes proibidos para cada restrição do usuário.
 * Cada conflito reduz 5 pontos. O piso é 0.
 */
export function calcularPontuacaoRestricoes(ingredientes: string[], restricoes: string[]): number {
  let penalidade = 0;

  for (const restricao of restricoes) {
    const proibidos = RESTRICAO_PARA_INGREDIENTES[restricao.toLowerCase()] ?? [];

    for (const ingrediente of ingredientes) {
      const ing = ingrediente.toLowerCase();

      if (proibidos.some((p) => ing.includes(p))) {
        penalidade += 5;
        break; // conta no máximo uma vez por restrição
      }
    }
  }

  return Math.max(PESOS_CRITERIOS.restricoes - penalidade, 0);
}

/**
 * Calcula a pontuação com base no nível de experiência do usuário.
 *
 * Iniciante (5): apenas categorias básicas recebem os 5 pontos.
 * Intermediário (5): todas as categorias recebem os 5 pontos.
 * Avançado (5): todas as categorias recebem os 5 pontos
 * (incluindo categorias avançadas que iniciante não deveria usar).
 */
export function calcularPontuacaoExperiencia(
  categoriaSlug: string,
  nivel: NivelExperiencia
): number {
  if (nivel === 'iniciante') {
    return CATEGORIAS_BASICAS.includes(categoriaSlug) ? PESOS_CRITERIOS.experiencia : 0;
  }

  // intermediário e avançado recebem pontuação máxima em todas as categorias
  return PESOS_CRITERIOS.experiencia;
}
