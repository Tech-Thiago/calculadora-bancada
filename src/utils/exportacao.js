/**
 * Exporta formulação em CSV compatível com Excel em português (separador ";" e BOM UTF-8).
 */
export function exportarCSV(payload) {
  const cabecalho = ["Item", "Quantidade", "Detalhes", "Alertas"];
  const linhas = payload.itens.map((item) => {
    const valor = item.valorDisplay ?? `${Number(item.massaG).toFixed(4)} g`;
    const alertas = item.alertas?.length ? item.alertas.join(" | ") : "";
    return [
      `"${String(item.nome || "").replace(/"/g, '""')}"`,
      `"${valor}"`,
      `"${String(item.detalhe || "").replace(/"/g, '""')}"`,
      `"${alertas}"`,
    ].join(";");
  });

  const csv = [
    `"${payload.titulo}"`,
    `"${payload.subtitulo || ""}"`,
    `"Data: ${new Date().toLocaleString("pt-BR")}"`,
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
export function gerarLinkCompartilhamento(payload) {
  const compacto = {
    t: payload.titulo,
    s: payload.subtitulo || "",
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

    const b64 = f.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const dados = JSON.parse(json);

    if (!dados || !Array.isArray(dados.i)) return null;

    return {
      titulo: dados.t || "Formulação Compartilhada",
      subtitulo: dados.s || "",
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
