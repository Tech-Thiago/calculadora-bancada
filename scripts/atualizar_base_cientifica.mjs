import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const COMPOSTOS_ALVO = [
  ["BaCO3", "Carbonato de Bário", "ceramica"],
  ["TiO2", "Dióxido de Titânio", "ceramica"],
  ["CaCO3", "Carbonato de Cálcio", "ceramica"],
  ["SrCO3", "Carbonato de Estrôncio", "ceramica"],
  ["ZrO2", "Dióxido de Zircônio", "ceramica"],
  ["Yttrium(III) oxide", "Óxido de Ítrio", "ceramica"],
  ["Al2O3", "Alumina Alfa", "ceramica"],
  ["ZnO", "Óxido de Zinco", "ceramica"],
  ["Ferric oxide", "Óxido de Ferro (III)", "ceramica"],
  ["MnO2", "Dióxido de Manganês", "ceramica"],
  ["La2O3", "Óxido de Lantânio", "ceramica"],
  ["Nb2O5", "Pentóxido de Nióbio", "ceramica"],
  ["Li2CO3", "Carbonato de Lítio", "ceramica"],
  ["NaOH", "Hidróxido de Sódio", "solucoes"],
  ["KOH", "Hidróxido de Potássio", "solucoes"],
  ["NaCl", "Cloreto de Sódio", "solucoes"],
  ["KCl", "Cloreto de Potássio", "solucoes"],
  ["AgNO3", "Nitrato de Prata", "solucoes"],
  ["Citric acid", "Ácido Cítrico Anidro", "solucoes"],
  ["HCl", "Ácido Clorídrico", "solucoes"],
  ["H2SO4", "Ácido Sulfúrico", "solucoes"],
  ["HNO3", "Ácido Nítrico", "solucoes"],
  ["H3PO4", "Ácido Fosfórico", "solucoes"],
  ["Acetic acid", "Ácido Acético", "solucoes"],
  ["Triethylenetetramine", "Trietilenotetramina (TETA)", "polimeros"],
  ["Diethylenetriamine", "Dietilenotriamina (DETA)", "polimeros"],
  ["Isophoronediamine", "Isoforonodiamina (IPDA)", "polimeros"],
  ["4,4'-Diaminodiphenyl sulfone", "4,4'-Diaminodifenilsulfona (DDS)", "polimeros"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function consultarPubChem(termo) {
  const encoded = encodeURIComponent(termo);
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/Title,IUPACName,MolecularFormula,MolecularWeight/JSON`;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "LabCalc-ScientificUpdater/1.0" },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const props = data?.PropertyTable?.Properties?.[0];
    if (!props) return null;

    return {
      cid: props.CID,
      titulo_pubchem: props.Title ?? null,
      nome_iupac: props.IUPACName ?? null,
      formula_molecular: props.MolecularFormula ?? null,
      massa_molar_g_mol: props.MolecularWeight ? Number(props.MolecularWeight) : null,
      fonte: `PubChem (NIH/NCBI) · CID ${props.CID}`,
      url_referencia: `https://pubchem.ncbi.nlm.nih.gov/compound/${props.CID}`,
    };
  } catch (err) {
    console.warn(`[AVISO] Falha ao consultar '${termo}': ${err.message}`);
    return null;
  }
}

async function main() {
  const resultados = [];
  for (const [query, nome_pt, modulo] of COMPOSTOS_ALVO) {
    console.log(`Consultando PubChem: ${query} (${nome_pt})...`);
    const info = await consultarPubChem(query);
    if (info) {
      resultados.push({
        consulta: query,
        nome_pt,
        modulo_principal: modulo,
        ...info,
      });
    }
    await sleep(250);
  }

  const saida = {
    schemaVersion: 1,
    fonte_primaria: "PubChem PUG REST API (National Institutes of Health / NCBI)",
    url_api: "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest",
    atualizado_em_utc: new Date().toISOString(),
    total_compostos: resultados.length,
    compostos: resultados,
  };

  const destino = path.join("src", "data", "base_cientifica_pubchem.json");
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, JSON.stringify(saida, null, 2), "utf-8");
  console.log(`\nConcluido! ${resultados.length} compostos salvos em ${destino}`);
}

main();

