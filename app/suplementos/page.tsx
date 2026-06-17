import { criarClienteServidor } from '@/lib/supabase/server';
import EstadoCarregando from '@/components/comum/EstadoCarregando';
import EstadoVazio from '@/components/comum/EstadoVazio';
import EstadoErro from '@/components/comum/EstadoErro';
import CardSuplemento from '@/components/suplementos/CardSuplemento';
import { Suspense } from 'react';

interface SuplementoDB {
  id: number;
  nome: string;
  marca: string;
  imagem_url: string | null;
  preco_minimo: number | null;
  certificacoes: string[] | null;
  categoria_id: number | null;
}

interface Categoria {
  id: number;
  nome: string;
}

interface Props {
  searchParams: Promise<{ busca?: string; categoria?: string }>;
}

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
    if (!isNaN(catId)) {
      resultado = resultado.filter((s) => s.categoria_id === catId);
    }
  }

  return resultado;
}

async function CatalogoSuplementos({ busca, categoria }: { busca: string; categoria: string }) {
  const supabase = await criarClienteServidor();

  const [{ data: suplementos, error }, { data: categorias }] = await Promise.all([
    supabase
      .from('suplementos')
      .select('id, nome, marca, imagem_url, preco_minimo, certificacoes, categoria_id')
      .order('nome'),
    supabase.from('categorias_suplementos').select('id, nome').order('nome'),
  ]);

  if (error) {
    return <EstadoErro mensagem="Não foi possível carregar o catálogo de suplementos." />;
  }

  const resultado = filtrarSuplementos(suplementos || [], busca, categoria);

  if (resultado.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhum suplemento encontrado"
        descricao="Tente ajustar sua busca ou limpar os filtros."
      />
    );
  }

  return (
    <>
      {categorias && categorias.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-600">Filtrar por:</span>
          {categorias.map((cat: Categoria) => (
            <a
              key={cat.id}
              href={`/suplementos?categoria=${cat.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoria === String(cat.id)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat.nome}
            </a>
          ))}
          {categoria && (
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
              preco_minimo: s.preco_minimo ?? undefined,
              certificacoes: s.certificacoes || undefined,
            }}
          />
        ))}
      </div>
    </>
  );
}

export default async function PaginaSuplementos({ searchParams }: Props) {
  const params = await searchParams;
  const busca = params.busca || '';
  const categoria = params.categoria || '';

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Catálogo de Suplementos</h1>
          <p className="text-sm text-zinc-500">Compare ingredientes, preços e certificações.</p>
        </div>

        <form className="mb-6">
          <input
            type="search"
            name="busca"
            defaultValue={busca}
            placeholder="Buscar por nome ou marca..."
            className="w-full max-w-md rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </form>

        <Suspense fallback={<EstadoCarregando />}>
          <CatalogoSuplementos busca={busca} categoria={categoria} />
        </Suspense>
      </div>
    </div>
  );
}
