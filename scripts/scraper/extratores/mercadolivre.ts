import * as cheerio from 'cheerio';
import type { DadosBrutos } from '../tipos';
import { normalizarPreco, userAgentAleatorio } from '../utils';
import { isSuplemento } from '../filtro';

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
 * Coleta dados de suplementos de uma pagina de busca do Mercado Livre Brasil
 */
export async function coletarMercadoLivre(url: string): Promise<DadosBrutos[]> {
  const headers = criarHeaders();
  const resposta = await fetch(url, { headers, redirect: 'follow' });

  if (!resposta.ok) {
    throw new Error(`Falha ao acessar Mercado Livre: HTTP ${resposta.status}`);
  }

  const html = await resposta.text();
  const $ = cheerio.load(html);
  const resultados: DadosBrutos[] = [];

  // Seletores do Mercado Livre (podem mudar com atualizacoes do layout)
  // Suporta tanto layout antigo quanto o mais recente
  const cards = $('.ui-search-layout__item, .results-item, .andes-card');

  cards.each((_, card) => {
    const $card = $(card);

    // Nome do produto
    const nomeRaw =
      $card.find('.ui-search-item__title').text().trim() ||
      $card.find('.item__title').text().trim() ||
      $card.find('h2').first().text().trim();

    if (!nomeRaw) return;

    // Preco: Mercado Livre exibe fraction + cents em spans separados
    const precoFraction =
      $card.find('.andes-money-amount__fraction').first().text().trim() ||
      $card.find('.price-tag-fraction').first().text().trim();

    const precoCents =
      $card.find('.andes-money-amount__cents').first().text().trim() ||
      $card.find('.price-tag-cents').first().text().trim();

    const precoRaw = precoCents ? `${precoFraction},${precoCents}` : precoFraction;

    // Imagem
    const imagemUrl =
      $card.find('.ui-search-result-image__element').attr('src') ||
      $card.find('img').first().attr('src') ||
      '';

    // Link do produto
    const linkRelativo =
      $card.find('.ui-search-link').attr('href') ||
      $card.find('a.ui-search-item__group__element').attr('href') ||
      '';
    const urlLoja = linkRelativo || url;

    // Nome da loja/vendedor
    const lojaNome =
      $card.find('.ui-search-official-store-label').text().trim() ||
      $card.find('.ui-search-item__brand').text().trim() ||
      'Mercado Livre';

    // Disponibilidade: Mercado Livre so mostra produtos disponiveis na busca padrao
    const freteGratis = $card.find('.ui-search-item__shipping').text().trim() || '';

    const preco = normalizarPreco(precoRaw);

    if (nomeRaw && preco > 0 && isSuplemento(nomeRaw)) {
      resultados.push({
        nome: nomeRaw,
        marca: extrairMarcaML(nomeRaw),
        preco,
        loja_nome: lojaNome,
        url_loja: urlLoja,
        imagem_url: imagemUrl,
        em_estoque: true,
      });
    }
  });

  return resultados;
}

/**
 * Tenta extrair o nome da marca do titulo do produto no Mercado Livre
 */
function extrairMarcaML(titulo: string): string {
  const partes = titulo.split(' ');
  const palavrasMarca = Math.min(3, Math.floor(partes.length * 0.3));
  return partes.slice(0, palavrasMarca).join(' ');
}
