'use client';

import { useEffect, useRef } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthHashHandler() {
  const router = useRouter();
  const processado = useRef(false);

  useEffect(() => {
    if (processado.current) return;

    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      processado.current = true;
      const supabase = criarClienteNavegador();

      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        })
        .then(({ error }) => {
          window.history.replaceState(null, '', window.location.pathname);
          if (!error) {
            router.push('/recomendacoes');
            router.refresh();
          }
        });
    }
  }, []);

  return null;
}
