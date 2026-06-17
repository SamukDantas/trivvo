'use client';

import { useEffect } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash && hash.includes('access_token')) {
      const supabase = criarClienteNavegador();

      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.history.replaceState(null, '', window.location.pathname);
          router.push('/recomendacoes');
          router.refresh();
        }
      });
    }
  }, []);

  return null;
}
