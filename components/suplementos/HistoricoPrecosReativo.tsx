'use client';

import { useState, useEffect, useCallback } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/client';
import { useRealtimeTrigger } from '@/hooks/useRealtime';

interface Preco {
  id: number;
  preco: number;
  data_coleta: string;
  loja_nome?: string;
}

export default function HistoricoPrecosReativo({ suplementoId }: { suplementoId: string }) {
  const [precos, setPrecos] = useState<Preco[] | null>(null);
  const [ultimoRefresh, setUltimoRefresh] = useState(Date.now());

  const buscarPrecos = useCallback(async () => {
    const supabase = criarClienteNavegador();
    const { data } = await supabase
      .from('precos_suplementos')
      .select('id, preco, data_coleta, loja_nome')
      .eq('suplemento_id', suplementoId)
      .order('data_coleta', { ascending: false })
      .limit(5);

    if (data) setPrecos(data);
  }, [suplementoId]);

  useEffect(() => {
    buscarPrecos();
  }, [buscarPrecos, ultimoRefresh]);

  const gatilhoRealtime = useRealtimeTrigger('precos_suplementos', 'INSERT');

  useEffect(() => {
    if (gatilhoRealtime > 0) {
      setUltimoRefresh(Date.now());
    }
  }, [gatilhoRealtime]);

  if (!precos || precos.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="font-semibold text-zinc-900">
          Histórico de preços (últimas {precos.length} coletas)
        </h2>
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
          title="Atualizações em tempo real"
        />
      </div>
      <ul className="space-y-1.5 text-sm text-zinc-600">
        {precos.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2"
          >
            <span>
              R$ {Number(p.preco).toFixed(2).replace('.', ',')}
              {p.loja_nome ? ` — ${p.loja_nome}` : ''}
            </span>
            <span className="text-zinc-400 text-xs">
              {new Date(p.data_coleta).toLocaleDateString('pt-BR')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
