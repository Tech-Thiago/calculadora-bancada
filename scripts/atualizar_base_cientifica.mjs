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
const MAX_TENTATIVAS = 4;
const BACKOFF_BASE_MS = 1000;
const TAXA_MINIMA_SUCESSO = 0.9;

function validarPropsPubChem(props) {
  if (!props || typeof props !== "object") {
    return { valido: false, motivo: "Objeto de propriedades ausente." };
  }

  const cid = Number(props.CID);
  if (!Number.isInteger(cid) || cid <= 0) {
    return { valido: false, motivo: `CID inválido (${props.CID}).` };
  }

  const formula = typeof props.MolecularFormula === "string" ? props.MolecularFormula.trim() : "";
  if (!formula) {
    return { valido: false, motivo: "MolecularFormula ausente ou vazia." };
  }

  const massaMolar = Number(props.MolecularWeight);
  if (!Number.isFinite(massaMolar) || massaMolar <= 0) {
    return { valido: false, motivo: `MolecularWeight inválido (${props.MolecularWeight}).` };
  }

  return { valido: true, cid, formula, massaMolar };
}

async function consultarPubChem(termo) {
  const encoded = encodeURIComponent(termo);
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/Title,IUPACName,MolecularFormula,MolecularWeight/JSON`;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": "LabCalc-ScientificUpdater/1.0" },
      });

      if (!resp.ok) {
        const retentavel = resp.status === 429 || resp.status >= 500;
        if (retentavel && tentativa < MAX_TENTATIVAS) {
          const backoffMs = BACKOFF_BASE_MS * 2 ** (tentativa - 1);
          const retryAfterSec = Number(resp.headers.get("Retry-After"));
          const esperaMs =
            Number.isFinite(retryAfterSec) && retryAfterSec > 0
              ? Math.min(Math.max(backoffMs, retryAfterSec * 1000), 15000)
              : Math.min(backoffMs, 15000);
          console.warn(
            `[AVISO] HTTP ${resp.status} para '${termo}' (tentativa ${tentativa}/${MAX_TENTATIVAS}). Aguardando ${esperaMs} ms...`
          );
          await sleep(esperaMs);
          continue;
        }
        console.warn(`[AVISO] Falha HTTP ${resp.status} ao consultar '${termo}'.`);
        return null;
      }

      const data = await resp.json();
      const props = data?.PropertyTable?.Properties?.[0];
      const validacao = validarPropsPubChem(props);
      if (!validacao.valido) {
        console.warn(`[AVISO] Schema inválido para '${termo}': ${validacao.motivo}`);
        return null;
      }

      return {
        cid: validacao.cid,
        titulo_pubchem: props.Title ?? null,
        nome_iupac: props.IUPACName ?? null,
        formula_molecular: validacao.formula,
        massa_molar_g_mol: validacao.massaMolar,
        fonte: `PubChem (NIH/NCBI) · CID ${validacao.cid}`,
        url_referencia: `https://pubchem.ncbi.nlm.nih.gov/compound/${validacao.cid}`,
      };
    } catch (err) {
      if (tentativa < MAX_TENTATIVAS) {
        const esperaMs = Math.min(BACKOFF_BASE_MS * 2 ** (tentativa - 1), 15000);
        console.warn(
          `[AVISO] Erro de rede para '${termo}' (tentativa ${tentativa}/${MAX_TENTATIVAS}): ${err.message}. Aguardando ${esperaMs} ms...`
        );
        await sleep(esperaMs);
        continue;
      }
      console.warn(`[AVISO] Falha ao consultar '${termo}': ${err.message}`);
      return null;
    }
  }

  return null;
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

  const totalEsperado = COMPOSTOS_ALVO.length;
  const taxaSucesso = totalEsperado > 0 ? resultados.length / totalEsperado : 0;
  if (taxaSucesso < TAXA_MINIMA_SUCESSO) {
    console.error(
      `[ERRO] Coleta insuficiente: ${resultados.length}/${totalEsperado} compostos válidos (${(taxaSucesso * 100).toFixed(1)}%). Mínimo exigido: 90%. Arquivo base_cientifica_pubchem.json não foi sobrescrito.`
    );
    process.exit(1);
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

