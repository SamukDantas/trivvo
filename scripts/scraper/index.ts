import {
  criarClienteScraper,
  delay,
  backoffExponencial,
  atualizarUltimaExecucao,
  registrarLog,
} from './utils';
import { normalizarDados } from './normalizador';
import { coletarAmazon } from './extratores/amazon';
import { coletarMercadoLivre } from './extratores/mercadolivre';
import { coletarFabricante } from './extratores/fabricante';
import { coletarShopify } from './extratores/shopify';
import type { DadosBrutos, ResultadoColeta } from './tipos';

// ============================================================
// Configuracao
// ============================================================

const MAX_PRODUTOS = 50;
const DELAY_MIN_MS = 2000;
const DELAY_MAX_MS = 5000;
const MAX_TENTATIVAS = 3;

// Mapeia tipo_origem para a funcao extratora correspondente
const EXTRATORES: Record<string, (url: string) => Promise<DadosBrutos[]>> = {
  amazon: coletarAmazon,
  mercadolivre: coletarMercadoLivre,
  fabricante: coletarFabricante,
  shopify: coletarShopify,
  loja_especializada: coletarFabricante,
};

// ============================================================
// Helpers
// ============================================================

function delayAleatorio(): Promise<void> {
  const ms = Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1)) + DELAY_MIN_MS;
  return delay(ms);
}

function agora(): number {
  return Date.now();
}

// ============================================================
// Upsert de suplemento e retorna o ID
// ============================================================

async function upsertSuplemento(
  dados: ReturnType<typeof normalizarDados>,
  tipoOrigem: string
): Promise<number | null> {
  const cliente = criarClienteScraper();

  // Upsert: ON CONFLICT (nome, marca) DO UPDATE
  const { data, error } = await cliente
    .from('suplementos')
    .upsert(
      {
        nome: dados.suplemento.nome,
        marca: dados.suplemento.marca,
        imagem_url: dados.suplemento.imagem_url,
        url_origem: dados.suplemento.url_origem,
        tipo_origem: tipoOrigem,
        ultima_coleta: new Date().toISOString(),
        ativo: true,
      },
      {
        onConflict: 'nome,marca',
        ignoreDuplicates: false,
      }
    )
    .select('id')
    .single();

  if (error) {
    console.error(`[ERRO] Upsert suplemento "${dados.suplemento.nome}": ${error.message}`);
    return null;
  }

  return (data as { id: number } | null)?.id ?? null;
}

// ============================================================
// Upsert detalhes do suplemento
// ============================================================

async function upsertDetalhes(
  suplementoId: number,
  dados: ReturnType<typeof normalizarDados>
): Promise<void> {
  const cliente = criarClienteScraper();

  const { error } = await cliente.from('detalhes_suplementos').upsert(
    {
      suplemento_id: suplementoId,
      dose_porcao: dados.detalhes.dose_porcao,
      porcoes_por_embalagem: dados.detalhes.porcoes_por_embalagem,
      ingredientes: dados.detalhes.ingredientes,
      certificacoes: dados.detalhes.certificacoes,
      registro_anvisa: dados.detalhes.registro_anvisa,
      efeitos_observados: dados.detalhes.efeitos_observados,
    },
    {
      onConflict: 'suplemento_id',
      ignoreDuplicates: false,
    }
  );

  if (error) {
    console.error(`[ERRO] Upsert detalhes suplemento ${suplementoId}: ${error.message}`);
  }
}

// ============================================================
// Insere preco (historico, sempre insere)
// ============================================================

async function inserirPreco(
  suplementoId: number,
  dados: ReturnType<typeof normalizarDados>
): Promise<void> {
  const cliente = criarClienteScraper();

  const { error } = await cliente.from('precos_suplementos').insert({
    suplemento_id: suplementoId,
    preco: dados.preco.preco,
    loja_nome: dados.preco.loja_nome,
    url_loja: dados.preco.url_loja,
    em_estoque: dados.preco.em_estoque,
  });

  if (error) {
    console.error(`[ERRO] Insercao de preco suplemento ${suplementoId}: ${error.message}`);
  }
}

// ============================================================
// Processa uma unica fonte de coleta
// ============================================================

