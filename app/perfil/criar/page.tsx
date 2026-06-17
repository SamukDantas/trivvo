import Wizard from '@/components/perfil/Wizard';

export default function PaginaCriarPerfil() {
  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Criar Perfil</h1>
        <p className="text-sm text-zinc-500">
          Responda 5 perguntas rápidas para personalizarmos suas recomendações.
        </p>
      </div>
      <Wizard />
    </div>
  );
}
