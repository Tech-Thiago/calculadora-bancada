import { TABELA_PERIODICA } from "../data/tabelaPeriodica";

export const LIGAS_PRESET = [
  {
    nome: "Ti-6Al-4V (% wt)",
    modoEntrada: "wt",
    elementos: [
      { simbolo: "Ti", fracaoPct: "90", purezaPct: "99.9", rendimentoPct: "100" },
      { simbolo: "Al", fracaoPct: "6", purezaPct: "99.9", rendimentoPct: "100" },
      { simbolo: "V", fracaoPct: "4", purezaPct: "99.5", rendimentoPct: "100" },
    ],
  },
  {
    nome: "Liga de Alta Entropia Cantor — CoCrFeMnNi (% at.)",
    modoEntrada: "at",
    elementos: [
      { simbolo: "Co", fracaoPct: "20", purezaPct: "99.9", rendimentoPct: "100" },
      { simbolo: "Cr", fracaoPct: "20", purezaPct: "99.5", rendimentoPct: "100" },
      { simbolo: "Fe", fracaoPct: "20", purezaPct: "99.9", rendimentoPct: "100" },
      { simbolo: "Mn", fracaoPct: "20", purezaPct: "99.5", rendimentoPct: "97" },
      { simbolo: "Ni", fracaoPct: "20", purezaPct: "99.9", rendimentoPct: "100" },
    ],
  },
  {
    nome: "Aço Inox 304 simplificado — Fe-18Cr-8Ni (% wt)",
    modoEntrada: "wt",
    elementos: [
      { simbolo: "Fe", fracaoPct: "74", purezaPct: "99.5", rendimentoPct: "100" },
      { simbolo: "Cr", fracaoPct: "18", purezaPct: "99.5", rendimentoPct: "100" },
      { simbolo: "Ni", fracaoPct: "8", purezaPct: "99.9", rendimentoPct: "100" },
    ],
  },
  {
    nome: "Latão 70/30 — Cu-30Zn (% wt)",
    modoEntrada: "wt",
    elementos: [
      { simbolo: "Cu", fracaoPct: "70", purezaPct: "99.9", rendimentoPct: "100" },
      { simbolo: "Zn", fracaoPct: "30", purezaPct: "99.9", rendimentoPct: "95" },
    ],
  },
  {
    nome: "Intermetálico NiTi equiatômico (% at.)",
    modoEntrada: "at",
    elementos: [
      { simbolo: "Ni", fracaoPct: "50", purezaPct: "99.9", rendimentoPct: "100" },
      { simbolo: "Ti", fracaoPct: "50", purezaPct: "99.9", rendimentoPct: "100" },
    ],
  },
];

/**
 * Calcula carga de fusão / metalurgia do pó para N elementos.
 * Converte % atômica <-> % mássica e aplica pureza (%) e rendimento metálico (%).
 */
export function calcularLigaMetalica({
  modoEntrada = "at", // "at" | "wt"
  massaAlvoG = 20,
  perdaPct = 0,
  elementos = [], // [{ id, simbolo, fracaoPct, purezaPct, rendimentoPct }]
}) {
  const mAlvo = Number(massaAlvoG);
  if (!(mAlvo > 0)) {
    return { valido: false, erro: "Informe uma massa alvo positiva (em gramas)." };
  }
  if (elementos.length === 0) {
    return { valido: false, erro: "Adicione ao menos um elemento químico." };
  }

  const validados = [];
  for (const el of elementos) {
    const simb = (el.simbolo || "").trim();
    if (!(simb in TABELA_PERIODICA)) {
      return {
        valido: false,
        erro: `Elemento "${simb || "(vazio)"}" não encontrado na tabela periódica (atenção às maiúsculas/minúsculas, ex: Fe, Cr, Ti).`,
      };
    }
    const fracao = Number(el.fracaoPct);
    const pureza = Number(el.purezaPct);
    const rendimento = Number(el.rendimentoPct);

    if (Number.isNaN(fracao) || fracao < 0) {
      return { valido: false, erro: `Fração inválida para ${simb}.` };
    }
    if (!(pureza > 0 && pureza <= 100)) {
      return { valido: false, erro: `Pureza de ${simb} deve estar entre 0,01% e 100%.` };
    }
    if (!(rendimento > 0 && rendimento <= 100)) {
      return { valido: false, erro: `Rendimento de fusão de ${simb} deve estar entre 0,01% e 100%.` };
    }

    validados.push({
      id: el.id,
      simbolo: simb,
      massaAtomica: TABELA_PERIODICA[simb],
      fracaoPct: fracao,
      purezaPct: pureza,
      rendimentoPct: rendimento,
    });
  }

  const somaFracoes = validados.reduce((acc, e) => acc + e.fracaoPct, 0);
  if (Math.abs(somaFracoes - 100) > 0.05) {
    return {
      valido: false,
      erro: `A soma das frações está em ${somaFracoes.toFixed(2)}%. Ajuste para fechar em 100%.`,
    };
  }

  let massaAtomicaMedia = 0;
  let itensBase = [];

  if (modoEntrada === "at") {
    const comMassaRel = validados.map((e) => {
      const x = e.fracaoPct / 100;
      return { ...e, x, massaRel: x * e.massaAtomica };
    });
    massaAtomicaMedia = comMassaRel.reduce((acc, e) => acc + e.massaRel, 0);
    itensBase = comMassaRel.map((e) => {
      const w = e.massaRel / massaAtomicaMedia;
      return { ...e, w, atPct: e.x * 100, wtPct: w * 100 };
    });
  } else {
    const comMolRel = validados.map((e) => {
      const w = e.fracaoPct / 100;
      return { ...e, w, molRel: w / e.massaAtomica };
    });
    const somaMolRel = comMolRel.reduce((acc, e) => acc + e.molRel, 0);
    massaAtomicaMedia = 1 / somaMolRel;
    itensBase = comMolRel.map((e) => {
      const x = e.molRel / somaMolRel;
      return { ...e, x, atPct: x * 100, wtPct: e.w * 100 };
    });
  }

  const fPerda = 1 + Math.max(0, Number(perdaPct) || 0) / 100;
  const massaNominalG = mAlvo * fPerda;

  const itens = itensBase.map((e) => {
    const massaNominalElG = massaNominalG * e.w;
    const massaPesarG = massaNominalElG / ((e.purezaPct / 100) * (e.rendimentoPct / 100));
    const mols = massaNominalElG / e.massaAtomica;
    return {
      ...e,
      mols,
      massaNominalElG,
      massaPesarG,
    };
  });

  const massaTotalPesarG = itens.reduce((acc, i) => acc + i.massaPesarG, 0);
  const molsTotais = massaNominalG / massaAtomicaMedia;

  return {
    valido: true,
    massaAtomicaMedia,
    massaNominalG,
    massaTotalPesarG,
    molsTotais,
    itens,
  };
}
