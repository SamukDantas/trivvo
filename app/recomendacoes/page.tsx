import { criarClienteServidor } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EstadoCarregando from '@/components/comum/EstadoCarregando';
import EstadoVazio from '@/components/comum/EstadoVazio';
import EstadoErro from '@/components/comum/EstadoErro';
import CardSuplemento from '@/components/suplementos/CardSuplemento';
import { Suspense } from 'react';

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

async function BuscarRecomendacoes() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('id, objetivo')
    .eq('usuario_id', user.id)
    .single();

  if (!perfil) {
    return (
      <EstadoVazio
        titulo="Nenhum perfil encontrado"
        descricao="Você precisa criar seu perfil para receber recomendações personalizadas."
        acao={{ texto: 'Criar perfil', href: '/perfil/criar' }}
      />
    );
  }

  if (!perfil.objetivo) {
    return (
      <EstadoVazio
        titulo="Perfil incompleto"
        descricao="Complete seu perfil para receber recomendações baseadas no seu objetivo, dieta e orçamento."
        acao={{ texto: 'Completar perfil', href: '/perfil/criar' }}
      />
    );
  }

  const resposta = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trivvo-gamma.vercel.app'}/api/recomendacoes?usuario_id=${user.id}`,
    { cache: 'no-store' }
  );

  if (!resposta.ok) {
    return <EstadoErro mensagem="Não foi possível carregar suas recomendações no momento." />;
  }

  const data = await resposta.json();

  if (data.erro) {
    return <EstadoErro mensagem={data.erro} />;
  }

  const recomendacoes: Recomendacao[] = data.recomendacoes || [];

  if (!recomendacoes || recomendacoes.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhuma recomendação disponível"
        descricao="Ainda não temos recomendações para o seu perfil. Tente atualizar suas preferências."
        acao={{ texto: 'Editar perfil', href: '/perfil/editar' }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recomendacoes.map((rec) => (
        <CardSuplemento key={rec.suplemento_id} suplemento={adaptarRecomendacao(rec)} />
      ))}
    </div>
  );
}

export default function PaginaRecomendacoes() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Suas Recomendações</h1>
          <p className="text-sm text-zinc-500">
            Suplementos selecionados com base no seu perfil, objetivos e orçamento.
          </p>
          <Link
            href="/perfil/editar"
            className="mt-1 text-sm text-emerald-600 hover:text-emerald-700 underline w-fit"
          >
            Atualizar perfil para novas recomendações
          </Link>
        </div>

        <Suspense fallback={<EstadoCarregando />}>
          <BuscarRecomendacoes />
        </Suspense>
      </div>
    </div>
  );
}
