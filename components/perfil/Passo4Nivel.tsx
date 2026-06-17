'use client';

interface Passo4NivelProps {
  valor: string;
  onChange: (valor: string) => void;
}

const opcoes = [
  { valor: 'iniciante', rotulo: 'Iniciante', descricao: 'Até 6 meses de treino. Foco no básico.' },
  {
    valor: 'intermediario',
    rotulo: 'Intermediário',
    descricao: '6 meses a 2 anos. Já tem consistência.',
  },
  { valor: 'avancado', rotulo: 'Avançado', descricao: 'Mais de 2 anos. Busca otimização.' },
];

export function Passo4Nivel({ valor, onChange }: Passo4NivelProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">Qual o seu nível de experiência?</h2>
      <p className="mt-1 text-sm text-zinc-500">Isso define a complexidade das recomendações.</p>
      <div className="mt-4 flex flex-col gap-2">
        {opcoes.map((op) => (
          <button
            key={op.valor}
            onClick={() => onChange(op.valor)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              valor === op.valor
                ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <div>
              <div className="font-medium text-zinc-900">{op.rotulo}</div>
              <div className="text-xs text-zinc-500">{op.descricao}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
