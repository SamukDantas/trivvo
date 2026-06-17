export interface DadosBrutos {
  nome: string;
  marca: string;
  preco: number;
  loja_nome: string;
  url_loja: string;
  imagem_url?: string;
  dose_porcao?: string;
  porcoes_por_embalagem?: number;
  ingredientes?: string[];
  certificacoes?: string[];
  registro_anvisa?: string;
  em_estoque: boolean;
}

export interface DadosNormalizados {
  suplemento: {
    nome: string;
    marca: string;
    imagem_url: string;
    url_origem: string;
    tipo_origem: string;
  };
  detalhes: {
    dose_porcao: string;
    porcoes_por_embalagem: number;
    ingredientes: string[];
    certificacoes: string[];
    registro_anvisa: string;
    efeitos_observados: string[];
  };
  preco: {
    preco: number;
    loja_nome: string;
    url_loja: string;
    em_estoque: boolean;
  };
}

export interface ResultadoColeta {
  fonte_id: number;
  status: 'sucesso' | 'falha_parcial' | 'falha';
  produtos: number;
  mensagem: string;
  duracao_ms: number;
}
