import type { DadosBrutos } from '../tipos';
import { normalizarPreco } from '../utils';
import { isSuplemento } from '../filtro';
import { extrairMarca } from '../marcas';

interface ShopifyProduto {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  variants: Array<{
    price: string;
    compare_at_price: string | null;
    available: boolean;
  }>;
  images: Array<{ src: string }>;
}

interface ShopifyResposta {
  products: ShopifyProduto[];
}

export async function coletarShopify(urlBase: string): Promise<DadosBrutos[]> {
  const urlApi = `${urlBase.replace(/\/$/, '')}/products.json?limit=250`;
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    Accept: 'application/json',
    'Accept-Language': 'pt-BR,pt;q=0.9',
  };

  const resposta = await fetch(urlApi, { headers, redirect: 'follow' });

  if (!resposta.ok) {
    if (resposta.status === 403 || resposta.status === 429) {
      throw new Error(`Shopify bloqueou a requisição: HTTP ${resposta.status}`);
    }
    throw new Error(`Falha ao acessar Shopify: HTTP ${resposta.status}`);
  }

  const data: ShopifyResposta = await resposta.json();

  if (!data.products || !Array.isArray(data.products)) {
    throw new Error('Resposta da API Shopify não contém lista de produtos');
  }

  const resultados: DadosBrutos[] = [];

  for (const produto of data.products) {
    const nomeRaw = produto.title;

    if (!nomeRaw || nomeRaw.length < 3) continue;

    if (!isSuplemento(nomeRaw)) continue;

    const variant = produto.variants?.[0];
    if (!variant) continue;

    const preco = Number(variant.price);
    if (!preco || preco <= 0) continue;

    const marca = produto.vendor ? extrairMarca(produto.vendor) : extrairMarca(nomeRaw);

    const imagemUrl = produto.images?.[0]?.src || '';
    const urlProduto = `${urlBase.replace(/\/$/, '')}/products/${produto.handle}`;

    const nomeLoja = extrairNomeLoja(urlBase);

    resultados.push({
      nome: nomeRaw,
      marca,
      preco,
      loja_nome: nomeLoja,
      url_loja: urlProduto,
      imagem_url: imagemUrl,
      em_estoque: variant.available,
    });
  }

  return resultados;
}

function extrairNomeLoja(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const partes = hostname.replace('www.', '').split('.');
    const nome = partes[0];
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  } catch {
    return 'Fabricante';
  }
}
