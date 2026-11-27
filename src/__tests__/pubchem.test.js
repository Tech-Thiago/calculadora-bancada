import { describe, expect, test } from "vitest";
import { normalizarTermoBusca, traduzirTermoPubChem } from "../utils/pubchemApi";

describe("pubchemApi traducao local PT -> EN", () => {
  test("normalizarTermoBusca remove acentos, espacos extras e maiusculas", () => {
    expect(normalizarTermoBusca("  Ácido   Sulfúrico  ")).toBe("acido sulfurico");
    expect(normalizarTermoBusca("Dióxido de Titânio")).toBe("dioxido de titanio");
  });

  test("traduz elementos quimicos em portugues usando tabelaPeriodica", () => {
    expect(traduzirTermoPubChem("Cobre")).toEqual({
      termoOriginal: "Cobre",
      termoBuscado: "Copper",
      traduzido: true,
    });
    expect(traduzirTermoPubChem("sódio")).toEqual({
      termoOriginal: "sódio",
      termoBuscado: "Sodium",
      traduzido: true,
    });
    expect(traduzirTermoPubChem("ferro")).toEqual({
      termoOriginal: "ferro",
      termoBuscado: "Iron",
      traduzido: true,
    });
  });

  test("traduz reagentes comuns de laboratorio em portugues e preserva termos em ingles/formulas", () => {
    expect(traduzirTermoPubChem("Ácido Clorídrico")).toEqual({
      termoOriginal: "Ácido Clorídrico",
      termoBuscado: "Hydrochloric acid",
      traduzido: true,
    });
    expect(traduzirTermoPubChem("Hidróxido de Sódio")).toEqual({
      termoOriginal: "Hidróxido de Sódio",
      termoBuscado: "Sodium hydroxide",
      traduzido: true,
    });
    expect(traduzirTermoPubChem("Dióxido de Titânio")).toEqual({
      termoOriginal: "Dióxido de Titânio",
      termoBuscado: "Titanium dioxide",
      traduzido: true,
    });
    expect(traduzirTermoPubChem("alumina")).toEqual({
      termoOriginal: "alumina",
      termoBuscado: "Aluminum oxide",
      traduzido: true,
    });
    expect(traduzirTermoPubChem("BaCO3")).toEqual({
      termoOriginal: "BaCO3",
      termoBuscado: "BaCO3",
      traduzido: false,
    });
    expect(traduzirTermoPubChem("Citric acid")).toEqual({
      termoOriginal: "Citric acid",
      termoBuscado: "Citric acid",
      traduzido: false,
    });
  });
});
