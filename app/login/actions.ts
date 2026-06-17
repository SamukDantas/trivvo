'use server';

import { createClient } from '@supabase/supabase-js';

function criarClienteAcao() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://trivvo-gamma.vercel.app';

export async function loginComMagicLink(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { erro: 'Email é obrigatório.' };
  }

  const supabase = criarClienteAcao();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback`,
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
      redirectTo: `${SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { erro: error.message };
  }

  return { url: data.url };
}
