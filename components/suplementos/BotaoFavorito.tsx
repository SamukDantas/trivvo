'use client';

import { useState, useTransition } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/client';

interface BotaoFavoritoProps {
  suplementoId: number;
  favoritoInicial: boolean;
}

export default function BotaoFavorito({ suplementoId, favoritoInicial }: BotaoFavoritoProps) {
  const [favorito, setFavorito] = useState(favoritoInicial);
  const [isPending, startTransition] = useTransition();

  function alternarFavorito() {
    const novoEstado = !favorito;
    setFavorito(novoEstado);

    startTransition(async () => {
      const supabase = criarClienteNavegador();

      if (novoEstado) {
        const { error } = await supabase
          .from('favoritos_usuario')
          .insert({ suplemento_id: suplementoId })
          .single();

        if (error) {
          setFavorito(false);
          return;
        }
      } else {
        const { error } = await supabase
          .from('favoritos_usuario')
          .delete()
          .eq('suplemento_id', suplementoId);

        if (error) {
          setFavorito(true);
          return;
        }
      }
    });
  }

  return (
    <button
      onClick={alternarFavorito}
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-full border border-zinc-200 p-2.5 text-lg hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
      aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      {favorito ? '❤️' : '🤍'}
    </button>
  );
}
