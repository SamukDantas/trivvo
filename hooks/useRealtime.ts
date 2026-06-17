'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtime(
  tabela: string,
  evento: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  onAlteracao: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
) {
  const canalRef = useRef<RealtimeChannel | null>(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    const supabase = criarClienteNavegador();

    const canal = supabase
      .channel(`realtime-${tabela}`)
      .on(
        'postgres_changes' as never,
        {
          event: evento,
          schema: 'public',
          table: tabela,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          onAlteracao(payload);
        }
      )
      .subscribe((status) => {
        setConectado(status === 'SUBSCRIBED');
      });

    canalRef.current = canal;

    return () => {
      supabase.removeChannel(canal);
    };
  }, [tabela, evento, onAlteracao]);

  return { conectado };
}

export function useRealtimeTrigger(tabela: string, evento: 'INSERT' | 'UPDATE' | 'DELETE' | '*') {
  const [gatilho, setGatilho] = useState(0);

  const onAlteracao = useCallback(() => {
    setGatilho((prev) => prev + 1);
  }, []);

  useRealtime(tabela, evento, onAlteracao);

  return gatilho;
}
