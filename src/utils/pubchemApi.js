import { ELEMENTOS_INFO } from "../data/tabelaPeriodica";

/**
 * Normaliza termo de busca removendo acentos, espaços extras e convertendo para minúsculas.
 */
export function normalizarTermoBusca(termo) {
  return String(termo ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const MAPA_ELEMENTOS_PT_EN = Object.fromEntries(
  ELEMENTOS_INFO.map((el) => [normalizarTermoBusca(el.nome), el.nomeEn])
);

const DICIONARIO_REAGENTES_PT_EN = {
  // Ácidos
  "acido cloridrico": "Hydrochloric acid",
  "acido sulfurico": "Sulfuric acid",
  "acido nitrico": "Nitric acid",
  "acido fosforico": "Phosphoric acid",
  "acido acetico": "Acetic acid",
  "acido citrico": "Citric acid",
  "acido citrico anidro": "Citric acid",
  "acido fluoridrico": "Hydrofluoric acid",
  "acido oxalico": "Oxalic acid",
  "acido borico": "Boric acid",

  // Bases e sais
  "hidroxido de sodio": "Sodium hydroxide",
  "soda caustica": "Sodium hydroxide",
  "hidroxido de potassio": "Potassium hydroxide",
  "hidroxido de amonio": "Ammonium hydroxide",
  "hidroxido de calcio": "Calcium hydroxide",
  "cloreto de sodio": "Sodium chloride",
  "cloreto de potassio": "Potassium chloride",
  "cloreto de calcio": "Calcium chloride",
  "nitrato de prata": "Silver nitrate",
  "nitrato de calcio": "Calcium nitrate",
  "carbonato de bario": "Barium carbonate",
  "carbonato de calcio": "Calcium carbonate",
  "carbonato de estroncio": "Strontium carbonate",
  "carbonato de sodio": "Sodium carbonate",
  "carbonato de potassio": "Potassium carbonate",
  "carbonato de litio": "Lithium carbonate",
  "bicarbonato de sodio": "Sodium bicarbonate",
  "sulfato de cobre": "Copper(II) sulfate",
  "sulfato de sodio": "Sodium sulfate",
  "sulfato de magnesio": "Magnesium sulfate",

  // Óxidos e precursores cerâmicos
  "dioxido de titanio": "Titanium dioxide",
  titania: "Titanium dioxide",
  "dioxido de zirconio": "Zirconium dioxide",
  zirconia: "Zirconium dioxide",
  "dioxido de silicio": "Silicon dioxide",
  silica: "Silicon dioxide",
  "dioxido de manganes": "Manganese dioxide",
  "oxido de zinco": "Zinc oxide",
  "oxido de aluminio": "Aluminum oxide",
  alumina: "Aluminum oxide",
  "alumina alfa": "Aluminum oxide",
  "oxido de ferro": "Ferric oxide",
  "oxido de ferro iii": "Ferric oxide",
  "oxido de ferro (iii)": "Ferric oxide",
  "oxido de itrio": "Yttrium(III) oxide",
  "oxido de lantanio": "Lanthanum oxide",
  "oxido de magnesio": "Magnesium oxide",
  "oxido de cobre": "Copper(II) oxide",
  "oxido de calcio": "Calcium oxide",
  "pentoxido de niobio": "Niobium(V) oxide",

  // Solventes e orgânicos comuns
  etanol: "Ethanol",
  "alcool etilico": "Ethanol",
  metanol: "Methanol",
  isopropanol: "Isopropanol",
  "alcool isopropilico": "Isopropanol",
  acetona: "Acetone",
  "peroxido de hidrogenio": "Hydrogen peroxide",
  "agua oxigenada": "Hydrogen peroxide",
  agua: "Water",
  "agua destilada": "Water",
  glicerol: "Glycerol",
  glicerina: "Glycerol",
  ureia: "Urea",
  glicose: "Glucose",
  sacarose: "Sucrose",
  amonia: "Ammonia",
  cloroformio: "Chloroform",
  tolueno: "Toluene",
  hexano: "Hexane",
};

/**
 * Traduz localmente nomes de elementos e reagentes em português para inglês antes de consultar o PubChem.
 */
export function traduzirTermoPubChem(termo) {
  const termoOriginal = String(termo ?? "").trim();
  const normalizado = normalizarTermoBusca(termoOriginal);

  if (!normalizado) {
    return { termoOriginal, termoBuscado: "", traduzido: false };
  }

  const traducaoReagente = DICIONARIO_REAGENTES_PT_EN[normalizado];
  if (traducaoReagente) {
    return { termoOriginal, termoBuscado: traducaoReagente, traduzido: true };
  }

  const traducaoElemento = MAPA_ELEMENTOS_PT_EN[normalizado];
  if (traducaoElemento) {
    return { termoOriginal, termoBuscado: traducaoElemento, traduzido: true };
  }

  return { termoOriginal, termoBuscado: termoOriginal, traduzido: false };
}

/**
 * Consulta a API aberta PUG REST do PubChem (NIH / NCBI).
 * Retorna apenas dados oficiais com CID e URL direta para referenciamento.
 */
export async function buscarNoPubChem(termo) {
  const { termoOriginal, termoBuscado, traduzido } = traduzirTermoPubChem(termo);
  if (!termoBuscado) {
    throw new Error("Digite um nome em português, inglês ou fórmula química para buscar.");
  }

  const encoded = encodeURIComponent(termoBuscado);
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/Title,IUPACName,MolecularFormula,MolecularWeight/JSON`;

  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 404) {
      const detalhe = traduzido ? `"${termoBuscado}" (traduzido de "${termoOriginal}")` : `"${termoBuscado}"`;
      throw new Error(`${detalhe} não encontrado no PubChem. Tente o nome em inglês (ex: "Sodium hydroxide") ou a fórmula.`);
    }
    throw new Error(`Erro ao consultar o PubChem (HTTP ${resp.status}).`);
  }

  const data = await resp.json();
  const props = data?.PropertyTable?.Properties?.[0];
  if (!props) {
    throw new Error("Nenhum dado retornado pelo PubChem.");
  }

  return {
    cid: props.CID,
    nome: props.Title || termoBuscado,
    nomeIupac: props.IUPACName || null,
    formula: props.MolecularFormula || null,
    massa_molar_g_mol: props.MolecularWeight ? Number(props.MolecularWeight) : null,
    termoOriginal,
    termoBuscado,
    traduzido,
    fonte: `PubChem (NIH/NCBI) · CID ${props.CID}`,
    urlReferencia: `https://pubchem.ncbi.nlm.nih.gov/compound/${props.CID}`,
    extraidoEm: new Date().toISOString(),
  };
}
