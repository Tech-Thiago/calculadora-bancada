import { describe, expect, test } from "vitest";
import { parseFormula } from "../utils/formulaParser";
import { calcularSinteseCeramica } from "../utils/calculoCeramica";

describe("formulaParser e calculoCeramica", () => {
  test("parseFormula calcula massa molar de BaTiO3 conferida na mao", () => {
    // Conta na mao: Ba (137.33) + Ti (47.867) + 3 * O (3 * 15.999 = 47.997)
    // Soma = 233.194 g/mol
    const res = parseFormula("BaTiO3");
    expect(res.valido).toBe(true);
    expect(res.massaMolar).toBeCloseTo(233.194, 3);
  });

  test("calcularSinteseCeramica para BaTiO3 (10g, sem perda, BaCO3 99% e TiO2 99.5%)", () => {
    // Conta na mao:
    // MM(BaTiO3) = 233.194 g/mol -> mols = 10 / 233.194 = 0.04288275 mol
    // BaCO3 (99%): (0.04288275 * 197.338) / 0.99 = 8.5481 g
    // TiO2 (99.5%): (0.04288275 * 79.865) / 0.995 = 3.4420 g
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

  test("calcularSinteseCeramica com dopagem substitucional (5% mol Fe no sitio Ti em BaTiO3, 10g)", () => {
    // Conta na mao:
    // Estequiometria efetiva: Ba1 Ti0.95 Fe0.05 O3
    // MM = 137.33 + 0.95*47.867 + 0.05*55.845 + 3*15.999 = 233.5929 g/mol
    // mols alvo = 10 / 233.5929 = 0.04280952 mol
    // TiO2 (100%): 0.04280952 * 0.95 * 79.865 = 3.2480 g
    // Fe2O3 (100%, 2 Fe por mol): ((0.04280952 * 0.05) / 2) * 159.687 = 0.1709 g
    const res = calcularSinteseCeramica({
      formulaAlvo: "BaTiO3",
      massaAlvoG: 10,
      perdaPct: 0,
      precursores: [
        { cation: "Ba", formula: "BaCO3", nome: "Carbonato de Bario", purezaPct: 100 },
        { cation: "Ti", formula: "TiO2", nome: "Dioxido de Titanio", purezaPct: 100 },
      ],
      dopagem: {
        modo: "substitucional",
        elementoDopante: "Fe",
        elementoSubstituido: "Ti",
        porcentagemMol: 5,
        precursorFormula: "Fe2O3",
        precursorNome: "Oxido de Ferro III",
        purezaPct: 100,
      },
    });

    expect(res.valido).toBe(true);
    const tio2 = res.itens.find((i) => i.cation === "Ti");
    const fe2o3 = res.itens.find((i) => i.cation === "Fe" && i.ehDopante);
    expect(tio2.massaPesarG).toBeCloseTo(3.2480, 3);
    expect(fe2o3.massaPesarG).toBeCloseTo(0.1709, 3);
  });
});
