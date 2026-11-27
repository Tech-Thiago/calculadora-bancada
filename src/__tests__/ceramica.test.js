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

  test("parseFormula interpreta hidrato Ca(NO3)2·4H2O corretamente", () => {
    // Ca (40.078) + 2*N (28.014) + 10*O (159.99) + 8*H (8.064) = 236.146 g/mol
    const res = parseFormula("Ca(NO3)2·4H2O");
    expect(res.valido).toBe(true);
    expect(res.elementos).toEqual({ Ca: 1, N: 2, O: 10, H: 8 });
    expect(res.massaMolar).toBeCloseTo(236.146, 3);
  });

  test("parseFormula interpreta parenteses e colchetes aninhados", () => {
    // Mg(Al(OH)4)2: Mg (24.305) + 2*Al (53.964) + 8*O (127.992) + 8*H (8.064) = 214.325 g/mol
    const hidroxido = parseFormula("Mg(Al(OH)4)2");
    expect(hidroxido.valido).toBe(true);
    expect(hidroxido.elementos).toEqual({ Mg: 1, Al: 2, O: 8, H: 8 });
    expect(hidroxido.massaMolar).toBeCloseTo(214.325, 3);

    // K4[Fe(CN)6]: 4*K (156.392) + Fe (55.845) + 6*C (72.066) + 6*N (84.042) = 368.345 g/mol
    const ferrocianeto = parseFormula("K4[Fe(CN)6]");
    expect(ferrocianeto.valido).toBe(true);
    expect(ferrocianeto.elementos).toEqual({ K: 4, Fe: 1, C: 6, N: 6 });
    expect(ferrocianeto.massaMolar).toBeCloseTo(368.345, 3);
  });

  test("parseFormula distingue elementos de duas letras de elementos de uma letra (Co vs C)", () => {
    // CoCO3: Co (58.933) + C (12.011) + 3*O (47.997) = 118.941 g/mol
    const carbonato = parseFormula("CoCO3");
    expect(carbonato.valido).toBe(true);
    expect(carbonato.elementos).toEqual({ Co: 1, C: 1, O: 3 });
    expect(carbonato.massaMolar).toBeCloseTo(118.941, 3);

    const oxidoCobalto = parseFormula("CoO");
    const monoxidoCarbono = parseFormula("CO");
    expect(oxidoCobalto.valido).toBe(true);
    expect(oxidoCobalto.elementos.Co).toBe(1);
    expect("C" in oxidoCobalto.elementos).toBe(false);
    expect(monoxidoCarbono.valido).toBe(true);
    expect(monoxidoCarbono.elementos.C).toBe(1);
    expect("Co" in monoxidoCarbono.elementos).toBe(false);
  });

  test("calcularSinteseCeramica retorna erro quando precursor nao contem o cation esperado", () => {
    const res = calcularSinteseCeramica({
      formulaAlvo: "BaTiO3",
      massaAlvoG: 10,
      perdaPct: 0,
      precursores: [
        { cation: "Ba", formula: "CaCO3", nome: "Precursor errado", purezaPct: 99 },
        { cation: "Ti", formula: "TiO2", nome: "Dioxido de Titanio", purezaPct: 99.5 },
      ],
    });

    expect(res.valido).toBe(false);
    expect(res.erro).toContain("não contém o cátion Ba");
  });

  test("calcularSinteseCeramica retorna erro com pureza fora do intervalo (0 ou >100%)", () => {
    const resZero = calcularSinteseCeramica({
      formulaAlvo: "BaTiO3",
      massaAlvoG: 10,
      perdaPct: 0,
      precursores: [
        { cation: "Ba", formula: "BaCO3", nome: "Carbonato de Bario", purezaPct: 0 },
        { cation: "Ti", formula: "TiO2", nome: "Dioxido de Titanio", purezaPct: 99.5 },
      ],
    });
    expect(resZero.valido).toBe(false);
    expect(resZero.erro).toContain("Pureza inválida");

    const resAcima = calcularSinteseCeramica({
      formulaAlvo: "BaTiO3",
      massaAlvoG: 10,
      perdaPct: 0,
      precursores: [
        { cation: "Ba", formula: "BaCO3", nome: "Carbonato de Bario", purezaPct: 105 },
        { cation: "Ti", formula: "TiO2", nome: "Dioxido de Titanio", purezaPct: 99.5 },
      ],
    });
    expect(resAcima.valido).toBe(false);
    expect(resAcima.erro).toContain("Pureza inválida");
  });
});
