import { buscarPerfil } from '@/lib/api/perfil';
import Wizard from '@/components/perfil/Wizard';

export default async function PaginaEditarPerfil() {
  const perfil = await buscarPerfil();

  const dadosIniciais = perfil
    ? {
        objetivo: perfil.objetivo || '',
        tipo_dieta: perfil.tipo_dieta || '',
        restricoes: perfil.restricoes || [],
        nivel_experiencia: perfil.nivel_experiencia || '',
        faixa_orcamento: perfil.faixa_orcamento || '',
        nome: perfil.nome || '',
        data_nascimento: perfil.data_nascimento || '',
        consentimento_lgpd: perfil.consentimento_lgpd || false,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Editar Perfil</h1>
        <p className="text-sm text-zinc-500">
          Atualize suas preferências para melhores recomendações.
        </p>
      </div>
      <Wizard dadosIniciais={dadosIniciais} />
    </div>
  );
}
