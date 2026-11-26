import { parseFormula } from "./formulaParser";
import { TABELA_PERIODICA } from "../data/tabelaPeriodica";

/**
 * Calcula estequiometria de sintese ceramica (reacao em estado solido / coprecipitacao)
 * com suporte a pureza dos precursores e dopagem substitucional ou aditiva (% mol).
 */
export function calcularSinteseCeramica({
  formulaAlvo = "",
  massaAlvoG = 10,
  perdaPct = 0,
  precursores = [], // [{ cation, formula, nome, purezaPct, alertas }]
  dopagem = { modo: "nenhuma" },
}) {
  const mAlvo = Number(massaAlvoG);
  if (!(mAlvo > 0)) {
    return { valido: false, erro: "Informe uma massa alvo positiva (em gramas)." };
  }

  const parsedAlvo = parseFormula(formulaAlvo);
  if (!parsedAlvo.valido) {
    return { valido: false, erro: parsedAlvo.erro };
  }

  // Copia estequiometria base para aplicar dopagem substitucional se ativa
  const estequiometriaEfetiva = { ...parsedAlvo.elementos };
  let dopanteAtivo = null;

  if (dopagem && dopagem.modo && dopagem.modo !== "nenhuma") {
    const pctMol = Number(dopagem.porcentagemMol);
    const elDop = (dopagem.elementoDopante || "").trim();
    if (!(elDop in TABELA_PERIODICA)) {
      return { valido: false, erro: `Elemento dopante "${elDop || "(vazio)"}" não encontrado na tabela periódica.` };
    }
    if (!(pctMol > 0 && pctMol < 100)) {
      return { valido: false, erro: "Porcentagem molar de dopagem deve estar entre 0,01% e 99,99%." };
    }

    const parsedPrecDop = parseFormula(dopagem.precursorFormula || "");
    if (!parsedPrecDop.valido) {
      return { valido: false, erro: `Precursor dopante inválido: ${parsedPrecDop.erro}` };
    }
    const coefNoPrec = parsedPrecDop.elementos[elDop];
    if (!(coefNoPrec > 0)) {
      return {
        valido: false,
        erro: `O precursor dopante "${dopagem.precursorFormula}" não contém o elemento ${elDop}.`,
      };
    }
    const purDop = Number(dopagem.purezaPct);
    if (!(purDop > 0 && purDop <= 100)) {
      return { valido: false, erro: "Pureza do precursor dopante deve estar entre 0,1% e 100%." };
    }

    if (dopagem.modo === "substitucional") {
      const elSub = dopagem.elementoSubstituido;
      if (!elSub || !(elSub in estequiometriaEfetiva)) {
        return { valido: false, erro: "Selecione um cátion válido da fórmula alvo para substituir." };
      }
      const coefOrig = estequiometriaEfetiva[elSub];
      const delta = coefOrig * (pctMol / 100);
      estequiometriaEfetiva[elSub] = coefOrig - delta;
      estequiometriaEfetiva[elDop] = (estequiometriaEfetiva[elDop] || 0) + delta;
      dopanteAtivo = {
        cation: elDop,
        coefAlvo: delta,
        formula: dopagem.precursorFormula,
        nome: dopagem.precursorNome || `Dopante (${elDop})`,
        purezaPct: purDop,
        massaMolarPrec: parsedPrecDop.massaMolar,
        coefNoPrec,
        alertas: dopagem.alertas || [],
      };
    } else if (dopagem.modo === "aditiva") {
      // Aditiva: X% mol em relacao a 1 mol da fase alvo
      const coefAd = pctMol / 100;
      dopanteAtivo = {
        cation: elDop,
        coefAlvo: coefAd,
        formula: dopagem.precursorFormula,
        nome: dopagem.precursorNome || `Dopante aditivo (${elDop})`,
        purezaPct: purDop,
        massaMolarPrec: parsedPrecDop.massaMolar,
        coefNoPrec,
        alertas: dopagem.alertas || [],
      };
    }
  }

  // Massa molar efetiva da fase alvo
  let massaMolarAlvo = 0;
  for (const [el, coef] of Object.entries(estequiometriaEfetiva)) {
    massaMolarAlvo += TABELA_PERIODICA[el] * coef;
  }

  const fatorPerda = 1 + Math.max(0, Number(perdaPct) || 0) / 100;
  const massaPrepAlvoG = mAlvo * fatorPerda;
  const molsAlvo = massaPrepAlvoG / massaMolarAlvo;

  const itens = [];

  for (const prec of precursores) {
    const coefAlvo = estequiometriaEfetiva[prec.cation] || 0;
    if (coefAlvo <= 0) continue;

    const parsedPrec = parseFormula(prec.formula || "");
    if (!parsedPrec.valido) {
      return { valido: false, erro: `Precursor de ${prec.cation} inválido: ${parsedPrec.erro}` };
    }
    const coefNoPrec = parsedPrec.elementos[prec.cation];
    if (!(coefNoPrec > 0)) {
      return {
        valido: false,
        erro: `O precursor "${prec.formula}" não contém o cátion ${prec.cation}.`,
      };
    }
    const purezaPct = Number(prec.purezaPct);
    if (!(purezaPct > 0 && purezaPct <= 100)) {
      return { valido: false, erro: `Pureza inválida para ${prec.formula}.` };
    }

    const molsPrecursor = (molsAlvo * coefAlvo) / coefNoPrec;
    const massaPuraG = molsPrecursor * parsedPrec.massaMolar;
    const massaPesarG = massaPuraG / (purezaPct / 100);

    itens.push({
      cation: prec.cation,
      formula: prec.formula,
      nome: prec.nome || prec.formula,
      purezaPct,
      molsPrecursor,
      massaPesarG,
      alertas: prec.alertas || [],
      ehDopante: false,
    });
  }

  if (dopanteAtivo) {
    const molsPrecursor = (molsAlvo * dopanteAtivo.coefAlvo) / dopanteAtivo.coefNoPrec;
    const massaPuraG = molsPrecursor * dopanteAtivo.massaMolarPrec;
    const massaPesarG = massaPuraG / (dopanteAtivo.purezaPct / 100);

    itens.push({
      cation: dopanteAtivo.cation,
      formula: dopanteAtivo.formula,
      nome: dopanteAtivo.nome,
      purezaPct: dopanteAtivo.purezaPct,
      molsPrecursor,
      massaPesarG,
      alertas: dopanteAtivo.alertas,
      ehDopante: true,
    });
  }

  const massaTotalPrecursoresG = itens.reduce((acc, i) => acc + i.massaPesarG, 0);

  return {
    valido: true,
    massaMolarAlvo,
    massaPrepAlvoG,
    molsAlvo,
    massaTotalPrecursoresG,
    itens,
  };
}
