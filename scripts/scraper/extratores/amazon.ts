import * as cheerio from 'cheerio';
import type { DadosBrutos } from '../tipos';
import { normalizarPreco, userAgentAleatorio } from '../utils';

interface FetchOptions {
  userAgent: string;
  headers: Record<string, string>;
}

function criarHeaders(): FetchOptions {
  const ua = userAgentAleatorio();
  return {
    userAgent: ua,
    headers: {
      'User-Agent': ua,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  };
}

/**
 * Coleta dados de suplementos de uma pagina de busca da Amazon Brasil
 */
export async function coletarAmazon(url: string): Promise<DadosBrutos[]> {
  const { headers } = criarHeaders();
  const resposta = await fetch(url, { headers, redirect: 'follow' });

  if (!resposta.ok) {
    throw new Error(`Falha ao acessar Amazon: HTTP ${resposta.status}`);
  }

  const html = await resposta.text();
  const $ = cheerio.load(html);
  const resultados: DadosBrutos[] = [];

  // Seletores para resultados de busca da Amazon BR
  const cards = $('[data-component-type="s-search-result"], .s-result-item[data-asin]');

  cards.each((_, card) => {
    const $card = $(card);

    // Extrai nome do produto
    const nomeRaw =
      $card.find('h2 a span').first().text().trim() ||
      $card.find('.a-text-normal').first().text().trim();

    if (!nomeRaw) return;

    // Extrai preco: Amazon tem varios padroes de exibicao de preco
    const precoRaw =
      $card.find('.a-price .a-offscreen').first().text().trim() ||
      $card.find('.a-price-whole').first().text().trim() ||
      $card.find('.a-price').first().text().trim();

    // Extrai imagem
    const imagemUrl =
      $card.find('.s-image').attr('src') || $card.find('img').first().attr('src') || '';

    // Extrai link do produto
    const linkRelativo = $card.find('h2 a').attr('href') || '';
    const urlLoja = linkRelativo ? `https://www.amazon.com.br${linkRelativo.split('?')[0]}` : url;

    // Extrai disponibilidade
    const disponibilidade = $card.find('[data-availability]').text().trim();
    const emEstoque = !disponibilidade || !disponibilidade.toLowerCase().includes('indisponível');

    // Extrai marca (Amazon geralmente inclui marca no titulo)
    const marca = extrairMarcaAmazon(nomeRaw);

    const preco = normalizarPreco(precoRaw);

    if (nomeRaw && preco > 0) {
      resultados.push({
        nome: nomeRaw,
        marca,
        preco,
        loja_nome: 'Amazon',
        url_loja: urlLoja,
        imagem_url: imagemUrl,
        em_estoque: emEstoque,
      });
    }
  });

  return resultados;
}

/**
 * Tenta extrair o nome da marca do titulo do produto na Amazon
 */
function extrairMarcaAmazon(titulo: string): string {
  // Na Amazon BR, a marca costuma aparecer no inicio do titulo
  // Ex: "Max Titanium Whey Protein 900g..."
  const partes = titulo.split(' ');
  const palavrasMarca = Math.min(3, Math.floor(partes.length * 0.3));
  return partes.slice(0, palavrasMarca).join(' ');
}
