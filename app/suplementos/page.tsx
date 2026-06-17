import { criarClienteServidor } from '@/lib/supabase/server';
import EstadoCarregando from '@/components/comum/EstadoCarregando';
import CatalogoReativo from '@/components/suplementos/CatalogoReativo';
import { Suspense } from 'react';

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
  searchParams: Promise<{ busca?: string; categoria?: string }>;
}

async function CatalogoInicial({ busca, categoria }: { busca: string; categoria: string }) {
  const supabase = await criarClienteServidor();

  const [{ data: suplementos }, { data: categorias }] = await Promise.all([
    supabase
      .from('suplementos')
      .select(
        'id, nome, marca, imagem_url, categoria_id, precos_suplementos(preco), detalhes_suplementos(certificacoes)'
      )
      .order('nome'),
    supabase.from('categorias_suplementos').select('id, nome').order('nome'),
  ]);

  return (
    <CatalogoReativo
      suplementosIniciais={(suplementos as SuplementoDB[]) || []}
      categorias={categorias || []}
      buscaInicial={busca}
      categoriaInicial={categoria}
    />
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
          <CatalogoInicial busca={busca} categoria={categoria} />
        </Suspense>
      </div>
    </div>
  );
}
