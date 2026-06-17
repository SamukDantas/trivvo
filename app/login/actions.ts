'use server';

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

function criarClienteAcao() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

export async function loginComMagicLink(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { erro: 'Email é obrigatório.' };
  }

  const supabase = criarClienteAcao();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return { erro: error.message };
  }

  return { sucesso: 'Link mágico enviado! Verifique seu email.' };
}

export async function loginComGoogle() {
  const supabase = criarClienteAcao();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return { erro: error.message };
  }

  return { url: data.url };
}
