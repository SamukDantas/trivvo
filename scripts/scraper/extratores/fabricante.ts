import * as cheerio from 'cheerio';
import type { DadosBrutos } from '../tipos';
import { normalizarPreco, normalizarMarca, userAgentAleatorio, delay } from '../utils';

function criarHeaders(): Record<string, string> {
  const ua = userAgentAleatorio();
  return {
    'User-Agent': ua,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
  };
}

/**
 * Coleta dados de suplementos do site de um fabricante.
 *
 * Tenta primeiro com Cheerio (estatico), e se a pagina parecer depender
 * de JavaScript (poucos produtos encontrados), usa Puppeteer como fallback.
 */
export async function coletarFabricante(url: string): Promise<DadosBrutos[]> {
  // Primeira tentativa: Cheerio (mais rapido)
  let resultados = await coletarComCheerio(url);

  // Se veio vazio, tenta com Puppeteer (sites JS-heavy)
  if (resultados.length === 0) {
    console.log(`[FABRICANTE] Cheerio retornou 0 produtos. Tentando Puppeteer...`);
    resultados = await coletarComPuppeteer(url);
  }

  return resultados;
}

/**
 * Coleta com Cheerio para sites estaticos
 */
async function coletarComCheerio(url: string): Promise<DadosBrutos[]> {
  const headers = criarHeaders();
  const resposta = await fetch(url, { headers, redirect: 'follow' });

  if (!resposta.ok) {
    throw new Error(`Falha ao acessar fabricante: HTTP ${resposta.status}`);
  }

  const html = await resposta.text();
  const $ = cheerio.load(html);
  const resultados: DadosBrutos[] = [];

  // Seletores genericos para sites de fabricantes de suplementos
  // Tenta varios padroes comuns de e-commerce BR

  // Padrao 1: Cards de produto com schema.org ou classes comuns
  const cards = $(
    [
      '[itemtype*="Product"]',
      '.product-item',
      '.product',
      '.produto',
      '.item',
      '.card-produto',
      '.vitrine-item',
      '.shelf-item',
      'article',
      '.collection-item',
    ].join(', ')
  );

  cards.each((_, card) => {
    const $card = $(card);

    const nomeRaw =
      $card.find('[itemprop="name"]').text().trim() ||
      $card.find('.product-name').text().trim() ||
      $card.find('.product-title').text().trim() ||
      $card.find('.nome-produto').text().trim() ||
      $card.find('h2').first().text().trim() ||
      $card.find('h3').first().text().trim();

    if (!nomeRaw) return;

    const precoRaw =
      $card.find('[itemprop="price"]').attr('content') ||
      $card.find('.price').text().trim() ||
      $card.find('.preco').text().trim() ||
      $card.find('.product-price').text().trim();

    const imagemUrl =
      $card.find('[itemprop="image"]').attr('content') ||
      $card.find('img').first().attr('src') ||
      '';

    const linkUrl = $card.find('a').first().attr('href') || url;

    // Ingredientes visiveis na listagem (raro, mas alguns fabricantes mostram)
    const ingredientesRaw: string[] = [];
    $card.find('.ingredientes li, .ingredients li, .composition li').each((_, li) => {
      const texto = $(li).text().trim();
      if (texto) ingredientesRaw.push(texto);
    });

    const preco = normalizarPreco(precoRaw || '0');

    if (nomeRaw) {
      resultados.push({
        nome: nomeRaw,
        marca: extrairMarcaDoTitulo(nomeRaw),
        preco,
        loja_nome: extrairNomeLoja($),
        url_loja: linkUrl,
        imagem_url: imagemUrl,
        ingredientes: ingredientesRaw.length > 0 ? ingredientesRaw : undefined,
        em_estoque: verificarEstoque($card),
      });
    }
  });

  return resultados;
}

/**
 * Coleta com Puppeteer para sites que dependem de JavaScript
 */
async function coletarComPuppeteer(url: string): Promise<DadosBrutos[]> {
  // Import dinamico para nao carregar Puppeteer se nao precisar
  const puppeteer = await import('puppeteer');

  const navegador = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const pagina = await navegador.newPage();
    await pagina.setUserAgent(userAgentAleatorio());
    await pagina.setViewport({ width: 1366, height: 768 });

    await pagina.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Aguarda renderizacao JS
    await delay(2000);

    const html = await pagina.content();
    const $ = cheerio.load(html);
    const resultados: DadosBrutos[] = [];

    // Tenta os mesmos seletores genericos
    const cards = $(
      [
        '[itemtype*="Product"]',
        '.product-item',
        '.product',
        '.produto',
        '.item',
        '.card-produto',
        '.vitrine-item',
        '.shelf-item',
        'article',
        '.collection-item',
      ].join(', ')
    );

    cards.each((_, card) => {
      const $card = $(card);

      const nomeRaw =
        $card.find('[itemprop="name"]').text().trim() ||
        $card.find('.product-name').text().trim() ||
        $card.find('.product-title').text().trim() ||
        $card.find('.nome-produto').text().trim() ||
        $card.find('h2').first().text().trim() ||
        $card.find('h3').first().text().trim();

      if (!nomeRaw || nomeRaw.length < 3) return;

      const precoRaw =
        $card.find('[itemprop="price"]').attr('content') ||
        $card.find('.price').text().trim() ||
        $card.find('.preco').text().trim() ||
        $card.find('.product-price').text().trim();

      const imagemUrl =
        $card.find('[itemprop="image"]').attr('content') ||
        $card.find('img').first().attr('src') ||
        '';

      const linkUrl = $card.find('a').first().attr('href') || url;

      const preco = normalizarPreco(precoRaw || '0');

      resultados.push({
        nome: nomeRaw,
        marca: extrairMarcaDoTitulo(nomeRaw),
        preco,
        loja_nome: 'Site do Fabricante',
        url_loja: linkUrl,
        imagem_url: imagemUrl,
        em_estoque: true,
      });
    });

    return resultados;
  } finally {
    await navegador.close();
  }
}

/**
 * Tenta extrair a marca do titulo do produto
 */
function extrairMarcaDoTitulo(titulo: string): string {
  const partes = titulo.split(/\s+/);
  const candidatos = partes.slice(0, Math.min(3, partes.length));
  return normalizarMarca(candidatos.join(' '));
}

/**
 * Tenta extrair o nome da loja a partir do titulo da pagina
 */
function extrairNomeLoja($: cheerio.CheerioAPI): string {
  const titulo = $('title').text().trim();
  if (titulo) {
    return titulo.split(/[-–|]/)[0]?.trim() || 'Site do Fabricante';
  }
  return 'Site do Fabricante';
}

/**
 * Verifica se o produto esta em estoque baseado em indicadores visuais
 */
function verificarEstoque($card: cheerio.Cheerio<any>): boolean {
  const esgotado = $card.find('.sold-out, .out-of-stock, .esgotado, .indisponivel').length > 0;
  return !esgotado;
}