async function processarFonte(fonte: {
  id: number;
  nome: string;
  url_base: string;
  tipo: string;
}): Promise<ResultadoColeta> {
  const inicio = agora();
  const extrator = EXTRATORES[fonte.tipo];

  if (!extrator) {
    return {
      fonte_id: fonte.id,
      status: 'falha',
      produtos: 0,
      mensagem: `Tipo de origem nao suportado: ${fonte.tipo}`,
      duracao_ms: agora() - inicio,
    };
  }

  let produtosBrutos: DadosBrutos[] = [];

  // Tenta extrair com backoff exponencial
  for (let tentativa = 0; tentativa < MAX_TENTATIVAS; tentativa++) {
    try {
      produtosBrutos = await extrator(fonte.url_base);
      break;
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      console.error(`[TENTATIVA ${tentativa + 1}/${MAX_TENTATIVAS}] ${fonte.nome}: ${msg}`);
      if (tentativa < MAX_TENTATIVAS - 1) {
        const espera = backoffExponencial(fonte.id, tentativa);
        await delay(espera);
      }
    }
  }

  // Se falhou todas as tentativas
  if (produtosBrutos.length === 0) {
    return {
      fonte_id: fonte.id,
      status: 'falha',
      produtos: 0,
      mensagem: 'Nenhum produto encontrado apos todas as tentativas',
      duracao_ms: agora() - inicio,
    };
  }

  // Limita ao maximo de produtos
  const limite = Math.min(produtosBrutos.length, MAX_PRODUTOS);
  let sucessos = 0;
  const falhas: string[] = [];

  for (let i = 0; i < limite; i++) {
    try {
      const bruto = produtosBrutos[i];
      const normalizado = normalizarDados(bruto, fonte.tipo);

      const suplementoId = await upsertSuplemento(normalizado, fonte.tipo);

      if (suplementoId) {
        await upsertDetalhes(suplementoId, normalizado);
        await inserirPreco(suplementoId, normalizado);
        sucessos++;
      } else {
        falhas.push(`Falha no upsert de "${bruto.nome}"`);
      }

      // Delay entre produtos para evitar bloqueio
      if (i < limite - 1) {
        await delayAleatorio();
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      falhas.push(msg);
    }
  }

  const duracao = agora() - inicio;
  const status: ResultadoColeta['status'] =
    falhas.length === 0 ? 'sucesso' : sucessos > 0 ? 'falha_parcial' : 'falha';

  const mensagem =
    status === 'sucesso'
      ? `${sucessos} produtos coletados com sucesso`
      : `${sucessos} sucessos, ${falhas.length} falhas: ${falhas.slice(0, 3).join('; ')}`;

  return {
    fonte_id: fonte.id,
    status,
    produtos: sucessos,
    mensagem,
    duracao_ms: duracao,
  };
}

// ============================================================
// Funcao principal
// ============================================================

async function executarColeta(): Promise<void> {
  console.log('=== INICIANDO COLETA DE SUPLEMENTOS ===');
  console.log(`Data: ${new Date().toISOString()}`);
  console.log(`Maximo de produtos por execucao: ${MAX_PRODUTOS}`);

  const inicioTotal = agora();
  const cliente = criarClienteScraper();

  // Busca fontes ativas
  const { data: fontes, error } = await cliente
    .from('fontes_coleta')
    .select('id, nome, url_base, tipo')
    .eq('ativa', true)
    .order('id');

  if (error) {
    console.error(`[ERRO] Falha ao buscar fontes: ${error.message}`);
    process.exit(1);
  }

  if (!fontes || fontes.length === 0) {
    console.log('Nenhuma fonte ativa encontrada. Encerrando.');
    return;
  }

  console.log(`${fontes.length} fonte(s) ativa(s) encontrada(s).\n`);

  const resultados: ResultadoColeta[] = [];

  for (let i = 0; i < fontes.length; i++) {
    const fonte = fontes[i];
    console.log(`[${i + 1}/${fontes.length}] Processando: ${fonte.nome} (${fonte.tipo})`);

    const resultado = await processarFonte(fonte);
    resultados.push(resultado);

    // Registra log no banco
    await registrarLog(
      resultado.fonte_id,
      resultado.status,
      resultado.mensagem,
      resultado.duracao_ms
    );

    // Atualiza ultima execucao da fonte
    await atualizarUltimaExecucao(resultado.fonte_id);

    console.log(
      `  → Status: ${resultado.status} | Produtos: ${resultado.produtos} | ${resultado.duracao_ms}ms`
    );
    console.log(`  → ${resultado.mensagem}\n`);

    // Delay entre fontes
    if (i < fontes.length - 1) {
      await delayAleatorio();
    }
  }

  // Resumo final
  const duracaoTotal = agora() - inicioTotal;
  const totalProdutos = resultados.reduce((soma, r) => soma + r.produtos, 0);
  const sucessos = resultados.filter((r) => r.status === 'sucesso').length;
  const parciais = resultados.filter((r) => r.status === 'falha_parcial').length;
  const falhasTotal = resultados.filter((r) => r.status === 'falha').length;

  console.log('=== RESUMO DA COLETA ===');
  console.log(`Fontes processadas: ${resultados.length}`);
  console.log(`Sucesso: ${sucessos} | Parcial: ${parciais} | Falha: ${falhasTotal}`);
  console.log(`Total de produtos coletados: ${totalProdutos}`);
  console.log(`Duracao total: ${duracaoTotal}ms`);
  console.log('=== FIM ===');
}

// Executa
executarColeta().catch((erro) => {
  console.error('[ERRO FATAL]', erro);
  process.exit(1);
});
