import { criarClienteAdmin } from '@/lib/supabase/admin';
import {
  OBJETIVO_PARA_CATEGORIAS,
  type Objetivo,
  type FaixaOrcamento,
  type NivelExperiencia,
} from './mapeamentos';
import {
  calcularPontuacaoObjetivo,
  calcularPontuacaoCustoBeneficio,
  calcularPontuacaoQualidade,
  calcularPontuacaoRestricoes,
  calcularPontuacaoExperiencia,
} from './pontuacao';

// ─── Tipos ────────────────────────────────────────────────────────────

interface LinhaPerfil {
  id: string;
  usuario_id: string;
  objetivo: string;
  tipo_dieta: string;
  restricoes: string[];
  nivel_experiencia: string;
  faixa_orcamento: string;
}

interface LinhaCategoria {
  id: string;
  nome: string;
  slug: string;
}

interface LinhaSuplemento {
  id: string;
  nome: string;
  marca: string;
  categoria_id: string;
  categorias_suplementos: { id: number; nome: string; slug: string }[] | null;
  precos_suplementos: { preco: number }[] | null;
  detalhes_suplementos:
    | {
        dose_porcao: number;
        porcoes_por_embalagem: number;
        ingredientes: string[];
        certificacoes: string[];
        registro_anvisa: string | null;
      }[]
    | null;
}

export interface ResultadoRecomendacao {
  suplemento_id: string;
  nome: string;
  marca: string;
  pontuacao: number;
  motivo: string;
}

// ─── Motor ────────────────────────────────────────────────────────────

/**
 * Gera recomendações de suplementos personalizadas com base no perfil do usuário.
 *
 * Fluxo:
 * 1. Obtém as categorias compatíveis com o objetivo
 * 2. Busca todos os suplementos dessas categorias (com preço e detalhes)
 * 3. Calcula 5 critérios de pontuação para cada suplemento
 * 4. Ordena por pontuação decrescente e seleciona os 10 melhores
 * 5. Persiste as recomendações na tabela `recomendacoes`
 * 6. Retorna o array de resultados
 */
