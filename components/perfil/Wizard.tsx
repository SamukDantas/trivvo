'use client';

import { useState, useCallback } from 'react';
import { Passo1Objetivo } from './Passo1Objetivo';
import { Passo2Dieta } from './Passo2Dieta';
import { Passo3Restricoes } from './Passo3Restricoes';
import { Passo4Nivel } from './Passo4Nivel';
import { Passo5Orcamento } from './Passo5Orcamento';
import { salvarPerfil, type DadosPerfil } from '@/lib/api/perfil';
import { useRouter } from 'next/navigation';

const TOTAL_PASSOS = 5;

export interface DadosWizard {
  objetivo: string;
  tipo_dieta: string;
  restricoes: string[];
  nivel_experiencia: string;
  faixa_orcamento: string;
  nome: string;
  data_nascimento: string;
  consentimento_lgpd: boolean;
}

const dadosIniciais: DadosWizard = {
  objetivo: '',
  tipo_dieta: '',
  restricoes: [],
  nivel_experiencia: '',
  faixa_orcamento: '',
  nome: '',
  data_nascimento: '',
  consentimento_lgpd: false,
};

interface WizardProps {
  dadosIniciais?: DadosWizard;
}

export default function Wizard({ dadosIniciais: preDados }: WizardProps) {
  const [passo, setPasso] = useState(1);
  const [dados, setDados] = useState<DadosWizard>(preDados || dadosIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  const atualizar = useCallback((campo: keyof DadosWizard, valor: unknown) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
    setErro(null);
  }, []);

  const proximo = () => {
    if (passo < TOTAL_PASSOS) setPasso(passo + 1);
  };

  const anterior = () => {
    if (passo > 1) setPasso(passo - 1);
  };

  const podeAvancar = (): boolean => {
    switch (passo) {
      case 1:
        return !!dados.objetivo;
      case 2:
        return !!dados.tipo_dieta;
      case 4:
        return !!dados.nivel_experiencia;
      case 5:
        return !!dados.faixa_orcamento && dados.consentimento_lgpd;
      default:
        return true;
    }
  };

  const finalizar = async () => {
    setSalvando(true);
    setErro(null);

    const perfil: DadosPerfil = {
      nome: dados.nome || '',
      data_nascimento: dados.data_nascimento || '',
      objetivo: dados.objetivo,
      tipo_dieta: dados.tipo_dieta,
      restricoes: dados.restricoes,
      nivel_experiencia: dados.nivel_experiencia,
      faixa_orcamento: dados.faixa_orcamento,
      consentimento_lgpd: dados.consentimento_lgpd,
    };

    const resultado = await salvarPerfil(perfil);

    if ('erro' in resultado && resultado.erro) {
      setErro(resultado.erro);
      setSalvando(false);
      return;
    }

    router.push('/recomendacoes');
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center gap-2">
          {Array.from({ length: TOTAL_PASSOS }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-10 rounded-full transition-colors ${
                i + 1 <= passo ? 'bg-emerald-500' : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {passo === 1 && (
            <Passo1Objetivo valor={dados.objetivo} onChange={(v) => atualizar('objetivo', v)} />
          )}
          {passo === 2 && (
            <Passo2Dieta valor={dados.tipo_dieta} onChange={(v) => atualizar('tipo_dieta', v)} />
          )}
          {passo === 3 && (
            <Passo3Restricoes
              valor={dados.restricoes}
              onChange={(v) => atualizar('restricoes', v)}
            />
          )}
          {passo === 4 && (
            <Passo4Nivel
              valor={dados.nivel_experiencia}
              onChange={(v) => atualizar('nivel_experiencia', v)}
            />
          )}
          {passo === 5 && (
            <Passo5Orcamento
              valor={dados.faixa_orcamento}
              consentimento={dados.consentimento_lgpd}
              onChangeOrcamento={(v) => atualizar('faixa_orcamento', v)}
              onChangeConsentimento={(v) => atualizar('consentimento_lgpd', v)}
            />
          )}

          {erro && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</div>}
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={anterior}
            disabled={passo === 1}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-0"
          >
            Voltar
          </button>

          {passo < TOTAL_PASSOS ? (
            <button
              onClick={proximo}
              disabled={!podeAvancar()}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={finalizar}
              disabled={!podeAvancar() || salvando}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Concluir'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
