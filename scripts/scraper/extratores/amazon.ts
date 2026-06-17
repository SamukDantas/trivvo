import * as cheerio from 'cheerio';
import type { DadosBrutos } from '../tipos';
import { normalizarPreco, userAgentAleatorio } from '../utils';
import { isSuplemento } from '../filtro';

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

    if (nomeRaw && preco > 0 && isSuplemento(nomeRaw)) {
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
  const partes = titulo.split(' ');
  const palavrasMarca = Math.min(3, Math.floor(partes.length * 0.3));
  return partes.slice(0, palavrasMarca).join(' ');
}

const TERMOS_SUPLEMENTO = [
  'whey',
  'protein',
  'proteina',
  'proteína',
  'creatina',
  'creatine',
  'bcaa',
  'glutamina',
  'glutamine',
  'beta alanina',
  'beta-alanina',
  'pre treino',
  'pre-treino',
  'pre workout',
  'pre-workout',
  'termogenico',
  'termogênico',
  'cafeina',
  'cafeína',
  'caffeine',
  'vitamina',
  'vitamin',
  'omega 3',
  'omega-3',
  'omega3',
  'colageno',
  'colágeno',
  'collagen',
  'magnesio',
  'magnésio',
  'magnesium',
  'zinco',
  'zinc',
  'probiotico',
  'probiótico',
  'probiotic',
  'suplemento',
  'suplement',
  'coenzima',
  'coenzyme',
  'q10',
  'resveratrol',
  'curcumina',
  'curcumin',
  'cúrcuma',
  'cla',
  'l-carnitina',
  'carnitina',
  'carnitine',
  'maltodextrina',
  'maltodextrin',
  'dextrose',
  'palatinose',
  'hipercalorico',
  'hipercalórico',
  'mass gainer',
  'barra de proteina',
  'barra proteica',
  'protein bar',
  'albumina',
  'albumina',
  'pasta de amendoim',
  'integral',
  'nitrato',
  'nitric oxide',
  'oxido nitrico',
  'óxido nítrico',
  'isolate',
  'isolado',
  'concentrado',
  'concentrate',
  'hidrolisado',
  'hydrolyzed',
  '3w',
  '100%',
  'top whey',
  'femini',
  'vegano',
  'vegan',
  'plant based',
  'plant-based',
];

const TERMOS_BLOQUEADOS = [
  'celular',
  'smartphone',
  'iphone',
  'samsung galaxy',
  'motorola',
  'capa',
  'pelicula',
  'película',
  'fone',
  'headphone',
  'earphone',
  'carregador',
  'cabo',
  'adaptador',
  'suporte veicular',
  'notebook',
  'laptop',
  'tablet',
  'smartwatch',
  'relogio',
  'relógio',
  'tv',
  'televisao',
  'televisão',
  'monitor',
  'mouse',
  'teclado',
  'impressora',
  'scanner',
  'roteador',
  'modem',
  'webcam',
  'caixa de som',
  'soundbar',
  'microfone',
  'liquidificador',
  'batedeira',
  'cafeteira',
  'aspirador',
  'ventilador',
  'climatizador',
  'umidificador',
  'camisa',
  'camiseta',
  'bermuda',
  'calça',
  'tenis',
  'tênis',
  'sapato',
  'bone',
  'boné',
  'mochila',
  'bolsa',
  'carteira',
  'perfume',
  'colonia',
  'colônia',
  'maquiagem',
  'batom',
  'shampoo',
  'brinquedo',
  'boneco',
  'jogo',
  'video game',
  'livro',
  'ebook',
  'kindle',
  'revista',
  'pilha',
  'bateria',
  'lampada',
  'lâmpada',
];

function isSuplemento(nome: string): boolean {
  const nomeLower = nome.toLowerCase();

  for (const bloqueado of TERMOS_BLOQUEADOS) {
    if (nomeLower.includes(bloqueado)) return false;
  }

  for (const termo of TERMOS_SUPLEMENTO) {
    if (nomeLower.includes(termo)) return true;
  }

  const nomeSemAcento = nomeLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const termo of TERMOS_SUPLEMENTO) {
    const termoSemAcento = termo.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (nomeSemAcento.includes(termoSemAcento)) return true;
  }

  return false;
}
