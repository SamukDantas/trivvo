import * as cheerio from 'cheerio';
import type { DadosBrutos } from '../tipos';
import { normalizarPreco, userAgentAleatorio } from '../utils';
import { isSuplemento } from '../filtro';
import { extrairMarca } from '../marcas';

function criarHeaders(): Record<string, string> {
  const ua = userAgentAleatorio();
  return {
    'User-Agent': ua,
    Accept: 'text/html,application/xml+xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  };
}

export async function coletarMercadoLivre(url: string): Promise<DadosBrutos[]> {
  const headers = criarHeaders();
  const resposta = await fetch(url, { headers, redirect: 'follow' });

  if (!resposta.ok) {
    if (resposta.status === 403 || resposta.status === 429) {
      throw new Error('Mercado Livre bloqueou a requisicao (bot detection)');
    }
    throw new Error(`Falha ao acessar Mercado Livre: HTTP ${resposta.status}`);
  }

  const html = await resposta.text();

  if (
    html.includes('Desculpe') ||
    html.includes('Was that a robot') ||
    html.includes('robotcheck')
  ) {
    throw new Error('Mercado Livre apresentou CAPTCHA ou bloqueio');
  }

  const $ = cheerio.load(html);
  const resultados: DadosBrutos[] = [];

  const cards = $('.ui-search-layout__item, .ui-search-result, li.ui-search-layout__item');

  cards.each((_, card) => {
    const $card = $(card);

    const nomeRaw =
      $card.find('.ui-search-item__title').text().trim() ||
      $card.find('.poly-component__title').first().text().trim() ||
      $card.find('h2').first().text().trim();

    if (!nomeRaw || nomeRaw.toLowerCase().includes('anuncio')) return;

    const precoFraction =
      $card.find('.andes-money-amount__fraction').first().text().trim() ||
      $card.find('.poly-price__current .andes-money-amount__fraction').first().text().trim();

    const precoCents = $card.find('.andes-money-amount__cents').first().text().trim();

    const precoRaw = precoCents ? `${precoFraction},${precoCents}` : precoFraction;

    const imagemUrl =
      $card.find('.ui-search-result-image__element').attr('src') ||
      $card.find('img').first().attr('src') ||
      '';

    const linkRelativo = $card.find('.ui-search-link').attr('href') || '';
    const urlLoja = linkRelativo || url;

    const marca = extrairMarca(nomeRaw);
    const preco = normalizarPreco(precoRaw);

    if (nomeRaw && preco > 0 && isSuplemento(nomeRaw)) {
      resultados.push({
        nome: nomeRaw,
        marca,
        preco,
        loja_nome: 'Mercado Livre',
        url_loja: urlLoja,
        imagem_url: imagemUrl,
        em_estoque: true,
      });
    }
  });

  return resultados;
}
