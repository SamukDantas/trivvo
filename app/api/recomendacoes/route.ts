import { NextRequest, NextResponse } from 'next/server';
import { criarClienteAdmin } from '@/lib/supabase/admin';
import { gerarRecomendacoes } from '@/lib/recomendacoes/motor';
import type { ResultadoRecomendacao } from '@/lib/recomendacoes/motor';

/**
 * POST /api/recomendacoes
 *
 * Corpo esperado: { usuario_id: string }
 *
 * Gera novas recomendações de suplementos para o perfil do usuário,
 * persiste no banco e retorna o resultado.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const usuarioId: string | undefined = body?.usuario_id;

    if (!usuarioId) {
      return NextResponse.json({ erro: 'usuario_id é obrigatório.' }, { status: 400 });
    }

    const supabase = criarClienteAdmin();

    const { data: perfil, error: erroPerfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('usuario_id', usuarioId)
      .single();

    if (erroPerfil || !perfil) {
      return NextResponse.json(
        { erro: 'Perfil não encontrado para o usuário informado.' },
        { status: 404 }
      );
    }

    const resultados = await gerarRecomendacoes(perfil);

    return NextResponse.json({ recomendacoes: resultados });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro interno do servidor.';
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}

/**
 * GET /api/recomendacoes?usuario_id=...
 *
 * Retorna as recomendações em cache, se ainda válidas.
 * Caso o cache tenha expirado, gera novas recomendações automaticamente.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuario_id');

    if (!usuarioId) {
      return NextResponse.json({ erro: 'Parâmetro usuario_id é obrigatório.' }, { status: 400 });
    }

    const supabase = criarClienteAdmin();

    // Buscar recomendações em cache que ainda não expiraram
    const { data: cache, error: erroCache } = await supabase
      .from('recomendacoes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .gte('data_expiracao', new Date().toISOString())
      .order('pontuacao', { ascending: false })
      .limit(10);

    if (!erroCache && cache && cache.length > 0) {
      const resultados: ResultadoRecomendacao[] = cache.map((r) => ({
        suplemento_id: r.suplemento_id,
        nome: r.nome ?? '',
        marca: r.marca ?? '',
        pontuacao: r.pontuacao,
        motivo: r.motivo,
      }));

      return NextResponse.json({ recomendacoes: resultados });
    }

    // Cache vazio ou expirado — buscar perfil e gerar novas recomendações
    const { data: perfil, error: erroPerfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('usuario_id', usuarioId)
      .single();

    if (erroPerfil || !perfil) {
      return NextResponse.json(
        { erro: 'Perfil não encontrado para o usuário informado.' },
        { status: 404 }
      );
    }

    const resultados = await gerarRecomendacoes(perfil);

    return NextResponse.json({ recomendacoes: resultados });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro interno do servidor.';
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
