'use server';

import { criarClienteServidor } from '@/lib/supabase/server';

export interface DadosPerfil {
  nome: string;
  data_nascimento: string;
  objetivo: string;
  tipo_dieta: string;
  restricoes: string[];
  nivel_experiencia: string;
  faixa_orcamento: string;
  consentimento_lgpd: boolean;
}

export async function salvarPerfil(dados: DadosPerfil) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: 'Usuário não autenticado.' };
  }

  const { error } = await supabase
    .from('perfis')
    .update({
      nome: dados.nome,
      data_nascimento: dados.data_nascimento,
      objetivo: dados.objetivo,
      tipo_dieta: dados.tipo_dieta,
      restricoes: dados.restricoes,
      nivel_experiencia: dados.nivel_experiencia,
      faixa_orcamento: dados.faixa_orcamento,
      consentimento_lgpd: dados.consentimento_lgpd,
      consentimento_data: new Date().toISOString(),
    })
    .eq('usuario_id', user.id);

  if (error) {
    return { erro: error.message };
  }

  return { sucesso: true };
}

export async function buscarPerfil() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase.from('perfis').select('*').eq('usuario_id', user.id).single();

  return data;
}
