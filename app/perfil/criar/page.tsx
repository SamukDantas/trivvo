import { criarClienteServidor } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Wizard from '@/components/perfil/Wizard';

export default async function PaginaCriarPerfil() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select(
      'objetivo, tipo_dieta, restricoes, nivel_experiencia, faixa_orcamento, consentimento_lgpd'
    )
    .eq('usuario_id', user.id)
    .single();

  if (perfil?.objetivo) {
    redirect('/recomendacoes');
  }

  const dadosIniciais = perfil
    ? {
        objetivo: perfil.objetivo || '',
        tipo_dieta: perfil.tipo_dieta || '',
        restricoes: perfil.restricoes || [],
        nivel_experiencia: perfil.nivel_experiencia || '',
        faixa_orcamento: perfil.faixa_orcamento || '',
        nome: '',
        data_nascimento: '',
        consentimento_lgpd: perfil.consentimento_lgpd || false,
      }
    : undefined;

  const temPerfil = !!perfil;

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          {temPerfil ? 'Completar Perfil' : 'Criar Perfil'}
        </h1>
        <p className="text-sm text-zinc-500">
          {temPerfil
            ? 'Faltam poucas informações para personalizarmos suas recomendações.'
            : 'Responda 5 perguntas rápidas para personalizarmos suas recomendações.'}
        </p>
      </div>
      <Wizard dadosIniciais={dadosIniciais} />
    </div>
  );
}
