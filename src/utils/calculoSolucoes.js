import { parseFormula } from "./formulaParser";

const FATOR_CONC_MOLAR = {
  M: 1,
  mM: 1e-3,
  uM: 1e-6,
};

function volumeParaLitros(valor, unidade) {
  const v = Number(valor);
  if (unidade === "L") return v;
  if (unidade === "mL") return v / 1000;
  if (unidade === "uL") return v / 1e6;
  return v / 1000;
}

/**
 * 1. Preparo de solução a partir de reagente sólido
 */
export function calcularSolucaoSolido({
  formula = "NaCl",
  nome = "Cloreto de Sódio",
  concentracao = 0.1,
  unidadeConc = "M", // "M" | "mM" | "g/L" | "% m/v" | "ppm"
  volume = 250,
  unidadeVol = "mL", // "mL" | "L"
  purezaPct = 99.5,
  alertas = [],
}) {
  const conc = Number(concentracao);
  const volL = volumeParaLitros(volume, unidadeVol);
  const pureza = Number(purezaPct);

  if (!(conc > 0) || !(volL > 0)) {
    return { valido: false, erro: "Informe concentração e volume final positivos." };
  }
  if (!(pureza > 0 && pureza <= 100)) {
    return { valido: false, erro: "A pureza deve estar entre 0,01% e 100%." };
  }

  const parsed = parseFormula(formula);
  const precisaMM = unidadeConc === "M" || unidadeConc === "mM";
  if (precisaMM && !parsed.valido) {
    return { valido: false, erro: `Fórmula inválida para cálculo molar: ${parsed.erro}` };
  }

  const mm = parsed.valido ? parsed.massaMolar : null;
  let massaAtivaG = 0;
  let mols = null;
  let molaridadeEq = null;

  if (unidadeConc === "M" || unidadeConc === "mM") {
    molaridadeEq = conc * FATOR_CONC_MOLAR[unidadeConc];
    mols = molaridadeEq * volL;
    massaAtivaG = mols * mm;
  } else if (unidadeConc === "g/L") {
    massaAtivaG = conc * volL;
    if (mm) {
      mols = massaAtivaG / mm;
      molaridadeEq = mols / volL;
    }
  } else if (unidadeConc === "% m/v") {
    // % m/v = g de soluto por 100 mL de solução
    massaAtivaG = conc * (volL * 10);
    if (mm) {
      mols = massaAtivaG / mm;
      molaridadeEq = mols / volL;
    }
  } else if (unidadeConc === "ppm") {
    // 1 ppm ≈ 1 mg/L em soluções aquosas diluídas
    massaAtivaG = (conc * volL) / 1000;
    if (mm) {
      mols = massaAtivaG / mm;
      molaridadeEq = mols / volL;
    }
  }

  const massaPesarG = massaAtivaG / (pureza / 100);
  const volMl = volL * 1000;

  const roteiro = [
    `Pesar exatamente ${massaPesarG.toFixed(4)} g de ${nome || formula} (pureza ${pureza.toFixed(1)}%).`,
    `Transferir para um béquer com aproximadamente ${(volMl * 0.6).toFixed(0)} mL de solvente e agitar até dissolução completa.`,
    `Transferir quantitativamente para balão volumétrico de ${volMl >= 1000 ? `${(volMl / 1000).toFixed(2)} L` : `${volMl.toFixed(1)} mL`}, lavando o béquer com pequenas porções de solvente.`,
    `Completar o volume até a marca do menisco e homogeneizar por inversão.`,
  ];

  return {
    valido: true,
    tipo: "solido",
    formula,
    nome: nome || formula,
    massaMolar: mm,
    mols,
    molaridadeEq,
    massaAtivaG,
    massaPesarG,
    volumeFinalMl: volMl,
    purezaPct: pureza,
    alertas,
    roteiro,
  };
}

/**
 * 2. Preparo de solução a partir de líquido concentrado (P.A.)
 */
