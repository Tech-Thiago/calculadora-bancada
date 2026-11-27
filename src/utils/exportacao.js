export const RESOLUCAO_BALANCA_PADRAO = "0.0001";

export const OPCOES_RESOLUCAO_BALANCA = [
  { valor: "0.0001", label: "Analítica (0,0001 g)" },
  { valor: "0.001", label: "Precisão (0,001 g)" },
  { valor: "0.01", label: "Semi-analítica (0,01 g)" },
];

function escaparCsv(valor) {
  return `"${String(valor ?? "").replace(/"/g, '""')}"`;
}

function normalizarMetaFicha(meta) {
  return {
    laboratorio: typeof meta?.laboratorio === "string" ? meta.laboratorio : "",
    lote: typeof meta?.lote === "string" ? meta.lote : "",
    responsavel: typeof meta?.responsavel === "string" ? meta.responsavel : "",
  };
}

function normalizarResolucao(resolucao) {
  if (resolucao === undefined || resolucao === null || resolucao === "") {
    return RESOLUCAO_BALANCA_PADRAO;
  }
  return String(resolucao);
}

export function formatarResolucaoBalanca(resolucao) {
  const valor = normalizarResolucao(resolucao);
  const encontrada = OPCOES_RESOLUCAO_BALANCA.find((o) => o.valor === valor);
  return encontrada ? encontrada.label : `${valor} g`;
}

/**
 * Exporta formulação em CSV compatível com Excel em português (separador ";" e BOM UTF-8).
 */
export function exportarCSV(payload, opcoes = {}) {
  const meta = normalizarMetaFicha(opcoes.metaFicha ?? payload.metaFicha);
  const resolucao = normalizarResolucao(opcoes.resolucaoBalanca ?? payload.resolucaoBalanca);

  const cabecalhoMeta = [
    [escaparCsv("Título"), escaparCsv(payload.titulo || "")].join(";"),
    [escaparCsv("Subtítulo"), escaparCsv(payload.subtitulo || "")].join(";"),
    [escaparCsv("Laboratório"), escaparCsv(meta.laboratorio)].join(";"),
    [escaparCsv("Amostra / Lote"), escaparCsv(meta.lote)].join(";"),
    [escaparCsv("Responsável"), escaparCsv(meta.responsavel)].join(";"),
    [escaparCsv("Resolução da balança"), escaparCsv(formatarResolucaoBalanca(resolucao))].join(";"),
    [escaparCsv("Data de emissão"), escaparCsv(new Date().toLocaleString("pt-BR"))].join(";"),
  ];

  const cabecalho = ["Item", "Quantidade", "Detalhes", "Alertas"];
  const linhas = payload.itens.map((item) => {
    const valor = item.valorDisplay ?? `${Number(item.massaG).toFixed(4)} g`;
    const alertas = item.alertas?.length ? item.alertas.join(" | ") : "";
    return [
      escaparCsv(item.nome),
      escaparCsv(valor),
      escaparCsv(item.detalhe),
      escaparCsv(alertas),
    ].join(";");
  });

  const csv = [
    ...cabecalhoMeta,
    "",
    cabecalho.join(";"),
    ...linhas,
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ficha-bancada-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Codifica a formulação na URL para envio rápido via WhatsApp.
 */
export function gerarLinkCompartilhamento(payload, opcoes = {}) {
  const meta = normalizarMetaFicha(opcoes.metaFicha ?? payload.metaFicha);
  const resolucao = normalizarResolucao(opcoes.resolucaoBalanca ?? payload.resolucaoBalanca);

  const compacto = {
    t: payload.titulo,
    s: payload.subtitulo || "",
    r: resolucao,
    m: {
      l: meta.laboratorio,
      b: meta.lote,
      p: meta.responsavel,
    },
    i: payload.itens.map((item) => ({
      n: item.nome,
      m: item.massaG ?? null,
      v: item.valorDisplay ?? null,
      d: item.detalhe || "",
      a: item.alertas || [],
    })),
  };

  const json = JSON.stringify(compacto);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const url = new URL(window.location.href);
  url.search = `?f=${b64}`;
  return url.toString();
}

/**
 * Lê uma formulação compartilhada na URL (?f=...) ao abrir a página.
 */
export function lerLinkCompartilhado() {
  try {
    const params = new URLSearchParams(window.location.search);
    const f = params.get("f");
    if (!f) return null;

    const b64Raw = f.replace(/-/g, "+").replace(/_/g, "/");
    const b64 = b64Raw.padEnd(b64Raw.length + ((4 - (b64Raw.length % 4)) % 4), "=");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const dados = JSON.parse(json);

    if (!dados || !Array.isArray(dados.i)) return null;

    const metaFicha = normalizarMetaFicha({
      laboratorio: dados.m?.l,
      lote: dados.m?.b,
      responsavel: dados.m?.p,
    });
    const resolucaoBalanca = normalizarResolucao(dados.r);

    return {
      titulo: dados.t || "Formulação Compartilhada",
      subtitulo: dados.s || "",
      metaFicha,
      resolucaoBalanca,
      itens: dados.i.map((item, idx) => ({
        id: `shared-${idx}`,
        nome: item.n,
        massaG: item.m,
        valorDisplay: item.v,
        detalhe: item.d,
        alertas: item.a || [],
      })),
    };
  } catch {
    return null;
  }
}
