import Link from 'next/link';

interface Suplemento {
  id: number;
  nome: string;
  marca: string;
  imagem_url?: string;
  preco_minimo?: number;
  pontuacao?: number;
  motivo?: string;
  certificacoes?: string[];
}

const CORES_CERTIFICACAO: Record<string, string> = {
  ANVISA: 'bg-blue-100 text-blue-700',
  GMP: 'bg-amber-100 text-amber-700',
  CREATINE: 'bg-purple-100 text-purple-700',
  'ISO 9001': 'bg-teal-100 text-teal-700',
  'LabDoor Tested': 'bg-emerald-100 text-emerald-700',
  'Informed Sport': 'bg-indigo-100 text-indigo-700',
  'NSF Certified': 'bg-sky-100 text-sky-700',
};

function corCertificacao(nome: string): string {
  return CORES_CERTIFICACAO[nome] || 'bg-zinc-100 text-zinc-600';
}

export default function CardSuplemento({ suplemento }: { suplemento: Suplemento }) {
  return (
    <Link
      href={`/suplementos/${suplemento.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-5 hover:border-emerald-300 transition-colors duration-200"
    >
      <div className="mb-4 flex items-center justify-center rounded-lg bg-zinc-100 h-40 text-sm text-zinc-400">
        {suplemento.imagem_url ? (
          <img
            src={suplemento.imagem_url}
            alt={suplemento.nome}
            className="h-full w-full object-contain rounded-lg"
          />
        ) : (
          <span>Sem imagem</span>
        )}
      </div>

      <span className="inline-block text-xs font-medium uppercase tracking-wide text-zinc-400">
        {suplemento.marca}
      </span>

      <h3 className="mt-1 font-semibold text-zinc-900 line-clamp-2">{suplemento.nome}</h3>

      {suplemento.preco_minimo != null && (
        <p className="mt-1 text-lg font-bold text-emerald-600">
          R$ {suplemento.preco_minimo.toFixed(2).replace('.', ',')}
        </p>
      )}

      {suplemento.certificacoes && suplemento.certificacoes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {suplemento.certificacoes.map((cert) => (
            <span
              key={cert}
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${corCertificacao(cert)}`}
            >
              {cert}
            </span>
          ))}
        </div>
      )}

      {suplemento.pontuacao != null && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          ⭐ {suplemento.pontuacao}/10
        </div>
      )}

      {suplemento.motivo && (
        <p className="mt-2 text-xs text-zinc-500 italic">&ldquo;{suplemento.motivo}&rdquo;</p>
      )}
    </Link>
  );
}
