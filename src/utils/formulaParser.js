import { TABELA_PERIODICA } from "../data/tabelaPeriodica";

/**
 * Interpreta fórmulas químicas com parênteses, colchetes, frações decimais e hidratos (· ou *).
 * Ex: "Ba0.85Ca0.15TiO3", "Ca(NO3)2·4H2O", "LiFePO4"
 */
export function parseFormula(formulaRaw) {
  if (!formulaRaw || typeof formulaRaw !== "string") {
    return { valido: false, erro: "Fórmula vazia." };
  }

  const limpa = formulaRaw.replace(/\s+/g, "").replace(/,/g, ".");
  if (!limpa) return { valido: false, erro: "Fórmula vazia." };

  const partes = limpa.split(/[·•*]/);
  const totais = {};

  for (const parte of partes) {
    if (!parte) continue;
    let multParte = 1;
    let corpo = parte;

    const matchPrefixo = parte.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (matchPrefixo) {
      multParte = parseFloat(matchPrefixo[1]);
      corpo = matchPrefixo[2];
    }

    const resParte = parseSegmento(corpo);
    if (!resParte.valido) return resParte;

    for (const [el, qtd] of Object.entries(resParte.elementos)) {
      totais[el] = (totais[el] || 0) + qtd * multParte;
    }
  }

  let massaMolar = 0;
  for (const [el, qtd] of Object.entries(totais)) {
    if (!(el in TABELA_PERIODICA)) {
      return { valido: false, erro: `Elemento desconhecido: "${el}".` };
    }
    massaMolar += TABELA_PERIODICA[el] * qtd;
  }

  if (massaMolar <= 0) {
    return { valido: false, erro: "Não foi possível interpretar a fórmula." };
  }

  return { valido: true, elementos: totais, massaMolar };
}

function parseSegmento(str) {
  const pilha = [{}];
  let i = 0;

  while (i < str.length) {
    const ch = str[i];

    if (ch === "(" || ch === "[") {
      pilha.push({});
      i++;
    } else if (ch === ")" || ch === "]") {
      if (pilha.length === 1) {
        return { valido: false, erro: "Parêntese/colchete fechado sem abrir." };
      }
      i++;
      const numMatch = str.slice(i).match(/^(\d+(?:\.\d+)?)/);
      const mult = numMatch ? parseFloat(numMatch[1]) : 1;
      if (numMatch) i += numMatch[1].length;

      const grupo = pilha.pop();
      const topo = pilha[pilha.length - 1];
      for (const [el, qtd] of Object.entries(grupo)) {
        topo[el] = (topo[el] || 0) + qtd * mult;
      }
    } else if (/[A-Z]/.test(ch)) {
      const matchEl = str.slice(i).match(/^([A-Z][a-z]?)(\d+(?:\.\d+)?)?/);
      if (!matchEl) {
        return { valido: false, erro: `Caractere inválido próximo a "${str.slice(i, i + 5)}".` };
      }
      const el = matchEl[1];
      if (!(el in TABELA_PERIODICA)) {
        return { valido: false, erro: `Elemento não encontrado na tabela periódica: "${el}".` };
      }
      const qtd = matchEl[2] ? parseFloat(matchEl[2]) : 1;
      const topo = pilha[pilha.length - 1];
      topo[el] = (topo[el] || 0) + qtd;
      i += matchEl[0].length;
    } else {
      return { valido: false, erro: `Caractere inesperado "${ch}" na fórmula.` };
    }
  }

  if (pilha.length !== 1) {
    return { valido: false, erro: "Parêntese ou colchete não fechado." };
  }

  return { valido: true, elementos: pilha[0] };
}
