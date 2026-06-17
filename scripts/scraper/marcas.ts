const MARCAS_CONHECIDAS: Record<string, string> = {
  'growth supplements': 'Growth Supplements',
  gsuplementos: 'Growth Supplements',
  growth: 'Growth Supplements',
  'max titanium': 'Max Titanium',
  maxtitanium: 'Max Titanium',
  max: 'Max Titanium',
  'integral medica': 'Integral Medica',
  integralmédica: 'Integral Medica',
  integralmedica: 'Integral Medica',
  integral: 'Integral Medica',
  'black skull': 'Black Skull',
  blackskull: 'Black Skull',
  'dux nutrition': 'Dux Nutrition',
  duxnutrition: 'Dux Nutrition',
  dux: 'Dux Nutrition',
  probiotica: 'Probiótica',
  probiótica: 'Probiótica',
  vitafor: 'Vitafor',
  bodyaction: 'BodyAction',
  'body action': 'BodyAction',
  'atlhetica nutrition': 'Atlhetica Nutrition',
  atlheticanutrition: 'Atlhetica Nutrition',
  atlhetica: 'Atlhetica Nutrition',
  'dark lab': 'Dark Lab',
  darklab: 'Dark Lab',
  'essential nutrition': 'Essential Nutrition',
  essentialnutrition: 'Essential Nutrition',
  'soldiers nutrition': 'Soldiers Nutrition',
  soldiersnutrition: 'Soldiers Nutrition',
  'new millen': 'New Millen',
  newmillen: 'New Millen',
  profisio: 'Profisio',
  'vita ferrin': 'Vita Ferrin',
  vitaferrin: 'Vita Ferrin',
  'optimum nutrition': 'Optimum Nutrition',
  optimumnutrition: 'Optimum Nutrition',
  'on gold': 'Optimum Nutrition',
  dymatize: 'Dymatize',
  bsn: 'BSN',
  'universal nutrition': 'Universal Nutrition',
  universalnutrition: 'Universal Nutrition',
  muscletech: 'MuscleTech',
  'muscle tech': 'MuscleTech',
  arnold: 'Arnold Nutrition',
  'arnold nutrition': 'Arnold Nutrition',
  'syntha 6': 'BSN',
  syntha6: 'BSN',
  'iso 100': 'Dymatize',
  iso100: 'Dymatize',
  midway: 'Midway',
  sanavita: 'Sanavita',
  unilife: 'Unilife',
  davita: 'Davita',
  dietsmile: 'DietSmile',
  nutrata: 'Nutrata',
  bold: 'Bold',
  'bold nutrition': 'Bold',
  boldnutrition: 'Bold',
  '3vs': '3VS Nutrition',
  'mais mu': 'Mais Mu',
  'mais mu': 'Mais Mu',
  maismu: 'Mais Mu',
  foods: 'Foods Nutrition',
};

export function extrairMarca(titulo: string): string {
  if (!titulo) return 'Desconhecida';

  const tituloLower = titulo.toLowerCase().trim();

  for (const [chave, marca] of Object.entries(MARCAS_CONHECIDAS)) {
    if (tituloLower.includes(chave)) {
      return marca;
    }
  }

  const primeiraPalavra = tituloLower.split(' ')[0];
  const corrigida = MARCAS_CONHECIDAS[primeiraPalavra];
  if (corrigida) return corrigida;

  const palavras = titulo.split(' ');
  return palavras.slice(0, 2).join(' ');
}

export { MARCAS_CONHECIDAS };
