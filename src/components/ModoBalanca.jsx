import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  X,
  RotateCcw,
  AlertTriangle,
  Moon,
  Sun,
  Download,
  Printer,
  Share2,
  Check,
  List,
  Focus,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  RESOLUCAO_BALANCA_PADRAO,
  OPCOES_RESOLUCAO_BALANCA,
  formatarResolucaoBalanca,
  calcularDesvioMassa,
} from "../utils/exportacao";

function BadgeDesvio({ desvio, grande = false }) {
  if (!desvio) return null;
  const sinal = desvio.desvioPct >= 0 ? "+" : "";
  const classesCor = desvio.dentroTolerancia
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
    : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/25";

  return (
    <span
      className={`inline-flex items-center font-mono font-bold border rounded-full ${classesCor} ${
        grande ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      }`}
    >
      Desvio: {sinal}
      {desvio.desvioPct.toFixed(2)}%
    </span>
  );
}

export default function ModoBalanca({
  dadosBalanca,
  marcados,
  massasReais,
  onAlternarItem,
  onMarcarPesado,
  onAtualizarMassaReal,
  onLimpar,
  onFechar,
  onCopiarLink,
  onExportarCSV,
  linkCopiado,
  wakeLockAtivo,
  resolucaoBalanca,
  onChangeResolucao,
  metaFicha,
  onChangeMetaFicha,
  modoEscuro,
  onAlternarTema,
  dataBasePubChem,
}) {
  const [modoVisualizacao, setModoVisualizacao] = useState("lista");
  const [indiceFoco, setIndiceFoco] = useState(0);

  const itens = dadosBalanca.itens || [];
  const totalItens = itens.length;
  const totalMarcados = itens.filter((i) => marcados[i.id]).length;
  const progressoPct = totalItens > 0 ? (totalMarcados / totalItens) * 100 : 0;
  const minResG = Number(resolucaoBalanca) || Number(RESOLUCAO_BALANCA_PADRAO);

  const indiceSeguro = totalItens > 0 ? Math.min(indiceFoco, totalItens - 1) : 0;
  const itemFoco = itens[indiceSeguro] || null;

  function irParaProximoPendente(atualIdx) {
    if (totalItens === 0) return;
    for (let offset = 1; offset <= totalItens; offset++) {
      const idx = (atualIdx + offset) % totalItens;
      if (!marcados[itens[idx].id]) {
        setIndiceFoco(idx);
        return;
      }
    }
    setIndiceFoco((atualIdx + 1) % totalItens);
  }

  function handlePeseiProximo() {
    if (!itemFoco) return;
    onMarcarPesado(itemFoco.id);
    if (totalItens > 1) {
      irParaProximoPendente(indiceSeguro);
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#0b0d12] text-slate-900 dark:text-slate-50 px-4 py-8 sm:px-8 print-ficha">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#141720] border border-slate-200/80 dark:border-white/10 p-6 shadow-sm dark:shadow-2xl space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                <span>Modo Balança</span>
                <span>•</span>
                <span className="font-mono">
                  {totalMarcados}/{totalItens}
                </span>
                {wakeLockAtivo && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 dark:text-emerald-300">Tela ativa</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3 text-slate-900 dark:text-white">
                {dadosBalanca.titulo}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{dadosBalanca.subtitulo}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 no-print">
              <button
                type="button"
                onClick={onAlternarTema}
                title={modoEscuro ? "Modo Claro" : "Modo Escuro"}
                className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition cursor-pointer"
              >
                {modoEscuro ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
              <button
                type="button"
                onClick={onCopiarLink}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition cursor-pointer"
              >
                {linkCopiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                {linkCopiado ? "Copiado" : "Link"}
              </button>
              <button
                type="button"
                onClick={onExportarCSV}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  onLimpar();
                  setIndiceFoco(0);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Limpar
              </button>
              <button
                type="button"
                onClick={onFechar}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-4 py-2 text-xs font-bold hover:opacity-90 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Fechar
              </button>
            </div>
          </div>

          {/* Seletor de visualizacao (Lista completa vs Modo Foco) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-white/10 no-print">
            <div className="inline-grid grid-cols-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setModoVisualizacao("lista")}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  modoVisualizacao === "lista"
                    ? "bg-white dark:bg-indigo-500 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" /> Lista completa
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacao("foco")}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  modoVisualizacao === "foco"
                    ? "bg-white dark:bg-indigo-500 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Focus className="w-3.5 h-3.5" /> Modo Foco
              </button>
            </div>

            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {totalMarcados === totalItens && totalItens > 0
                ? "Todos os itens conferidos"
                : `${totalItens - totalMarcados} pendente(s)`}
            </span>
          </div>

          {/* Resolucao da balanca e campos da ficha PDF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10 no-print">
            <div className="md:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Resolução da balança
              </label>
              <select
                value={resolucaoBalanca}
                onChange={(e) => onChangeResolucao(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 pl-3 pr-8 py-2 text-xs font-medium tabular-nums text-slate-900 dark:text-white"
              >
                {OPCOES_RESOLUCAO_BALANCA.map((op) => (
                  <option key={op.valor} value={op.valor}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Laboratório
              </label>
              <input
                type="text"
                placeholder="Ex: LabNano / FCT"
                value={metaFicha.laboratorio}
                onChange={(e) => onChangeMetaFicha((p) => ({ ...p, laboratorio: e.target.value }))}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Amostra / Lote
              </label>
              <input
                type="text"
                placeholder="Ex: BTO-02"
                value={metaFicha.lote}
                onChange={(e) => onChangeMetaFicha((p) => ({ ...p, lote: e.target.value }))}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Responsável
              </label>
              <input
                type="text"
                placeholder="Nome do operador"
                value={metaFicha.responsavel}
                onChange={(e) => onChangeMetaFicha((p) => ({ ...p, responsavel: e.target.value }))}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Cabecalho oficial somente na impressao (PDF) */}
          <div className="hidden print:block pt-3 border-t border-slate-300 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <span className="font-bold uppercase tracking-wider">
                LabCalc · Ficha Técnica de Bancada
              </span>
              <span className="font-mono">
                Emissão: {new Date().toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="block text-[10px] uppercase tracking-wide opacity-70">Laboratório</span>
                <span className="font-semibold">{metaFicha.laboratorio || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wide opacity-70">Amostra / Lote</span>
                <span className="font-semibold">{metaFicha.lote || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wide opacity-70">Responsável</span>
                <span className="font-semibold">{metaFicha.responsavel || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wide opacity-70">Resolução da balança</span>
                <span className="font-semibold font-mono">{formatarResolucaoBalanca(resolucaoBalanca)}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px]">
              <span>Base científica PubChem (NIH): {dataBasePubChem}</span>
              <span className="font-mono">Itens conferidos: {totalMarcados}/{totalItens}</span>
            </div>
          </div>

          <div className="h-2.5 w-full bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden no-print">
            <div
              style={{ width: `${progressoPct}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
            />
          </div>
        </div>

        {/* MODO FOCO (1 item por vez, otimizado para uso com luva) */}
        {modoVisualizacao === "foco" && itemFoco && (() => {
          const feitoFoco = !!marcados[itemFoco.id];
          const valorTextoFoco = itemFoco.valorDisplay ?? `${Number(itemFoco.massaG).toFixed(4)} g`;
          const massaNumericaFoco = typeof itemFoco.massaG === "number" ? itemFoco.massaG : null;
          const temMassaFoco = massaNumericaFoco !== null && massaNumericaFoco > 0;
          const abaixoResolucaoFoco = temMassaFoco && massaNumericaFoco < minResG;
          const desvioFoco = temMassaFoco
            ? calcularDesvioMassa(massaNumericaFoco, massasReais[itemFoco.id])
            : null;

          return (
            <div className="rounded-3xl bg-white dark:bg-[#141720] border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-sm dark:shadow-2xl space-y-6 no-print">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  Item {indiceSeguro + 1} de {totalItens}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                    feitoFoco
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {feitoFoco ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  {feitoFoco ? "Pesado" : "Aguardando pesagem"}
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {itemFoco.nome}
                </h2>
                {itemFoco.detalhe && (
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">{itemFoco.detalhe}</p>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0b0d12] border border-slate-200/80 dark:border-white/10 text-center space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Meta na balança
                </span>
                <div className="text-5xl sm:text-6xl font-mono font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {valorTextoFoco}
                </div>
              </div>

              {(abaixoResolucaoFoco || itemFoco.alertas?.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {abaixoResolucaoFoco && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/15 px-3.5 py-1.5 rounded-full">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Massa abaixo da resolução ({minResG} g) — considere aumentar a batelada ou usar solução estoque
                    </div>
                  )}
                  {itemFoco.alertas?.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/15 px-3.5 py-1.5 rounded-full">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {itemFoco.alertas.join(" · ")}
                    </div>
                  )}
                </div>
              )}

              {temMassaFoco && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0b0d12] border border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Massa real pesada (g) — opcional
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      placeholder={massaNumericaFoco.toFixed(4)}
                      value={massasReais[itemFoco.id] || ""}
                      onChange={(e) => onAtualizarMassaReal(itemFoco.id, e.target.value)}
                      className="w-full rounded-xl bg-white dark:bg-[#141720] border border-slate-300 dark:border-white/15 px-4 py-3 text-base font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="pt-4 sm:pt-5">
                    <BadgeDesvio desvio={desvioFoco} grande />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIndiceFoco((i) => (i - 1 + totalItens) % totalItens)}
                  disabled={totalItens <= 1}
                  className="sm:col-span-3 min-h-[54px] inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Anterior
                </button>

                <button
                  type="button"
                  onClick={handlePeseiProximo}
                  className="sm:col-span-6 min-h-[56px] inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white px-6 py-3.5 text-base font-extrabold shadow-sm transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {totalItens > 1 ? "Pesei → Próximo" : "Marcar como pesado"}
                </button>

                <button
                  type="button"
                  onClick={() => setIndiceFoco((i) => (i + 1) % totalItens)}
                  disabled={totalItens <= 1}
                  className="sm:col-span-3 min-h-[54px] inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* LISTA COMPLETA (sempre visivel na impressao) */}
        <div className={modoVisualizacao === "foco" ? "hidden print:block space-y-3" : "space-y-3"}>
          {itens.map((item) => {
            const feito = !!marcados[item.id];
            const valorTexto = item.valorDisplay ?? `${Number(item.massaG).toFixed(4)} g`;
            const massaNumerica = typeof item.massaG === "number" ? item.massaG : null;
            const temMassa = massaNumerica !== null && massaNumerica > 0;
            const abaixoResolucao = temMassa && massaNumerica < minResG;
            const desvio = temMassa ? calcularDesvioMassa(massaNumerica, massasReais[item.id]) : null;

            return (
              <div
                key={item.id}
                className={`rounded-3xl border transition-all p-5 sm:p-6 space-y-4 ${
                  feito
                    ? "bg-white/70 dark:bg-[#141720]/55 border-emerald-500/40 opacity-75"
                    : "bg-white dark:bg-[#141720] border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-lg"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onAlternarItem(item.id)}
                  className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {feito ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <Circle className="w-7 h-7 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <div>
                      <div
                        className={`text-lg sm:text-xl font-bold ${
                          feito
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {item.nome}
                      </div>
                      {item.detalhe && (
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          {item.detalhe}
                        </div>
                      )}
                      {abaixoResolucao && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full mt-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Massa abaixo da resolução ({minResG} g) — considere aumentar a batelada ou usar solução estoque
                        </div>
                      )}
                      {item.alertas?.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full mt-2 ml-0 sm:ml-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {item.alertas.join(" · ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-tight shrink-0 self-end sm:self-center tabular-nums">
                    {valorTexto}
                  </div>
                </button>

                {temMassa && (
                  <>
                    <div className="pt-3 border-t border-slate-200/70 dark:border-white/8 flex flex-wrap items-center justify-between gap-3 no-print">
                      <div className="flex items-center gap-2.5 flex-1 min-w-[210px]">
                        <label
                          htmlFor={`massa-real-${item.id}`}
                          className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0"
                        >
                          Massa real (g):
                        </label>
                        <input
                          id={`massa-real-${item.id}`}
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          placeholder={massaNumerica.toFixed(4)}
                          value={massasReais[item.id] || ""}
                          onChange={(e) => onAtualizarMassaReal(item.id, e.target.value)}
                          className="w-36 rounded-xl bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-mono font-semibold text-slate-900 dark:text-white"
                        />
                      </div>
                      <BadgeDesvio desvio={desvio} />
                    </div>

                    {desvio && (
                      <div className="hidden print:flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-mono">
                        <span>Massa real pesada: {desvio.massaRealG.toFixed(4)} g</span>
                        <span>
                          Desvio: {desvio.desvioPct >= 0 ? "+" : ""}
                          {desvio.desvioPct.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
