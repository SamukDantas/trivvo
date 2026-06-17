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
    Pragma: 'no-cache',
    'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
}

export async function coletarAmazon(url: string): Promise<DadosBrutos[]> {
  const headers = criarHeaders();
  const resposta = await fetch(url, { headers, redirect: 'follow' });

  if (!resposta.ok) {
    if (resposta.status === 503 || resposta.status === 429) {
      throw new Error('Amazon bloqueou a requisição (bot detection)');
    }
    throw new Error(`Falha ao acessar Amazon: HTTP ${resposta.status}`);
  }

  const html = await resposta.text();

  if (html.includes('Type the characters you see') || html.includes('api-services-support')) {
    throw new Error('Amazon apresentou CAPTCHA');
  }

  const $ = cheerio.load(html);
  const resultados: DadosBrutos[] = [];

  const cards = $(
    '[data-component-type="s-search-result"], .s-result-item[data-asin], .s-result-item'
  );

  cards.each((_, card) => {
    const $card = $(card);

    const nomeRaw =
      $card.find('h2 a span').first().text().trim() ||
      $card.find('.a-text-normal').first().text().trim() ||
      $card.find('.a-link-normal .a-text-normal').first().text().trim();

    if (!nomeRaw || nomeRaw.toLowerCase().includes('patrocinado')) return;

    const precoRaw =
      $card.find('.a-price .a-offscreen').first().text().trim() ||
      $card.find('.a-price-whole').first().text().trim() ||
      $card.find('.a-price').first().text().trim();

    const imagemUrl =
      $card.find('.s-image').attr('src') || $card.find('img').first().attr('src') || '';

    const linkRelativo = $card.find('h2 a').attr('href') || '';
    const urlLoja = linkRelativo ? `https://www.amazon.com.br${linkRelativo}` : url;

    const marca = extrairMarca(nomeRaw);
    const preco = normalizarPreco(precoRaw);

    if (nomeRaw && preco > 0 && isSuplemento(nomeRaw)) {
      resultados.push({
        nome: nomeRaw,
        marca,
        preco,
        loja_nome: 'Amazon',
        url_loja: urlLoja,
        imagem_url: imagemUrl,
        em_estoque: true,
      });
    }
  });

  return resultados;
}