export async function gerarRecomendacoes(perfil: LinhaPerfil): Promise<ResultadoRecomendacao[]> {
  const supabase = criarClienteAdmin();

  const objetivo = perfil.objetivo as Objetivo;
  const categoriasCompativeis = OBJETIVO_PARA_CATEGORIAS[objetivo] ?? [];

  if (categoriasCompativeis.length === 0) {
    return [];
  }

  // ── 1. Buscar slugs reais das categorias no banco ──────────────────
  const { data: categoriasDb } = await supabase
    .from('categorias_suplementos')
    .select('id, slug')
    .in('slug', categoriasCompativeis);

  if (!categoriasDb || categoriasDb.length === 0) {
    return [];
  }

  const idsCategoria = categoriasDb.map((c) => c.id);

  // ── 2. Buscar suplementos com preço e detalhes ─────────────────────
  const { data: suplementos } = await supabase
    .from('suplementos')
    .select(
      `
      id,
      nome,
      marca,
      categoria_id,
      categorias_suplementos ( id, nome, slug ),
      precos_suplementos ( preco ),
      detalhes_suplementos (
        dose_porcao,
        porcoes_por_embalagem,
        ingredientes,
        certificacoes,
        registro_anvisa
      )
    `
    )
    .in('categoria_id', idsCategoria);

  if (!suplementos || suplementos.length === 0) {
    return [];
  }

  // ── 3. Calcular custo por dose de cada suplemento (para normalização) ──
  const custosPorDose = suplementos.map((s) => extrairCustoPorDose(s));
  const custosValidos = custosPorDose.filter((c): c is number => c !== null);
  const menorCusto = custosValidos.length > 0 ? Math.min(...custosValidos) : 0;
  const maiorCusto = custosValidos.length > 0 ? Math.max(...custosValidos) : 0;

  // ── 4. Calcular pontuação de cada suplemento ───────────────────────
  const pontuados = suplementos.map((sup, i) => {
    const categoriaSlug = sup.categorias_suplementos?.[0]?.slug ?? '';

    const ptsObjetivo = calcularPontuacaoObjetivo(categoriaSlug, objetivo);
    const ptsCustoBeneficio = calcularPontuacaoCustoBeneficio(
      custosPorDose[i],
      menorCusto,
      maiorCusto,
      perfil.faixa_orcamento as FaixaOrcamento
    );
    const ptsQualidade = calcularPontuacaoQualidade(
      sup.detalhes_suplementos?.[0]?.certificacoes ?? []
    );
    const ptsRestricoes = calcularPontuacaoRestricoes(
      sup.detalhes_suplementos?.[0]?.ingredientes ?? [],
      perfil.restricoes ?? []
    );
    const ptsExperiencia = calcularPontuacaoExperiencia(
      categoriaSlug,
      perfil.nivel_experiencia as NivelExperiencia
    );

    const total = ptsObjetivo + ptsCustoBeneficio + ptsQualidade + ptsRestricoes + ptsExperiencia;

    const motivo = gerarMotivo({
      nome: sup.nome ?? 'Suplemento',
      ptsObjetivo,
      ptsCustoBeneficio,
      ptsQualidade,
      ptsRestricoes,
      ptsExperiencia,
    });

    return {
      suplemento_id: sup.id,
      nome: sup.nome,
      marca: sup.marca,
      pontuacao: total,
      motivo,
    };
  });

  // ── 5. Ordenar e selecionar top 10 ─────────────────────────────────
  pontuados.sort((a, b) => b.pontuacao - a.pontuacao);
  const top10 = pontuados.slice(0, 10);

  if (top10.length === 0) {
    return [];
  }

  // ── 6. Persistir na tabela recomendacoes (upsert) ──────────────────
  const agora = new Date().toISOString();
  const expiracao = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const linhas = top10.map((r) => ({
    usuario_id: perfil.usuario_id,
    suplemento_id: r.suplemento_id,
    pontuacao: r.pontuacao,
    motivo: r.motivo,
    data_criacao: agora,
    data_expiracao: expiracao,
  }));

  await supabase.from('recomendacoes').upsert(linhas, {
    onConflict: 'usuario_id,suplemento_id',
  });

  return top10;
}

// ─── Auxiliares ───────────────────────────────────────────────────────

/** Extrai o custo por dose (R$ / grama de porção) de um suplemento. */
function extrairCustoPorDose(suplemento: LinhaSuplemento): number | null {
  const precos = suplemento.precos_suplementos;
  const detalhes = suplemento.detalhes_suplementos?.[0];

  if (
    !precos ||
    precos.length === 0 ||
    !detalhes ||
    !detalhes.dose_porcao ||
    !detalhes.porcoes_por_embalagem
  ) {
    return null;
  }

  const preco = precos[0].preco;
  const dosesTotais = detalhes.porcoes_por_embalagem * detalhes.dose_porcao;

  if (dosesTotais <= 0) return null;

  return preco / dosesTotais;
}

interface DadosMotivo {
  nome: string;
  ptsObjetivo: number;
  ptsCustoBeneficio: number;
  ptsQualidade: number;
  ptsRestricoes: number;
  ptsExperiencia: number;
}

/** Gera uma string descritiva com o resumo da pontuação. */
function gerarMotivo(d: DadosMotivo): string {
  const partes: string[] = [];

  if (d.ptsObjetivo > 0) partes.push(`objetivo +${d.ptsObjetivo}`);
  if (d.ptsCustoBeneficio > 0) partes.push(`custo-benefício +${d.ptsCustoBeneficio}`);
  if (d.ptsQualidade > 0) partes.push(`qualidade +${d.ptsQualidade}`);
  if (d.ptsRestricoes < 10) partes.push(`restrições +${d.ptsRestricoes}`);
  if (d.ptsExperiencia > 0) partes.push(`experiência +${d.ptsExperiencia}`);

  return partes.length > 0 ? partes.join(', ') : 'pontuação neutra';
}
