'use client';

import { useState, useEffect, useCallback } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/client';
import { useRealtimeTrigger } from '@/hooks/useRealtime';
import CardSuplemento from './CardSuplemento';
import EstadoCarregando from '@/components/comum/EstadoCarregando';
import EstadoVazio from '@/components/comum/EstadoVazio';
import EstadoErro from '@/components/comum/EstadoErro';

interface SuplementoDB {
  id: number;
  nome: string;
  marca: string;
  imagem_url: string | null;
  categoria_id: number | null;
  precos_suplementos: { preco: number }[] | null;
  detalhes_suplementos: { certificacoes: string[] }[] | null;
}

interface Props {
  suplementosIniciais: SuplementoDB[];
  categorias: { id: number; nome: string }[];
  buscaInicial: string;
  categoriaInicial: string;
}

const ITENS_POR_PAGINA = 12;

function filtrarSuplementos(
  suplementos: SuplementoDB[],
  busca: string,
  categoria: string
): SuplementoDB[] {
  let resultado = suplementos;
  if (busca) {
    const termo = busca.toLowerCase();
    resultado = resultado.filter(
      (s) => s.nome.toLowerCase().includes(termo) || s.marca.toLowerCase().includes(termo)
    );
  }
  if (categoria) {
    const catId = parseInt(categoria, 10);
    if (!isNaN(catId)) resultado = resultado.filter((s) => s.categoria_id === catId);
  }
  return resultado;
}

export default function CatalogoReativo({
  suplementosIniciais,
  categorias,
  buscaInicial,
  categoriaInicial,
}: Props) {
  const [suplementos, setSuplementos] = useState(suplementosIniciais);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimoRefresh, setUltimoRefresh] = useState(Date.now());
  const [pagina, setPagina] = useState(1);

  const buscarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const supabase = criarClienteNavegador();
    const { data, error } = await supabase
      .from('suplementos')
      .select(
        'id, nome, marca, imagem_url, categoria_id, precos_suplementos(preco), detalhes_suplementos(certificacoes)'
      )
      .order('nome');

    if (error) {
      setErro('Não foi possível atualizar o catálogo.');
    } else if (data) {
      setSuplementos(data as SuplementoDB[]);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    buscarDados();
  }, [buscarDados, ultimoRefresh]);

  const gatilhoRealtime = useRealtimeTrigger('suplementos', '*');

  useEffect(() => {
    if (gatilhoRealtime > 0) {
      setUltimoRefresh(Date.now());
    }
  }, [gatilhoRealtime]);

  if (erro) return <EstadoErro mensagem={erro} onTentarNovamente={buscarDados} />;

  const resultadoCompleto = filtrarSuplementos(suplementos, buscaInicial, categoriaInicial);

  const totalPaginas = Math.max(1, Math.ceil(resultadoCompleto.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);

  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const resultado = resultadoCompleto.slice(indiceInicio, indiceInicio + ITENS_POR_PAGINA);

  if (resultadoCompleto.length === 0 && !carregando) {
    return (
      <EstadoVazio
        titulo="Nenhum suplemento encontrado"
        descricao="Tente ajustar sua busca ou limpar os filtros."
      />
    );
  }

  const paginasVisiveis = gerarPaginasVisiveis(paginaAtual, totalPaginas);

  return (
    <>
      {carregando && (
        <div className="mb-3 flex items-center gap-2 text-xs text-emerald-600">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Atualizando catálogo...
        </div>
      )}

      <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
        <span>
          {resultadoCompleto.length} suplemento{resultadoCompleto.length !== 1 ? 's' : ''}
          {buscaInicial && ` para "${buscaInicial}"`}
          {categoriaInicial && categorias.find((c) => String(c.id) === categoriaInicial)?.nome
            ? ` em ${categorias.find((c) => String(c.id) === categoriaInicial)!.nome}`
            : ''}
        </span>
        {totalPaginas > 1 && (
          <span>
            Página {paginaAtual} de {totalPaginas}
          </span>
        )}
      </div>

      {categorias.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-600">Filtrar por:</span>
          <a
            href="/suplementos"
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !categoriaInicial
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Todos
          </a>
          {categorias.map((cat) => (
            <a
              key={cat.id}
              href={`/suplementos?categoria=${cat.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoriaInicial === String(cat.id)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat.nome}
            </a>
          ))}
          {categoriaInicial && (
            <a
              href="/suplementos"
              className="rounded-full px-3 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Limpar filtro
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resultado.map((s) => (
          <CardSuplemento
            key={s.id}
            suplemento={{
              id: s.id,
              nome: s.nome,
              marca: s.marca,
              imagem_url: s.imagem_url || undefined,
              preco_minimo: s.precos_suplementos?.[0]?.preco ?? undefined,
              certificacoes: s.detalhes_suplementos?.[0]?.certificacoes || undefined,
            }}
          />
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <button
            onClick={() => setPagina(paginaAtual - 1)}
            disabled={paginaAtual === 1}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {paginasVisiveis.map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-1 text-zinc-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPagina(p as number)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                  paginaAtual === p
                    ? 'bg-emerald-600 text-white'
                    : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPagina(paginaAtual + 1)}
            disabled={paginaAtual === totalPaginas}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      )}
    </>
  );
}

function gerarPaginasVisiveis(paginaAtual: number, totalPaginas: number): (number | '...')[] {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  const paginas: (number | '...')[] = [1];

  if (paginaAtual > 3) {
    paginas.push('...');
  }

  const inicio = Math.max(2, paginaAtual - 1);
  const fim = Math.min(totalPaginas - 1, paginaAtual + 1);

  for (let i = inicio; i <= fim; i++) {
    paginas.push(i);
  }

  if (paginaAtual < totalPaginas - 2) {
    paginas.push('...');
  }

  paginas.push(totalPaginas);

  return paginas;
}
