import { criarClienteServidor } from '@/lib/supabase/server';
import { criarClienteAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function DELETE() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { error: erroFavoritos } = await supabase
    .from('favoritos_usuario')
    .delete()
    .eq('usuario_id', user.id);

  if (erroFavoritos) {
    return NextResponse.json({ erro: erroFavoritos.message }, { status: 500 });
  }

  const { error: erroRecomendacoes } = await supabase
    .from('recomendacoes')
    .delete()
    .eq('usuario_id', user.id);

  if (erroRecomendacoes) {
    return NextResponse.json({ erro: erroRecomendacoes.message }, { status: 500 });
  }

  const { error: erroPerfis } = await supabase.from('perfis').delete().eq('usuario_id', user.id);

  if (erroPerfis) {
    return NextResponse.json({ erro: erroPerfis.message }, { status: 500 });
  }

  const supabaseAdmin = criarClienteAdmin();
  const { error: erroDelecao } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (erroDelecao) {
    return NextResponse.json({ erro: erroDelecao.message }, { status: 500 });
  }

  return NextResponse.json({ sucesso: true });
}
