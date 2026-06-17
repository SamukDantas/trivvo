import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MVP Suplementos — Escolha os melhores com base em dados',
  description:
    'Plataforma que compara, recomenda e verifica suplementos com base no seu perfil, objetivos e orçamento.',
  openGraph: {
    title: 'MVP Suplementos',
    description: 'Escolha os melhores suplementos do mercado com recomendações personalizadas.',
  },
};

export default function LayoutRaiz({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  );
}
