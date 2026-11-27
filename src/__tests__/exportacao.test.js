import { describe, expect, test } from "vitest";
import {
  calcularDesvioMassa,
  gerarConteudoCSV,
  RESOLUCAO_BALANCA_PADRAO,
} from "../utils/exportacao";

describe("exportacao e rastreabilidade de massa real", () => {
  test("calcularDesvioMassa calcula desvio percentual e tolerancia de 1%", () => {
    const ok = calcularDesvioMassa(10, "10.05");
    expect(ok).not.toBeNull();
    expect(ok.massaRealG).toBeCloseTo(10.05, 4);
    expect(ok.desvioPct).toBeCloseTo(0.5, 4);
    expect(ok.dentroTolerancia).toBe(true);

    const fora = calcularDesvioMassa(10, "9,80");
    expect(fora).not.toBeNull();
    expect(fora.massaRealG).toBeCloseTo(9.8, 4);
    expect(fora.desvioPct).toBeCloseTo(-2.0, 4);
    expect(fora.dentroTolerancia).toBe(false);

    expect(calcularDesvioMassa(10, "")).toBeNull();
    expect(calcularDesvioMassa(null, "10")).toBeNull();
  });

  test("gerarConteudoCSV inclui metaFicha, resolucao, massa real e desvio percentual", () => {
    const csv = gerarConteudoCSV(
      {
        titulo: "Síntese BaTiO3",
        subtitulo: "Teste de bancada",
        itens: [
          { id: "ba", nome: "BaCO3", massaG: 8.5481, detalhe: "99%", alertas: ["toxico"] },
          { id: "ti", nome: "TiO2", massaG: 3.442, detalhe: "99.5%", alertas: [] },
        ],
      },
      {
        metaFicha: { laboratorio: "LabNano", lote: "BTO-02", responsavel: "Thiago" },
        resolucaoBalanca: RESOLUCAO_BALANCA_PADRAO,
        massasReais: { ba: "8.5500" },
      }
    );

    expect(csv).toContain('"Laboratório";"LabNano"');
    expect(csv).toContain('"Amostra / Lote";"BTO-02"');
    expect(csv).toContain('"Responsável";"Thiago"');
    expect(csv).toContain('"Resolução da balança";"Analítica (0,0001 g)"');
    expect(csv).toContain("Item;Quantidade;Massa Real (g);Desvio (%);Detalhes;Alertas");
    expect(csv).toContain('"BaCO3";"8.5481 g";"8.5500";"+0.02%";"99%";"toxico"');
    expect(csv).toContain('"TiO2";"3.4420 g";"";"";"99.5%";""');
  });
});
