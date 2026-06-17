'use client';

import { useEffect, useState, useCallback } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Cabecalho() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const router = useRouter();

  const verificarSessao = useCallback(async () => {
    const hash = window.location.hash;

    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        const supabase = criarClienteNavegador();
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });

        if (!error) {
          window.history.replaceState(null, '', window.location.pathname);
          const { data } = await supabase.auth.getSession();
          setUsuario(data.session?.user ?? null);
          router.push('/perfil/criar');
          return;
        }
      }
    }

    const supabase = criarClienteNavegador();
    const { data } = await supabase.auth.getSession();
    setUsuario(data.session?.user ?? null);
  }, []);

  useEffect(() => {
    verificarSessao();

    const supabase = criarClienteNavegador();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function sair() {
    const supabase = criarClienteNavegador();
    await supabase.auth.signOut();
    setMenuAberto(false);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-xl text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Trivvo
        </Link>

        {usuario ? (
          <div className="relative flex items-center gap-3">
            <Link
              href="/recomendacoes"
              className="hidden sm:block text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Recomendações
            </Link>
            <Link
              href="/suplementos"
              className="hidden sm:block text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Suplementos
            </Link>

            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                {usuario.email?.charAt(0).toUpperCase() ?? '?'}
              </span>
              <span className="hidden sm:inline max-w-[120px] truncate">
                {usuario.email?.split('@')[0]}
              </span>
              <svg
                className="h-4 w-4 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {menuAberto && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-lg border border-zinc-200 bg-white shadow-lg py-1">
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <p className="text-xs font-medium text-zinc-900 truncate">{usuario.email}</p>
                  </div>
                  <Link
                    href="/perfil/editar"
                    onClick={() => setMenuAberto(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Editar perfil
                  </Link>
                  <Link
                    href="/favoritos"
                    onClick={() => setMenuAberto(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 sm:hidden"
                  >
                    Favoritos
                  </Link>
                  <Link
                    href="/configuracoes"
                    onClick={() => setMenuAberto(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Configurações
                  </Link>
                  <button
                    onClick={sair}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-zinc-100 mt-1"
                  >
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
