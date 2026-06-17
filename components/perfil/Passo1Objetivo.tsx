'use client';

interface Passo1ObjetivoProps {
  valor: string;
  onChange: (valor: string) => void;
}

const opcoes = [
  {
    valor: 'hipertrofia',
    rotulo: 'Hipertrofia',
    icone: '💪',
    descricao: 'Ganho de massa muscular',
  },
  {
    valor: 'emagrecimento',
    rotulo: 'Emagrecimento',
    icone: '⚡',
    descricao: 'Perda de gordura corporal',
  },
  { valor: 'saude', rotulo: 'Saúde', icone: '🛡️', descricao: 'Bem-estar e prevenção' },
  { valor: 'performance', rotulo: 'Performance', icone: '🏃', descricao: 'Rendimento esportivo' },
  {
    valor: 'longevidade',
    rotulo: 'Longevidade',
    icone: '🧬',
    descricao: 'Envelhecimento saudável',
  },
];

export function Passo1Objetivo({ valor, onChange }: Passo1ObjetivoProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">Qual é o seu objetivo principal?</h2>
      <p className="mt-1 text-sm text-zinc-500">Escolha o que mais combina com sua meta atual.</p>
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
            <span className="text-2xl">{op.icone}</span>
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
