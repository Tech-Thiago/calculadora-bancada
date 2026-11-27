import { describe, expect, test } from "vitest";
import { calcularPolimero } from "../utils/calculoPolimeros";
import { calcularSolucaoSolido, calcularSolucaoLiquido, calcularDiluicao } from "../utils/calculoSolucoes";
import { calcularLigaMetalica } from "../utils/calculoMetais";

describe("polimeros, solucoes e metais", () => {
  test("calcularPolimero estequiometrico corrigindo pureza do endurecedor", () => {
    // Conta na mao:
    // phr = (24 / 190) * 100 = 12.631579 phr
    // Endurecedor com pureza 97%: 12.631579 / 0.97 = 13.022246 g
    const res = calcularPolimero({
      modo: "estequiometrico",
      resinaNome: "Epoxi",
      resinaPureza: 100,
      endurecedorNome: "TETA",
      endurecedorPureza: 97,
      eew: 190,
      ahew: 24,
      alvoTipo: "resina",
      massaAlvoG: 100,
      perdaPct: 0,
      aditivos: [],
    });

    expect(res.valido).toBe(true);
    expect(res.phrEndurecedor).toBeCloseTo(12.6316, 3);
    expect(res.itens[1].massaG).toBeCloseTo(13.0222, 3);
  });

  test("calcularSolucaoSolido para NaOH 0.5 M em 250 mL com pureza 98%", () => {
    // Conta na mao:
    // MM(NaOH) = 39.997 g/mol -> mols = 0.125 mol -> massa pura = 4.999625 g
    // Com pureza 98%: 4.999625 / 0.98 = 5.101658 g
    const res = calcularSolucaoSolido({
      formula: "NaOH",
      nome: "Hidroxido de Sodio",
      concentracao: 0.5,
      unidadeConc: "M",
      volume: 250,
      unidadeVol: "mL",
      purezaPct: 98,
    });

    expect(res.valido).toBe(true);
    expect(res.massaPesarG).toBeCloseTo(5.1017, 3);
  });

  test("calcularSolucaoLiquido para HCl P.A. 37% (d = 1.19 g/mL) -> 250 mL de 1.0 M", () => {
    // Conta na mao:
    // MM(HCl) = 1.008 + 35.45 = 36.458 g/mol
    // Molaridade estoque = (10 * 1.19 * 37) / 36.458 = 12.0769 M
    // V1 = (1.0 * 250) / 12.0769 = 20.7007 mL
    // Massa equivalente = 20.7007 * 1.19 = 24.6338 g
    const res = calcularSolucaoLiquido({
      formula: "HCl",
      nome: "Acido Cloridrico P.A.",
      purezaPct: 37,
      densidade: 1.19,
      concentracao: 1.0,
      unidadeConc: "M",
      volume: 250,
      unidadeVol: "mL",
      acidoForte: true,
    });

    expect(res.valido).toBe(true);
    expect(res.volumePipetarMl).toBeCloseTo(20.701, 2);
    expect(res.massaEquivalenteG).toBeCloseTo(24.634, 2);
  });

  test("calcularDiluicao C1*V1 = C2*V2 (1.0 M para 0.05 M em 100 mL)", () => {
    // Conta na mao: V1 = (0.05 * 100) / 1.0 = 5.0 mL | Solvente = 95.0 mL
    const res = calcularDiluicao({
      c1: 1.0,
      unidadeC1: "M",
      c2: 0.05,
      unidadeC2: "M",
      v2: 100,
      unidadeV2: "mL",
    });

    expect(res.valido).toBe(true);
    expect(res.v1).toBeCloseTo(5.0, 4);
    expect(res.vSolvente).toBeCloseTo(95.0, 4);
  });

  test("calcularLigaMetalica binaria 50% at. Fe + 50% at. Ni em 100g (pureza 100%, rend. 100%)", () => {
    // Conta na mao:
    // massa mol = 0.5*55.845 + 0.5*58.693 = 57.269 g/mol
    // wt% Fe = 48.7567% -> 48.7567 g | wt% Ni = 51.2433 g
    const res = calcularLigaMetalica({
      modoEntrada: "at",
      massaAlvoG: 100,
      perdaPct: 0,
      elementos: [
        { id: "1", simbolo: "Fe", fracaoPct: "50", purezaPct: "100", rendimentoPct: "100" },
        { id: "2", simbolo: "Ni", fracaoPct: "50", purezaPct: "100", rendimentoPct: "100" },
      ],
    });

    expect(res.valido).toBe(true);
    expect(res.itens[0].massaPesarG).toBeCloseTo(48.7567, 3);
    expect(res.itens[1].massaPesarG).toBeCloseTo(51.2433, 3);
  });

  test("calcularDiluicao retorna erro com unidades incompativeis (M e g/L)", () => {
    const res = calcularDiluicao({
      c1: 1.0,
      unidadeC1: "M",
      c2: 10,
      unidadeC2: "g/L",
      v2: 100,
      unidadeV2: "mL",
    });

    expect(res.valido).toBe(false);
    expect(res.erro).toContain("incompatíveis");
  });

  test("calcularSolucaoLiquido retorna erro quando concentracao alvo excede molaridade do estoque", () => {
    const res = calcularSolucaoLiquido({
      formula: "HCl",
      nome: "Acido Cloridrico P.A.",
      purezaPct: 37,
      densidade: 1.19,
      concentracao: 15,
      unidadeConc: "M",
      volume: 250,
      unidadeVol: "mL",
      acidoForte: true,
    });

    expect(res.valido).toBe(false);
    expect(res.erro).toContain("maior que a do reagente estoque");
  });

  test("calcularLigaMetalica retorna erro quando a soma das fracoes nao fecha em 100%", () => {
    const res = calcularLigaMetalica({
      modoEntrada: "at",
      massaAlvoG: 100,
      perdaPct: 0,
      elementos: [
        { id: "1", simbolo: "Fe", fracaoPct: "50", purezaPct: "100", rendimentoPct: "100" },
        { id: "2", simbolo: "Ni", fracaoPct: "30", purezaPct: "100", rendimentoPct: "100" },
      ],
    });

    expect(res.valido).toBe(false);
    expect(res.erro).toContain("100%");
  });

  test("calcularLigaMetalica retorna erro com pureza invalida (0% ou >100%)", () => {
    const resZero = calcularLigaMetalica({
      modoEntrada: "at",
      massaAlvoG: 100,
      perdaPct: 0,
      elementos: [
        { id: "1", simbolo: "Fe", fracaoPct: "50", purezaPct: "0", rendimentoPct: "100" },
        { id: "2", simbolo: "Ni", fracaoPct: "50", purezaPct: "100", rendimentoPct: "100" },
      ],
    });
    expect(resZero.valido).toBe(false);
    expect(resZero.erro).toContain("Pureza");

    const resAcima = calcularLigaMetalica({
      modoEntrada: "at",
      massaAlvoG: 100,
      perdaPct: 0,
      elementos: [
        { id: "1", simbolo: "Fe", fracaoPct: "50", purezaPct: "105", rendimentoPct: "100" },
        { id: "2", simbolo: "Ni", fracaoPct: "50", purezaPct: "100", rendimentoPct: "100" },
      ],
    });
    expect(resAcima.valido).toBe(false);
    expect(resAcima.erro).toContain("Pureza");
  });
});
