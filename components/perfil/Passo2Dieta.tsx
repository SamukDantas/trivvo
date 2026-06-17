'use client';

interface Passo2DietaProps {
  valor: string;
  onChange: (valor: string) => void;
}

const opcoes = [
  { valor: 'onivoro', rotulo: 'Onívoro', descricao: 'Consome proteínas animais e vegetais' },
  { valor: 'vegetariano', rotulo: 'Vegetariano', descricao: 'Sem carne, com ovos e laticínios' },
  { valor: 'vegano', rotulo: 'Vegano', descricao: 'Exclusivamente vegetal' },
  { valor: 'lowcarb', rotulo: 'Low-Carb', descricao: 'Redução de carboidratos' },
  { valor: 'cetogenica', rotulo: 'Cetogênica', descricao: 'Alta gordura, muito baixo carboidrato' },
];

export function Passo2Dieta({ valor, onChange }: Passo2DietaProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">Qual é o seu tipo de dieta?</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Isso ajuda a filtrar suplementos compatíveis com sua alimentação.
      </p>
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
