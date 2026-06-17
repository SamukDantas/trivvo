'use client';

interface EstadoErroProps {
  mensagem: string;
  onTentarNovamente?: () => void;
}

export default function EstadoErro({ mensagem, onTentarNovamente }: EstadoErroProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <div className="text-3xl mb-3">⚠️</div>
      <p className="text-sm text-red-700">{mensagem}</p>
      {onTentarNovamente && (
        <button
          onClick={onTentarNovamente}
          className="mt-4 inline-flex rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
