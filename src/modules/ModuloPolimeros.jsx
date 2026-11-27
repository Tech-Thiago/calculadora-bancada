import { useMemo, useState } from "react";
import { Plus, Trash2, Scale } from "lucide-react";
import { calcularPolimero, SISTEMAS_RESINA_PRESET } from "../utils/calculoPolimeros";
import BarraProporcao from "../components/BarraProporcao";
import { TEMAS_MODULO } from "../utils/temaModulos";

const tema = TEMAS_MODULO.polimeros;

export default function ModuloPolimeros({ onAbrirModoBalanca }) {
  const [modo, setModo] = useState("estequiometrico");
  const [resinaNome, setResinaNome] = useState("Resina Epóxi DGEBA");
  const [resinaPureza, setResinaPureza] = useState("100");
  const [resinaDensidade, setResinaDensidade] = useState("1.16");
  const [endurecedorNome, setEndurecedorNome] = useState("Endurecedor TETA");
  const [endurecedorPureza, setEndurecedorPureza] = useState("97");
  const [endurecedorDensidade, setEndurecedorDensidade] = useState("0.98");
  const [eew, setEew] = useState("190");
  const [ahew, setAhew] = useState("24");
  const [phrManual, setPhrManual] = useState("50");
  const [alvoTipo, setAlvoTipo] = useState("total");
  const [massaAlvoG, setMassaAlvoG] = useState("100");
  const [perdaPct, setPerdaPct] = useState("5");
  const [aditivos, setAditivos] = useState([
    { id: "ad-1", nome: "Sílica Pirogênica (tixotrópico)", phr: "2", purezaPct: "99.8", densidade: "2.20" },
  ]);

  function aplicarPreset(nomePreset) {
    const p = SISTEMAS_RESINA_PRESET.find((s) => s.nome === nomePreset);
    if (!p) return;
    setModo(p.modo);
    setResinaNome(p.resinaNome);
    setResinaPureza(p.resinaPureza);
    setResinaDensidade(p.resinaDensidade);
    setEndurecedorNome(p.endurecedorNome);
    setEndurecedorPureza(p.endurecedorPureza);
    setEndurecedorDensidade(p.endurecedorDensidade);
    setEew(p.eew);
    setAhew(p.ahew);
    setPhrManual(p.phrManual);
  }

  function adicionarAditivo() {
    setAditivos((prev) => [
      ...prev,
      { id: `ad-${Date.now()}`, nome: "Carga / Aditivo", phr: "1", purezaPct: "100", densidade: "1.50" },
    ]);
  }

  function atualizarAditivo(id, campo, valor) {
    setAditivos((prev) => prev.map((a) => (a.id === id ? { ...a, [campo]: valor } : a)));
  }

  function removerAditivo(id) {
    setAditivos((prev) => prev.filter((a) => a.id !== id));
  }

  const resultado = useMemo(
    () =>
      calcularPolimero({
        modo,
        resinaNome,
        resinaPureza,
        resinaDensidade,
        endurecedorNome,
        endurecedorPureza,
        endurecedorDensidade,
        eew,
        ahew,
        phrManual,
        massaAlvoG,
        alvoTipo,
        perdaPct,
        aditivos,
      }),
    [
      modo,
      resinaNome,
      resinaPureza,
      resinaDensidade,
      endurecedorNome,
      endurecedorPureza,
      endurecedorDensidade,
      eew,
      ahew,
      phrManual,
      massaAlvoG,
      alvoTipo,
      perdaPct,
      aditivos,
    ]
  );

  function handleModoBalanca() {
    if (!resultado.valido) return;
    onAbrirModoBalanca({
      titulo: `Polímeros e Resinas (${resinaNome})`,
      subtitulo: `Total: ${resultado.massaTotalG.toFixed(4)} g${
        resultado.volumeTotalMl ? ` · Vol. est.: ${resultado.volumeTotalMl.toFixed(2)} mL` : ""
      } · Endurecedor: ${resultado.phrEndurecedor.toFixed(2)} phr`,
      itens: resultado.itens.map((item) => ({
        id: item.id,
        nome: item.nome,
        massaG: item.massaG,
        detalhe: `${item.phr.toFixed(2)} phr · ${item.wtPct.toFixed(2)}% wt · Pureza ${item.purezaPct}%${
          item.volumeMl ? ` · ~${item.volumeMl.toFixed(2)} mL` : ""
        }`,
      })),
    });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* COLUNA ESQUERDA */}
      <div className="xl:col-span-7 space-y-5">
        <section className="bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Sistema resina / endurecedor</h3>
            <div className="grid grid-cols-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setModo("estequiometrico")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
                  modo === "estequiometrico"
                    ? tema.pillAtiva
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                EEW / AHEW
              </button>
              <button
                type="button"
                onClick={() => setModo("phr")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
                  modo === "phr"
                    ? tema.pillAtiva
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                PHR direto
              </button>
            </div>
          </div>

          {/* Resina Base */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-50">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Resina base (100 phr)</label>
              <input
                type="text"
                value={resinaNome}
                onChange={(e) => setResinaNome(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-medium"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Pureza (%)</label>
              <input
                type="number"
                step="any"
                min="0.1"
                max="100"
                value={resinaPureza}
                onChange={(e) => setResinaPureza(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-mono font-semibold"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">ρ (g/cm³)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={resinaDensidade}
                onChange={(e) => setResinaDensidade(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-mono font-semibold"
              />
            </div>
          </div>

          {/* Endurecedor */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-50">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Endurecedor / Iniciador</label>
              <input
                type="text"
                value={endurecedorNome}
                onChange={(e) => setEndurecedorNome(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-medium"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Pureza (%)</label>
              <input
                type="number"
                step="any"
                min="0.1"
                max="100"
                value={endurecedorPureza}
                onChange={(e) => setEndurecedorPureza(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-mono font-semibold"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">ρ (g/cm³)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={endurecedorDensidade}
                onChange={(e) => setEndurecedorDensidade(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-mono font-semibold"
              />
            </div>
          </div>

          {modo === "estequiometrico" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">EEW da resina (g/eq)</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={eew}
                  onChange={(e) => setEew(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">AHEW do endurecedor (g/eq)</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={ahew}
                  onChange={(e) => setAhew(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Proporção do endurecedor (phr — partes por 100 de resina)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={phrManual}
                onChange={(e) => setPhrManual(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Meta baseada em</label>
              <select
                value={alvoTipo}
                onChange={(e) => setAlvoTipo(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold"
              >
                <option value="total">Massa total</option>
                <option value="resina">Massa de resina</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Massa alvo (g)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={massaAlvoG}
                onChange={(e) => setMassaAlvoG(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Margem de perda (%)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={perdaPct}
                onChange={(e) => setPerdaPct(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-medium text-slate-400 mr-1">Exemplos:</span>
            {SISTEMAS_RESINA_PRESET.map((p) => (
              <button
                key={p.nome}
                type="button"
                onClick={() => aplicarPreset(p.nome)}
                className={`px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 transition cursor-pointer ${tema.chipHover}`}
              >
                {p.nome}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Aditivos e cargas (em phr)</h3>
            <button
              type="button"
              onClick={adicionarAditivo}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${tema.botaoSecundario}`}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>

          {aditivos.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum aditivo adicionado (apenas resina + endurecedor).</p>
          ) : (
            <div className="space-y-3">
              {aditivos.map((ad) => (
                <div
                  key={ad.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-4 bg-slate-50"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Nome</label>
                    <input
                      type="text"
                      value={ad.nome}
                      onChange={(e) => atualizarAditivo(ad.id, "nome", e.target.value)}
                      className="w-full px-3 py-2 text-sm font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">phr</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={ad.phr}
                      onChange={(e) => atualizarAditivo(ad.id, "phr", e.target.value)}
                      className="w-full px-2.5 py-2 text-sm font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Pur. (%)</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      max="100"
                      value={ad.purezaPct}
                      onChange={(e) => atualizarAditivo(ad.id, "purezaPct", e.target.value)}
                      className="w-full px-2.5 py-2 text-sm font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">ρ (g/cm³)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={ad.densidade}
                      onChange={(e) => atualizarAditivo(ad.id, "densidade", e.target.value)}
                      className="w-full px-2.5 py-2 text-sm font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end pt-2 sm:pt-5">
                    <button
                      type="button"
                      onClick={() => removerAditivo(ad.id)}
                      title="Remover"
                      className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* COLUNA DIREITA: RESUMO BENTO */}
      <div className="xl:col-span-5 xl:sticky xl:top-5">
        {!resultado.valido ? (
          <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-sm font-medium">
            {resultado.erro}
          </div>
        ) : (
          <aside className="bg-white p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Formulação</span>
              <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border ${tema.headerBadge}`}>
                {resultado.somaPhr.toFixed(1)} phr total
              </span>
            </div>

            <div className={`p-5 rounded-2xl ${tema.visorContainer}`}>
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${tema.visorLabel}`}>
                Massa total a pesar (corrigida por pureza)
              </span>
              <div className="text-4xl font-mono font-extrabold tracking-tight text-slate-900 mt-1.5 tabular-nums">
                {resultado.massaTotalG.toFixed(4)}
                <span className="text-lg font-semibold text-slate-400 ml-1.5">g</span>
              </div>

              <div className={`grid grid-cols-3 gap-3 mt-4 pt-4 border-t ${tema.visorDivisor}`}>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">Endurecedor</span>
                  <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                    {resultado.phrEndurecedor.toFixed(2)} phr
                  </span>
                </div>
                {resultado.razaoResinaEnd && (
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500">Resina : End.</span>
                    <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                      {resultado.razaoResinaEnd.toFixed(2)} : 1
                    </span>
                  </div>
                )}
                {resultado.volumeTotalMl && (
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500">Vol. estimado</span>
                    <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                      {resultado.volumeTotalMl.toFixed(1)} mL
                    </span>
                  </div>
                )}
              </div>
            </div>

            <BarraProporcao
              titulo="Distribuição em massa (% wt)"
              segmentos={resultado.itens.map((i) => ({ id: i.id, nome: i.nome, pct: i.wtPct }))}
            />

            <div className="space-y-2 pt-1">
              {resultado.itens.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{item.nome}</div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {item.phr.toFixed(2)} phr · {item.wtPct.toFixed(2)}% wt · Pur. {item.purezaPct}%
                      {item.volumeMl ? ` · ~${item.volumeMl.toFixed(2)} mL` : ""}
                    </div>
                  </div>
                  <div className={`font-mono text-base font-extrabold shrink-0 tabular-nums ${tema.valorItem}`}>
                    {item.massaG.toFixed(4)} g
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleModoBalanca}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition cursor-pointer ${tema.botaoPrimario}`}
            >
              <Scale className="w-4 h-4" /> Abrir Modo Balança
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}
