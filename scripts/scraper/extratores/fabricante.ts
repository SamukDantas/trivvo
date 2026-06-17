import * as cheerio from 'cheerio';
import type { DadosBrutos } from '../tipos';
import { normalizarPreco, userAgentAleatorio } from '../utils';
import { isSuplemento } from '../filtro';
import { extrairMarca } from '../marcas';

function criarHeaders(): Record<string, string> {
  const ua = userAgentAleatorio();
  return {
    'User-Agent': ua,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  };
}

export async function coletarFabricante(url: string): Promise<DadosBrutos[]> {
  const headers = criarHeaders();
  const resposta = await fetch(url, { headers, redirect: 'follow' });

  if (!resposta.ok) {
    throw new Error(`Falha ao acessar fabricante: HTTP ${resposta.status}`);
  }

  const html = await resposta.text();
  const $ = cheerio.load(html);
  const resultados: DadosBrutos[] = [];

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
      '.slick-slide',
      '.swiper-slide',
      'li.produto',
    ].join(', ')
  );

  let encontrados = 0;

  cards.each((_, card) => {
    const $card = $(card);

    const nomeRaw =
      $card.find('[itemprop="name"]').text().trim() ||
      $card.find('.product-name').text().trim() ||
      $card.find('.product-title').text().trim() ||
      $card.find('.nome-produto').text().trim() ||
      $card.find('.title').text().trim() ||
      $card.find('h2').first().text().trim() ||
      $card.find('h3').first().text().trim();

    if (!nomeRaw || nomeRaw.length < 5) return;

    const precoRaw =
      $card.find('[itemprop="price"]').attr('content') ||
      $card.find('.price').text().trim() ||
      $card.find('.preco').text().trim() ||
      $card.find('.product-price').text().trim() ||
      $card.find('.regular-price').text().trim();

    const imagemUrl =
      $card.find('[itemprop="image"]').attr('content') ||
      $card.find('img').first().attr('src') ||
      '';

    const linkUrl = $card.find('a').first().attr('href') || url;
    const urlLoja = linkUrl.startsWith('http') ? linkUrl : `${url}${linkUrl}`;

    const marca = extrairMarca(nomeRaw);
    const preco = normalizarPreco(precoRaw);

    if (nomeRaw && preco > 0 && isSuplemento(nomeRaw)) {
      resultados.push({
        nome: nomeRaw,
        marca,
        preco,
        loja_nome: 'Fabricante',
        url_loja: urlLoja,
        imagem_url: imagemUrl,
        em_estoque: true,
      });
      encontrados++;
    }
  });

  return resultados;
}
