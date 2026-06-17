import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Cliente Supabase para o scraper (variaveis de ambiente do CI)
// ============================================================

let _cliente: SupabaseClient | null = null;

export function criarClienteScraper(): SupabaseClient {
  if (!_cliente) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidas no ambiente'
      );
    }
    _cliente = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _cliente;
}

// ============================================================
// Pausa entre requisicoes para evitar bloqueio
// ============================================================

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// User-Agent rotativo (10 UAs reais de navegadores modernos)
// ============================================================

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/110.0.0.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

export function userAgentAleatorio(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ============================================================
// Backoff exponencial com jitter
// ============================================================

export function backoffExponencial(_fonteId: number, tentativa: number): number {
  const base = 1000 * Math.pow(2, tentativa);
  const jitter = Math.floor(Math.random() * 1000);
  return base + jitter;
}

// ============================================================
// Normalizacao de preco: "R$ 99,90" → 99.90
// ============================================================

export function normalizarPreco(texto: string): number {
  // Remove "R$", espacos e converte formato brasileiro (1.234,56)
  let limpo = texto.replace(/R\$\s*/i, '').trim();
  // Se tiver pontos de milhar e virgula decimal
  if (limpo.includes(',') && limpo.includes('.')) {
    // Formato 1.234,56 → remove pontos, troca virgula por ponto
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (limpo.includes(',') && !limpo.includes('.')) {
    // Formato 99,90 → troca virgula por ponto
    limpo = limpo.replace(',', '.');
  }
  // Remove qualquer caractere nao numerico exceto ponto
  limpo = limpo.replace(/[^\d.]/g, '');
  const valor = parseFloat(limpo);
  return isNaN(valor) ? 0 : valor;
}

// ============================================================
// Normalizacao de nome de marca
// ============================================================

const CORRECOES_MARCA: Record<string, string> = {
  'max titanium': 'Max Titanium',
  maxtitanium: 'Max Titanium',
  max_titanium: 'Max Titanium',
  'growth supplements': 'Growth Supplements',
  growthsupplements: 'Growth Supplements',
  'growth suplementos': 'Growth Supplements',
  'integral medica': 'Integral Medica',
  integralmédica: 'Integral Medica',
  integralmedica: 'Integral Medica',
  'dux nutrition': 'Dux Nutrition',
  duxnutrition: 'Dux Nutrition',
  'dark lab': 'Dark Lab',
  darklab: 'Dark Lab',
  probiotica: 'Probiótica',
  probiótica: 'Probiótica',
  vitafor: 'Vitafor',
  'atlhetica nutrition': 'Atlhetica Nutrition',
  atlheticanutrition: 'Atlhetica Nutrition',
  'black skull': 'Black Skull',
  blackskull: 'Black Skull',
  bodyaction: 'BodyAction',
  'body action': 'BodyAction',
};

export function normalizarMarca(texto: string): string {
  if (!texto) return 'Desconhecida';
  let marca = texto.trim();
  const chave = marca
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  if (CORRECOES_MARCA[chave]) {
    return CORRECOES_MARCA[chave];
  }
  // Title case generico
  return marca.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

// ============================================================
// Registro de log de coleta
// ============================================================

export async function registrarLog(
  fonteId: number,
  status: string,
  mensagem: string,
  duracaoMs: number
): Promise<void> {
  const cliente = criarClienteScraper();
  const { error } = await cliente.from('logs_coleta').insert({
    fonte_id: fonteId,
    status,
    mensagem,
    duracao_ms: duracaoMs,
  });
  if (error) {
    console.error(`[ERRO] Falha ao registrar log: ${error.message}`);
  }
}

// ============================================================
// Atualizacao da ultima execucao da fonte
// ============================================================

export async function atualizarUltimaExecucao(fonteId: number): Promise<void> {
  const cliente = criarClienteScraper();
  const { error } = await cliente
    .from('fontes_coleta')
    .update({ ultima_execucao: new Date().toISOString() })
    .eq('id', fonteId);
  if (error) {
    console.error(
      `[ERRO] Falha ao atualizar ultima_execucao da fonte ${fonteId}: ${error.message}`
    );
  }
}
