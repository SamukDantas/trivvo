'use client';

interface Passo3RestricoesProps {
  valor: string[];
  onChange: (valor: string[]) => void;
}

const opcoes = [
  { valor: 'lactose', rotulo: 'Lactose' },
  { valor: 'gluten', rotulo: 'Glúten' },
  { valor: 'soja', rotulo: 'Soja' },
  { valor: 'edulcorantes', rotulo: 'Edulcorantes artificiais' },
  { valor: 'corantes', rotulo: 'Corantes artificiais' },
];

export function Passo3Restricoes({ valor, onChange }: Passo3RestricoesProps) {
  function alternar(v: string) {
    if (valor.includes(v)) {
      onChange(valor.filter((item) => item !== v));
    } else {
      onChange([...valor, v]);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">Tem alguma restrição?</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Selecione as substâncias que você evita. Pode escolher várias.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {opcoes.map((op) => (
          <button
            key={op.valor}
            onClick={() => alternar(op.valor)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              valor.includes(op.valor)
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
            }`}
          >
            {op.rotulo}
          </button>
        ))}
      </div>
      {valor.length === 0 && (
        <p className="mt-3 text-xs text-zinc-400">Nenhuma restrição selecionada. Pode avançar.</p>
      )}
    </div>
  );
}
