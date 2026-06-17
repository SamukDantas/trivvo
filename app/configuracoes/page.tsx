'use client';

import { useState } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function PaginaConfiguracoes() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function handleExportar() {
    setExportando(true);
    setErro(null);

    try {
      const resposta = await fetch('/api/usuario/exportar');
      if (!resposta.ok) {
        const { erro: msg } = await resposta.json();
        setErro(msg || 'Erro ao exportar dados');
        setExportando(false);
        return;
      }

      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meus-dados.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro('Erro ao exportar dados. Tente novamente.');
    }

    setExportando(false);
  }

  async function handleExcluir() {
    setExcluindo(true);
    setErro(null);

    try {
      const resposta = await fetch('/api/usuario/excluir', { method: 'DELETE' });
      if (!resposta.ok) {
        const { erro: msg } = await resposta.json();
        setErro(msg || 'Erro ao excluir conta');
        setExcluindo(false);
        return;
      }

      const supabase = criarClienteNavegador();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch {
      setErro('Erro ao excluir conta. Tente novamente.');
    }

    setExcluindo(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-8">Configurações</h1>

        {erro && <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</div>}

        <section className="rounded-xl border border-zinc-200 bg-white p-6 mb-4">
          <h2 className="font-semibold text-zinc-900 mb-1">Exportar meus dados</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Faça o download de todos os seus dados armazenados na plataforma em formato JSON.
          </p>
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {exportando ? 'Exportando...' : 'Exportar dados'}
          </button>
        </section>

        <section className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800 mb-1">Excluir minha conta</h2>
          <p className="text-sm text-red-600 mb-4">
            Esta ação é permanente. Todos os seus dados, favoritos e recomendações serão removidos
            definitivamente.
          </p>
          <button
            onClick={() => setMostrarModal(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Excluir conta
          </button>
        </section>

        {mostrarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-zinc-900">Tem certeza?</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Sua conta e todos os dados associados serão excluídos permanentemente. Esta ação não
                pode ser desfeita.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {excluindo ? 'Excluindo...' : 'Sim, excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
