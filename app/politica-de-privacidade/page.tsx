import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Trivvo',
};

const SECOES = [
  {
    titulo: 'Dados Coletados',
    conteudo: [
      'Ao utilizar a plataforma Trivvo, coletamos os seguintes dados pessoais:',
      'Nome completo, endereço de e-mail e data de nascimento, fornecidos durante o cadastro ou login via Google.',
      'Informações do perfil: objetivo de treino, tipo de dieta, restrições alimentares, nível de experiência com suplementação e faixa de orçamento.',
      'Dados de navegação e interação: páginas visitadas, suplementos visualizados, favoritos e recomendações geradas pela plataforma.',
      'Não coletamos dados de pagamento ou informações financeiras, pois a plataforma não processa pagamentos diretamente.',
    ],
  },
  {
    titulo: 'Finalidade',
    conteudo: [
      'Os dados coletados são utilizados exclusivamente para as seguintes finalidades:',
      'Gerar recomendações personalizadas de suplementos com base no perfil do usuário.',
      'Comparar produtos e apresentar informações relevantes como preços, ingredientes e certificações.',
      'Permitir que o usuário gerencie seus favoritos e histórico de recomendações.',
      'Melhorar a experiência da plataforma por meio de análises anônimas e agregadas de uso.',
      'Cumprir obrigações legais, incluindo o direito de acesso e exclusão de dados previstos na LGPD (Lei Geral de Proteção de Dados — Lei nº 13.709/2018).',
    ],
  },
  {
    titulo: 'Armazenamento',
    conteudo: [
      'Todos os dados são armazenados em servidores seguros gerenciados pelo provedor de infraestrutura Supabase, com criptografia em trânsito (TLS) e em repouso.',
      'Os dados de autenticação (e-mail, credenciais Google) são gerenciados exclusivamente pelo Supabase Auth, serviço de autenticação integrado à plataforma.',
      'As informações de perfil, favoritos e recomendações são armazenadas em banco de dados PostgreSQL isolado por usuário (Row Level Security — RLS).',
      'Os dados são mantidos enquanto a conta do usuário estiver ativa. Após a exclusão da conta, todos os dados são removidos em até 30 dias.',
    ],
  },
  {
    titulo: 'Direitos do Titular',
    conteudo: [
      'Nos termos da LGPD, você possui os seguintes direitos sobre seus dados pessoais:',
      'Confirmação da existência de tratamento dos seus dados.',
      'Acesso aos dados: você pode solicitar uma cópia completa dos seus dados a qualquer momento pela página de Configurações.',
      'Correção de dados incompletos, inexatos ou desatualizados, através da edição do perfil.',
      'Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.',
      'Portabilidade dos dados a outro fornecedor de serviço, mediante requisição expressa.',
      'Eliminação dos dados pessoais tratados com o consentimento do titular.',
      'Para exercer qualquer um desses direitos, entre em contato pelo e-mail indicado na seção Contato abaixo.',
    ],
  },
  {
    titulo: 'Exclusão de Dados',
    conteudo: [
      'Você pode excluir sua conta e todos os dados associados a qualquer momento através da página de Configurações.',
      'O processo de exclusão remove permanentemente seu perfil, lista de favoritos, histórico de recomendações e conta de autenticação.',
      'Após a exclusão, os dados não poderão ser recuperados. Esta ação é irreversível.',
      'Dados anonimizados utilizados para fins estatísticos podem ser mantidos após a exclusão da conta, sem possibilidade de identificação pessoal.',
    ],
  },
  {
    titulo: 'Contato',
    conteudo: [
      'Para dúvidas, solicitações ou exercício dos direitos previstos na LGPD, entre em contato:',
      'E-mail: privacidade@trivvo.app',
      'Responsável pelo tratamento de dados (DPO): Samuel Dantas',
      'Atualizado pela última vez em: 17 de junho de 2026.',
    ],
  },
];

export default function PaginaPrivacidade() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-8"
        >
          ← Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-zinc-500 mb-10">Última atualização: 17 de junho de 2026</p>

        <div className="space-y-8">
          {SECOES.map((secao) => (
            <section key={secao.titulo}>
              <h2 className="text-lg font-semibold text-zinc-900 mb-3">{secao.titulo}</h2>
              <div className="space-y-2">
                {secao.conteudo.map((paragrafo, i) => (
                  <p
                    key={i}
                    className={`text-sm leading-relaxed ${
                      i === 0 ? 'text-zinc-700' : 'text-zinc-600'
                    }`}
                  >
                    {paragrafo}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-200 text-center text-xs text-zinc-400">
          Trivvo — Brasil, 2026. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
