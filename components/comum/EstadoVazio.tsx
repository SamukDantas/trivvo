import Link from 'next/link';

interface EstadoVazioProps {
  titulo: string;
  descricao: string;
  acao?: { texto: string; href: string };
}

export default function EstadoVazio({ titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="text-lg font-semibold text-zinc-900">{titulo}</h3>
      <p className="mt-1 max-w-md text-sm text-zinc-500">{descricao}</p>
      {acao && (
        <Link
          href={acao.href}
          className="mt-6 inline-flex rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          {acao.texto}
        </Link>
      )}
    </div>
  );
}
