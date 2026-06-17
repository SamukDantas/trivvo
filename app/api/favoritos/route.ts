import { criarClienteServidor } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('favoritos_usuario')
    .select('id, suplemento_id, criado_em')
    .eq('usuario_id', user.id)
    .order('criado_em', { ascending: false });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { suplemento_id } = await request.json();

  if (!suplemento_id) {
    return NextResponse.json({ erro: 'suplemento_id é obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('favoritos_usuario')
    .insert({ usuario_id: user.id, suplemento_id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { suplemento_id } = await request.json();

  if (!suplemento_id) {
    return NextResponse.json({ erro: 'suplemento_id é obrigatório' }, { status: 400 });
  }

  const { error } = await supabase
    .from('favoritos_usuario')
    .delete()
    .eq('usuario_id', user.id)
    .eq('suplemento_id', suplemento_id);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ sucesso: true });
}
