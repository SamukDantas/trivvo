import { criarClienteServidor } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import HistoricoPrecosReativo from '@/components/suplementos/HistoricoPrecosReativo';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaginaSuplemento({ params }: Props) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data: suplemento } = await supabase.from('suplementos').select('*').eq('id', id).single();

  if (!suplemento) {
    notFound();
  }

  const { data: detalhes } = await supabase
    .from('detalhes_suplementos')
    .select('*')
    .eq('suplemento_id', id)
    .single();

  const ingredientes: string[] = detalhes?.ingredientes || [];
  const certificacoes: string[] = detalhes?.certificacoes || [];

  const CORES_CERT: Record<string, string> = {
    ANVISA: 'bg-blue-100 text-blue-700',
    GMP: 'bg-amber-100 text-amber-700',
    CREATINE: 'bg-purple-100 text-purple-700',
    'ISO 9001': 'bg-teal-100 text-teal-700',
    'LabDoor Tested': 'bg-emerald-100 text-emerald-700',
    'Informed Sport': 'bg-indigo-100 text-indigo-700',
    'NSF Certified': 'bg-sky-100 text-sky-700',
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/suplementos"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6"
        >
          ← Voltar ao catálogo
        </Link>

        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center justify-center bg-zinc-100 h-56 text-sm text-zinc-400">
            {suplemento.imagem_url ? (
              <img
                src={suplemento.imagem_url}
                alt={suplemento.nome}
                className="h-full w-full object-contain"
              />
            ) : (
              <span>Sem imagem</span>
            )}
          </div>

          <div className="p-6">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              {suplemento.marca}
            </span>
            <h1 className="mt-1 text-xl font-bold text-zinc-900">{suplemento.nome}</h1>

            {detalhes && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600">
                {detalhes.dose_porcao && detalhes.dose_porcao !== '0' && (
                  <span>
                    <strong>Porção:</strong> {detalhes.dose_porcao}
                  </span>
                )}
                {detalhes.porcoes_por_embalagem > 0 && (
                  <span>
                    <strong>Doses:</strong> {detalhes.porcoes_por_embalagem}
                  </span>
                )}
              </div>
            )}

            {ingredientes.length > 0 && (
              <div className="mt-6">
                <h2 className="font-semibold text-zinc-900 mb-2">Ingredientes</h2>
                <ul className="space-y-1.5 text-sm text-zinc-600">
                  {ingredientes.map((ing) => (
                    <li key={ing} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {certificacoes.length > 0 && (
              <div className="mt-6">
                <h2 className="font-semibold text-zinc-900 mb-2">Certificações</h2>
                <div className="flex flex-wrap gap-2">
                  {certificacoes.map((cert) => (
                    <span
                      key={cert}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${CORES_CERT[cert] || 'bg-zinc-100 text-zinc-600'}`}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {detalhes?.registro_anvisa && (
              <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <h2 className="font-semibold text-zinc-900 mb-1">Registro ANVISA</h2>
                <p className="text-sm text-zinc-600">{detalhes.registro_anvisa}</p>
              </div>
            )}

            <HistoricoPrecosReativo suplementoId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
