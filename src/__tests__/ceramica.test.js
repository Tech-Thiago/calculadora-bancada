import { describe, expect, test } from "vitest";
import { parseFormula } from "../utils/formulaParser";
import { calcularSinteseCeramica } from "../utils/calculoCeramica";

describe("formulaParser e calculoCeramica", () => {
  test("parseFormula calcula massa molar de BaTiO3 conferida na mao", () => {
    // Conta na mao: Ba (137.33) + Ti (47.867) + 3 * O (3 * 15.999 = 47.997)
    // Soma = 137.33 + 47.867 + 47.997 = 233.194 g/mol
    const res = parseFormula("BaTiO3");
    expect(res.valido).toBe(true);
    expect(res.massaMolar).toBeCloseTo(233.194, 3);
  });

  test("calcularSinteseCeramica para BaTiO3 (10g, sem perda, BaCO3 99% e TiO2 99.5%)", () => {
    // Conta na mao:
    // MM(BaTiO3) = 233.194 g/mol -> mols = 10 / 233.194 = 0.04288275 mol
    // MM(BaCO3) = 137.33 + 12.011 + 3*15.999 = 197.338 g/mol -> puro = 0.04288275 * 197.338 = 8.462596 g
    // Com pureza 99% (0.99): 8.462596 / 0.99 = 8.548077 g
    // MM(TiO2) = 47.867 + 2*15.999 = 79.865 g/mol -> puro = 0.04288275 * 79.865 = 3.424831 g
    // Com pureza 99.5% (0.995): 3.424831 / 0.995 = 3.442041 g
    const res = calcularSinteseCeramica({
      formulaAlvo: "BaTiO3",
      massaAlvoG: 10,
      perdaPct: 0,
      precursores: [
        { cation: "Ba", formula: "BaCO3", nome: "Carbonato de Bario", purezaPct: 99 },
        { cation: "Ti", formula: "TiO2", nome: "Dioxido de Titanio", purezaPct: 99.5 },
      ],
    });

    expect(res.valido).toBe(true);
    const baco3 = res.itens.find((i) => i.cation === "Ba");
    const tio2 = res.itens.find((i) => i.cation === "Ti");
    expect(baco3.massaPesarG).toBeCloseTo(8.5481, 3);
    expect(tio2.massaPesarG).toBeCloseTo(3.4420, 3);
  });
});
