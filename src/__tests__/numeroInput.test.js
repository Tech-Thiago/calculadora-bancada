import { describe, expect, test } from "vitest";
import { sanitizarNumeroDecimal, parseNumeroBr } from "../utils/numeroInput";

describe("numeroInput (suporte pt-BR com virgula decimal)", () => {
  test("sanitizarNumeroDecimal preserva entradas parciais como 0, e 1, e remove caracteres invalidos", () => {
    expect(sanitizarNumeroDecimal("0,")).toBe("0,");
    expect(sanitizarNumeroDecimal("1,")).toBe("1,");
    expect(sanitizarNumeroDecimal("0.")).toBe("0.");
    expect(sanitizarNumeroDecimal("12,34")).toBe("12,34");
    expect(sanitizarNumeroDecimal("12.34")).toBe("12.34");
    expect(sanitizarNumeroDecimal("1,2,3")).toBe("1,23");
    expect(sanitizarNumeroDecimal("1.2,3")).toBe("1.23");
    expect(sanitizarNumeroDecimal("abc12,5xyz")).toBe("12,5");
    expect(sanitizarNumeroDecimal("-5,2")).toBe("5,2");
    expect(sanitizarNumeroDecimal("-5,2", { permitirNegativo: true })).toBe("-5,2");
  });

  test("sanitizarNumeroDecimal com apenasInteiro aceita apenas digitos", () => {
    expect(sanitizarNumeroDecimal("12,5", { apenasInteiro: true })).toBe("125");
    expect(sanitizarNumeroDecimal("10a0", { apenasInteiro: true })).toBe("100");
  });

  test("parseNumeroBr converte virgula decimal para numero JS com fallback seguro", () => {
    expect(parseNumeroBr("0,")).toBe(0);
    expect(parseNumeroBr("1,")).toBe(1);
    expect(parseNumeroBr("0,5")).toBeCloseTo(0.5, 6);
    expect(parseNumeroBr("12,345")).toBeCloseTo(12.345, 6);
    expect(parseNumeroBr("12.345")).toBeCloseTo(12.345, 6);
    expect(parseNumeroBr("", 0)).toBe(0);
    expect(parseNumeroBr(",", 0)).toBe(0);
    expect(Number.isNaN(parseNumeroBr(""))).toBe(true);
  });
});
