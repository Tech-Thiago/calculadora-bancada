import { describe, expect, test } from "vitest";
import { calcularPolimero } from "../utils/calculoPolimeros";
import { calcularSolucaoSolido, calcularDiluicao } from "../utils/calculoSolucoes";
import { calcularLigaMetalica } from "../utils/calculoMetais";

describe("polimeros, solucoes e metais", () => {
  test("calcularPolimero estequiometrico corrigindo pureza do endurecedor", () => {
    // Conta na mao:
    // EEW = 190, AHEW = 24 -> phr = (24 / 190) * 100 = 12.631579 phr
    // Alvo = 100g de resina (100% pura), perda = 0%, sem aditivos
    // Resina a pesar = 100.0000 g
    // Endurecedor nominal = 100 * (12.631579 / 100) = 12.631579 g
    // Com pureza 97% (0.97): 12.631579 / 0.97 = 13.022246 g
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
    // MM(NaOH) = 22.990 + 15.999 + 1.008 = 39.997 g/mol
    // V = 250 mL = 0.25 L, C = 0.5 mol/L -> mols = 0.5 * 0.25 = 0.125 mol
    // Massa pura = 0.125 * 39.997 = 4.999625 g
    // Com pureza 98% (0.98): 4.999625 / 0.98 = 5.101658 g
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

  test("calcularDiluicao C1*V1 = C2*V2 (1.0 M para 0.05 M em 100 mL)", () => {
    // Conta na mao:
    // V1 = (C2 * V2) / C1 = (0.05 * 100) / 1.0 = 5.0 mL
    // Solvente = 100 - 5 = 95.0 mL
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
    // MM(Fe) = 55.845 g/mol, MM(Ni) = 58.693 g/mol
    // Em 1 mol total (0.5 mol Fe + 0.5 mol Ni):
    // massa mol = 0.5 * 55.845 + 0.5 * 58.693 = 27.9225 + 29.3465 = 57.269 g/mol
    // wt% Fe = 27.9225 / 57.269 = 48.7567% -> em 100g = 48.7567 g
    // wt% Ni = 29.3465 / 57.269 = 51.2433% -> em 100g = 51.2433 g
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
});
