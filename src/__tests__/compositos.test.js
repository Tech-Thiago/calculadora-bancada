import { describe, expect, test } from "vitest";
import { calcularComposito } from "../utils/calculoCompositos";

describe("calculoCompositos", () => {
  test("conversao % wt para % vol e densidade teorica (70% Epoxi + 30% Fibra de Vidro, 100g)", () => {
    // Conta na mao:
    // w1 = 0.70, rho1 = 1.2 -> w1/rho1 = 0.583333
    // w2 = 0.30, rho2 = 2.5 -> w2/rho2 = 0.120000
    // somaVolRel = 0.703333 -> rho_c = 1 / 0.703333 = 1.421801 g/cm3
    // volPct1 = (0.583333 / 0.703333) * 100 = 82.9384%
    // volPct2 = (0.120000 / 0.703333) * 100 = 17.0616%
    // volumeTotalCm3 = 100 / 1.421801 = 70.3333 cm3
    const res = calcularComposito({
      modoEntrada: "wt",
      alvoTipo: "massa",
      alvoValor: 100,
      perdaPct: 0,
      componentes: [
        { id: "1", nome: "Epoxi", densidade: 1.2, fracaoPct: 70 },
        { id: "2", nome: "Fibra de Vidro", densidade: 2.5, fracaoPct: 30 },
      ],
    });

    expect(res.valido).toBe(true);
    expect(res.densidadeTeorica).toBeCloseTo(1.4218, 3);
    expect(res.volumeTotalCm3).toBeCloseTo(70.3333, 3);
    expect(res.itens[0].volPct).toBeCloseTo(82.9384, 3);
    expect(res.itens[1].volPct).toBeCloseTo(17.0616, 3);
    expect(res.itens[0].massaG).toBeCloseTo(70, 4);
    expect(res.itens[1].massaG).toBeCloseTo(30, 4);
  });

  test("conversao % vol para % wt com alvo em volume e perda de 10% (60% Matriz + 40% Carga, 50 cm3)", () => {
    // Conta na mao:
    // rho_c = 0.60 * 1.15 + 0.40 * 2.65 = 0.69 + 1.06 = 1.75 g/cm3
    // wtPct1 = (0.69 / 1.75) * 100 = 39.4286% | wtPct2 = (1.06 / 1.75) * 100 = 60.5714%
    // Com perda de 10%: volumePrep = 50 * 1.10 = 55 cm3 -> massaPrep = 55 * 1.75 = 96.25 g
    // massa1 = 96.25 * (0.69 / 1.75) = 37.95 g | massa2 = 96.25 * (1.06 / 1.75) = 58.30 g
    const res = calcularComposito({
      modoEntrada: "vol",
      alvoTipo: "volume",
      alvoValor: 50,
      perdaPct: 10,
      componentes: [
        { id: "1", nome: "Matriz", densidade: 1.15, fracaoPct: 60 },
        { id: "2", nome: "Carga Mineral", densidade: 2.65, fracaoPct: 40 },
      ],
    });

    expect(res.valido).toBe(true);
    expect(res.densidadeTeorica).toBeCloseTo(1.75, 4);
    expect(res.volumeTotalCm3).toBeCloseTo(55, 4);
    expect(res.massaTotalG).toBeCloseTo(96.25, 4);
    expect(res.itens[0].massaG).toBeCloseTo(37.95, 3);
    expect(res.itens[1].massaG).toBeCloseTo(58.30, 3);
  });
});
