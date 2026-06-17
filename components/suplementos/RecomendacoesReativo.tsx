'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtimeTrigger } from '@/hooks/useRealtime';
import CardSuplemento from './CardSuplemento';
import EstadoCarregando from '@/components/comum/EstadoCarregando';
import EstadoVazio from '@/components/comum/EstadoVazio';
import EstadoErro from '@/components/comum/EstadoErro';

interface Recomendacao {
  suplemento_id: number;
  nome: string;
  marca: string;
  pontuacao: number;
  motivo: string | null;
}

function adaptarRecomendacao(rec: Recomendacao) {
  return {
    id: rec.suplemento_id,
    nome: rec.nome,
    marca: rec.marca,
    pontuacao: rec.pontuacao,
    motivo: rec.motivo || undefined,
  };
}

export default function RecomendacoesReativo({ usuarioId }: { usuarioId: string }) {
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimoRefresh, setUltimoRefresh] = useState(Date.now());

  const buscarRecomendacoes = useCallback(async () => {
    try {
      const resposta = await fetch(`/api/recomendacoes?usuario_id=${usuarioId}`, {
        cache: 'no-store',
      });

      if (!resposta.ok) throw new Error('Erro ao buscar recomendações');

      const data = await resposta.json();

      if (data.erro) {
        setErro(data.erro);
        return;
      }

      setRecomendacoes(data.recomendacoes || []);
      setErro(null);
    } catch {
      setErro('Não foi possível carregar suas recomendações.');
    }
  }, [usuarioId]);

  useEffect(() => {
    buscarRecomendacoes();
  }, [buscarRecomendacoes, ultimoRefresh]);

  const gatilhoRealtime = useRealtimeTrigger('recomendacoes', '*');

  useEffect(() => {
    if (gatilhoRealtime > 0) {
      setUltimoRefresh(Date.now());
    }
  }, [gatilhoRealtime]);

  if (erro) return <EstadoErro mensagem={erro} onTentarNovamente={buscarRecomendacoes} />;

  if (recomendacoes === null) return <EstadoCarregando />;

  if (recomendacoes.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhuma recomendação disponível"
        descricao="Ainda não temos recomendações para o seu perfil. Tente atualizar suas preferências."
        acao={{ texto: 'Editar perfil', href: '/perfil/editar' }}
      />
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        Atualizações em tempo real ativas
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recomendacoes.map((rec) => (
          <CardSuplemento key={rec.suplemento_id} suplemento={adaptarRecomendacao(rec)} />
        ))}
      </div>
    </>
  );
}
