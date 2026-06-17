'use client';

import Link from 'next/link';

interface Passo5OrcamentoProps {
  valor: string;
  consentimento: boolean;
  onChangeOrcamento: (valor: string) => void;
  onChangeConsentimento: (valor: boolean) => void;
}

const opcoes = [
  { valor: 'baixo', rotulo: 'Econômico', descricao: 'Até R$ 100 / mês' },
  { valor: 'medio', rotulo: 'Moderado', descricao: 'R$ 100 a R$ 300 / mês' },
  { valor: 'alto', rotulo: 'Premium', descricao: 'Acima de R$ 300 / mês' },
];

export function Passo5Orcamento({
  valor,
  consentimento,
  onChangeOrcamento,
  onChangeConsentimento,
}: Passo5OrcamentoProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">Qual a sua faixa de orçamento?</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Usamos isso para priorizar custo-benefício nas recomendações.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {opcoes.map((op) => (
          <button
            key={op.valor}
            onClick={() => onChangeOrcamento(op.valor)}
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

      <div className="mt-6 border-t border-zinc-200 pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentimento}
            onChange={(e) => onChangeConsentimento(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-xs text-zinc-500">
            Autorizo o armazenamento dos meus dados conforme a{' '}
            <Link
              href="/politica-de-privacidade"
              className="underline hover:text-zinc-700"
              target="_blank"
            >
              Política de Privacidade
            </Link>
            . Sei que posso solicitar a exclusão a qualquer momento.
          </span>
        </label>
      </div>
    </div>
  );
}
