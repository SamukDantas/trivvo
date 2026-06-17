import { criarClienteServidor } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const [{ data: perfil }, { data: favoritos }, { data: recomendacoes }] = await Promise.all([
    supabase.from('perfis').select('*').eq('usuario_id', user.id).single(),
    supabase.from('favoritos_usuario').select('*').eq('usuario_id', user.id),
    supabase.from('recomendacoes').select('*').eq('usuario_id', user.id),
  ]);

  const dados = {
    usuario_id: user.id,
    email: user.email,
    perfil,
    favoritos,
    recomendacoes,
    exportado_em: new Date().toISOString(),
  };

  return new NextResponse(JSON.stringify(dados, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="meus-dados.json"',
    },
  });
}
