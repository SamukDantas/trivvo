import Link from 'next/link';

export default function PaginaInicial() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Escolha os melhores suplementos com base em{' '}
          <span className="text-emerald-600">dados reais</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-600">
          Compare ingredientes, preços e certificações. Receba recomendações personalizadas de
          acordo com seu objetivo, dieta e orçamento.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-full bg-emerald-600 px-8 py-3 text-base font-semibold text-white hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
          >
            Criar meu perfil
          </Link>
          <Link
            href="/suplementos"
            className="rounded-full border border-zinc-300 bg-white px-8 py-3 text-base font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Buscar suplementos
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-2xl">
          {vantagens.map((v) => (
            <div
              key={v.titulo}
              className="rounded-xl border border-zinc-200 bg-white p-6 text-left"
            >
              <div className="text-2xl mb-2">{v.icone}</div>
              <h3 className="font-semibold text-zinc-900">{v.titulo}</h3>
              <p className="mt-1 text-sm text-zinc-500">{v.descricao}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-sm text-zinc-500">
        <div className="max-w-5xl mx-auto px-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <span>Trivvo — Brasil, 2026</span>
          <Link href="/politica-de-privacidade" className="hover:text-zinc-700 underline">
            Política de Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}

const vantagens = [
  {
    icone: '🔬',
    titulo: 'Comparação objetiva',
    descricao: 'Ingredientes, doses e preços analisados lado a lado com transparência.',
  },
  {
    icone: '🎯',
    titulo: 'Recomendação personalizada',
    descricao: 'Baseada no seu objetivo, tipo de dieta, restrições e nível de experiência.',
  },
  {
    icone: '✅',
    titulo: 'Verificação de qualidade',
    descricao: 'Selos de certificação, registro ANVISA e laudos de pureza auditados.',
  },
];