export function calcularSolucaoLiquido({
  formula = "HCl",
  nome = "Ácido Clorídrico P.A. (37%)",
  purezaPct = 37.0,
  densidade = 1.19,
  concentracao = 1.0,
  unidadeConc = "M", // "M" | "mM" | "g/L" | "% m/v" | "% v/v"
  volume = 250,
  unidadeVol = "mL",
  acidoForte = true,
  alertas = [],
}) {
  const conc = Number(concentracao);
  const volL = volumeParaLitros(volume, unidadeVol);
  const pureza = Number(purezaPct);
  const rho = Number(densidade);

  if (!(conc > 0) || !(volL > 0)) {
    return { valido: false, erro: "Informe concentração e volume final positivos." };
  }
  if (!(pureza > 0 && pureza <= 100) || !(rho > 0)) {
    return { valido: false, erro: "Pureza (% m/m) e densidade (g/mL) devem ser positivos." };
  }

  const parsed = parseFormula(formula);
  const precisaMM = unidadeConc === "M" || unidadeConc === "mM";
  if (precisaMM && !parsed.valido) {
    return { valido: false, erro: `Fórmula inválida para cálculo molar: ${parsed.erro}` };
  }

  const mm = parsed.valido ? parsed.massaMolar : null;
  // Molaridade do frasco concentrado: M_est = (10 * rho * %m/m) / MM
  const molaridadeEstoque = mm ? (10 * rho * pureza) / mm : null;

  const volFinalMl = volL * 1000;
  let volumePipetarMl = 0;

  if (unidadeConc === "M" || unidadeConc === "mM") {
    const concAlvoM = conc * FATOR_CONC_MOLAR[unidadeConc];
    if (concAlvoM > molaridadeEstoque) {
      return {
        valido: false,
        erro: `A concentração alvo (${concAlvoM.toFixed(3)} M) é maior que a do reagente estoque (${molaridadeEstoque.toFixed(3)} M).`,
      };
    }
    volumePipetarMl = (concAlvoM * volFinalMl) / molaridadeEstoque;
  } else if (unidadeConc === "g/L") {
    const massaAtivaG = conc * volL;
    const massaReagenteG = massaAtivaG / (pureza / 100);
    volumePipetarMl = massaReagenteG / rho;
  } else if (unidadeConc === "% m/v") {
    const massaAtivaG = conc * (volL * 10);
    const massaReagenteG = massaAtivaG / (pureza / 100);
    volumePipetarMl = massaReagenteG / rho;
  } else if (unidadeConc === "% v/v") {
    volumePipetarMl = (conc / 100) * volFinalMl;
  }

  if (volumePipetarMl > volFinalMl) {
    return {
      valido: false,
      erro: "O volume de reagente necessário excede o volume final da solução.",
    };
  }

  const massaEquivalenteG = volumePipetarMl * rho;
  const volumePipetarUl = volumePipetarMl * 1000;
  const volumeSolventeAproxMl = volFinalMl - volumePipetarMl;

  const roteiro = acidoForte
    ? [
        `ATENÇÃO: Colocar primeiro cerca de ${(volFinalMl * 0.5).toFixed(0)} mL de água destilada no balão volumétrico (NUNCA adicionar água sobre ácido concentrado).`,
        `Pipetar na capela exatamente ${volumePipetarMl >= 1 ? `${volumePipetarMl.toFixed(3)} mL` : `${volumePipetarUl.toFixed(1)} µL`} de ${nome || formula} (ou pesar ${massaEquivalenteG.toFixed(4)} g) e adicionar lentamente pelas paredes.`,
        `Aguardar a solução atingir temperatura ambiente caso haja aquecimento.`,
        `Completar com água destilada até o menisco de ${volFinalMl.toFixed(1)} mL e homogeneizar.`,
      ]
    : [
        `Colocar cerca de ${(volFinalMl * 0.5).toFixed(0)} mL de solvente no balão volumétrico.`,
        `Pipetar exatamente ${volumePipetarMl >= 1 ? `${volumePipetarMl.toFixed(3)} mL` : `${volumePipetarUl.toFixed(1)} µL`} de ${nome || formula} (equivalente a ${massaEquivalenteG.toFixed(4)} g).`,
        `Completar o volume até o menisco de ${volFinalMl.toFixed(1)} mL e homogeneizar.`,
      ];

  return {
    valido: true,
    tipo: "liquido",
    formula,
    nome: nome || formula,
    massaMolar: mm,
    molaridadeEstoque,
    volumePipetarMl,
    volumePipetarUl,
    massaEquivalenteG,
    volumeSolventeAproxMl,
    volumeFinalMl: volFinalMl,
    acidoForte,
    alertas,
    roteiro,
  };
}

/**
 * 3. Diluição simples (C1 * V1 = C2 * V2)
 */
export function calcularDiluicao({
  c1 = 1.0,
  unidadeC1 = "M",
  c2 = 0.1,
  unidadeC2 = "M",
  v2 = 100,
  unidadeV2 = "mL",
  nomeSolucao = "Solução Estoque",
}) {
  const fatores = {
    M: 1,
    mM: 1e-3,
    uM: 1e-6,
    "g/L": 1,
    "mg/L": 1e-3,
    "ug/L": 1e-6,
    "%": 1,
  };

  const grupoMolar = new Set(["M", "mM", "uM"]);
  const grupoMassa = new Set(["g/L", "mg/L", "ug/L"]);

  const mesmoGrupo =
    (grupoMolar.has(unidadeC1) && grupoMolar.has(unidadeC2)) ||
    (grupoMassa.has(unidadeC1) && grupoMassa.has(unidadeC2)) ||
    (unidadeC1 === "%" && unidadeC2 === "%");

  if (!mesmoGrupo) {
    return {
      valido: false,
      erro: `Unidades incompatíveis entre C₁ (${unidadeC1}) e C₂ (${unidadeC2}). Use a mesma família de unidades.`,
    };
  }

  const c1Base = Number(c1) * fatores[unidadeC1];
  const c2Base = Number(c2) * fatores[unidadeC2];
  const v2Num = Number(v2);

  if (!(c1Base > 0) || !(c2Base > 0) || !(v2Num > 0)) {
    return { valido: false, erro: "Informe valores positivos para C₁, C₂ e V₂." };
  }
  if (c2Base > c1Base) {
    return { valido: false, erro: "A concentração final (C₂) não pode ser maior que a inicial (C₁)." };
  }

  const fatorDiluicao = c1Base / c2Base;
  const v1 = v2Num / fatorDiluicao;
  const vSolvente = v2Num - v1;

  const roteiro = [
    `Pipetar exatamente ${v1.toFixed(3)} ${unidadeV2} de ${nomeSolucao} (${c1} ${unidadeC1}).`,
    `Transferir para frasco ou balão volumétrico de ${v2Num} ${unidadeV2}.`,
    `Adicionar ${vSolvente.toFixed(3)} ${unidadeV2} de solvente (ou completar até o menisco de ${v2Num} ${unidadeV2}) e homogeneizar.`,
  ];

  return {
    valido: true,
    tipo: "diluicao",
    nomeSolucao,
    v1,
    vSolvente,
    v2: v2Num,
    unidadeV2,
    fatorDiluicao,
    roteiro,
  };
}
