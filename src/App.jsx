import { useEffect, useState } from "react";
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
  Database,
  Check,
  Layers,
  Droplet,
  Flame,
  FlaskConical,
  Cpu,
  Beaker,
} from "lucide-react";
import ModuloCompositos from "./modules/ModuloCompositos";
import ModuloPolimeros from "./modules/ModuloPolimeros";
import ModuloCeramica from "./modules/ModuloCeramica";
import ModuloSolucoes from "./modules/ModuloSolucoes";
import ModuloMetais from "./modules/ModuloMetais";
import PainelDados from "./components/PainelDados";
import { adicionarHistorico } from "./utils/storage";
import { exportarCSV, gerarLinkCompartilhamento, lerLinkCompartilhado } from "./utils/exportacao";

const MODULOS = [
  { id: "compositos", nome: "Compósitos e Blendas", desc: "Conversão % wt ↔ % vol e densidade teórica", icon: Layers },
  { id: "polimeros", nome: "Polímeros e Resinas", desc: "Formulação em phr, EEW / AHEW e cargas", icon: Droplet },
  { id: "ceramica", nome: "Síntese Cerâmica", desc: "Estequiometria de precursores e dopagem", icon: Flame },
  { id: "solucoes", nome: "Soluções e Diluições", desc: "Sólidos, líquidos P.A. e diluição C₁V₁", icon: FlaskConical },
  { id: "metais", nome: "Metais e Ligas", desc: "Conversão % at. ↔ % wt. e rendimento de fusão", icon: Cpu },
];

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState("compositos");
  const [dadosBalanca, setDadosBalanca] = useState(() => lerLinkCompartilhado());
  const [marcados, setMarcados] = useState({});
  const [painelDadosAberto, setPainelDadosAberto] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [wakeLockAtivo, setWakeLockAtivo] = useState(false);

  const [modoEscuro, setModoEscuro] = useState(() => {
    const salvo = localStorage.getItem("calc_bancada_tema");
    return salvo ? salvo === "dark" : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (modoEscuro) {
      root.classList.add("dark");
      localStorage.setItem("calc_bancada_tema", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("calc_bancada_tema", "light");
    }
  }, [modoEscuro]);

  useEffect(() => {
    let lock = null;
    async function ativarWakeLock() {
      if (!dadosBalanca || !("wakeLock" in navigator)) return;
      try {
        lock = await navigator.wakeLock.request("screen");
        setWakeLockAtivo(true);
      } catch {
        setWakeLockAtivo(false);
      }
    }
    ativarWakeLock();
    return () => {
      if (lock) {
        lock.release().catch(() => {});
        setWakeLockAtivo(false);
      }
    };
  }, [dadosBalanca]);

  function abrirModoBalanca(payload, salvarNoHistorico = true) {
    setMarcados({});
    setLinkCopiado(false);
    if (salvarNoHistorico) {
      adicionarHistorico(payload);
    }
    setDadosBalanca(payload);
  }

  function alternarItem(id) {
    setMarcados((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function copiarLinkWhatsApp() {
    if (!dadosBalanca) return;
    const link = gerarLinkCompartilhamento(dadosBalanca);
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2500);
    } catch {
      window.prompt("Copie o link para compartilhar:", link);
    }
  }

  // MODO BALANCA (Cartoes grandes e arredondados)
  if (dadosBalanca) {
    const totalItens = dadosBalanca.itens.length;
    const totalMarcados = dadosBalanca.itens.filter((i) => marcados[i.id]).length;
    const progressoPct = totalItens > 0 ? (totalMarcados / totalItens) * 100 : 0;

    return (
      <div className="min-h-screen bg-[#0b0d12] text-slate-50 px-4 py-8 sm:px-8 print-ficha">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-3xl bg-[#141720] border border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/20">
                  <span>Modo Balança</span>
                  <span>•</span>
                  <span className="font-mono">
                    {totalMarcados}/{totalItens}
                  </span>
                  {wakeLockAtivo && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-300">Tela ativa</span>
                    </>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3">
                  {dadosBalanca.titulo}
                </h1>
                <p className="text-sm text-slate-400 mt-1">{dadosBalanca.subtitulo}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={copiarLinkWhatsApp}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                >
                  {linkCopiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  {linkCopiado ? "Copiado" : "Link"}
                </button>
                <button
                  type="button"
                  onClick={() => exportarCSV(dadosBalanca)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => setMarcados({})}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Limpar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.history.replaceState({}, "", window.location.pathname);
                    setDadosBalanca(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white text-slate-950 px-4 py-2 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Fechar
                </button>
              </div>
            </div>

            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden no-print">
              <div
                style={{ width: `${progressoPct}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-3">
            {dadosBalanca.itens.map((item) => {
              const feito = !!marcados[item.id];
              const valorTexto = item.valorDisplay ?? `${Number(item.massaG).toFixed(4)} g`;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => alternarItem(item.id)}
                  className={`w-full text-left p-5 sm:p-6 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                    feito
                      ? "bg-[#141720]/50 border-emerald-500/30 opacity-55"
                      : "bg-[#141720] border-white/10 hover:border-indigo-400/60 hover:-translate-y-0.5 shadow-lg"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {feito ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <Circle className="w-7 h-7 text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <div>
                      <div className={`text-lg sm:text-xl font-bold ${feito ? "line-through text-slate-500" : "text-white"}`}>
                        {item.nome}
                      </div>
                      {item.detalhe && (
                        <div className="text-xs sm:text-sm text-slate-400 mt-0.5">{item.detalhe}</div>
                      )}
                      {item.alertas?.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full mt-2">
                          <AlertTriangle className="w-3.5 h-3.5" /> {item.alertas.join(" · ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight shrink-0 self-end sm:self-center">
                    {valorTexto}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const moduloAtual = MODULOS.find((m) => m.id === abaAtiva) || MODULOS[0];
  const IconeModulo = moduloAtual.icon;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-3 sm:p-5 gap-5 max-w-[1440px] mx-auto">
      {/* SIDEBAR FLUTUANTE ARREDONDADA */}
      <aside className="lg:w-72 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] shrink-0 rounded-3xl bg-white dark:bg-[#141720] border border-slate-200/70 dark:border-white/8 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08)] flex flex-col justify-between p-4">
        <div className="space-y-5">
          {/* Marca */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Beaker className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight leading-none">LabCalc</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bancada Científica
                </p>
              </div>
            </div>

            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setPainelDadosAberto(true)}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Dados e Histórico"
              >
                <Database className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setModoEscuro((p) => !p)}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Alternar tema"
              >
                {modoEscuro ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Navegacao em pilulas */}
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {MODULOS.map((m) => {
              const Icone = m.icon;
              const ativo = abaAtiva === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAbaAtiva(m.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    ativo
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icone className={`w-4 h-4 shrink-0 ${ativo ? "text-white" : "text-slate-400"}`} />
                  <span>{m.nome}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodape da Sidebar */}
        <div className="hidden lg:flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-white/8">
          <button
            type="button"
            onClick={() => setPainelDadosAberto(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-slate-100/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <Database className="w-4 h-4 text-indigo-500" />
            <span>Dados & Histórico</span>
          </button>

          <button
            type="button"
            onClick={() => setModoEscuro((prev) => !prev)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-slate-100/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition cursor-pointer"
          >
            {modoEscuro ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            <span>{modoEscuro ? "Modo Claro" : "Modo Escuro"}</span>
          </button>
        </div>
      </aside>

      {/* AREA PRINCIPAL */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        {/* Cabecalho arredondado */}
        <header className="rounded-3xl bg-white/85 dark:bg-[#141720]/85 backdrop-blur-md border border-slate-200/70 dark:border-white/8 px-6 py-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.06)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <IconeModulo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {moduloAtual.nome}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {moduloAtual.desc}
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Offline · IUPAC 118
          </span>
        </header>

        <main className="flex-1 lab-workspace">
          {abaAtiva === "compositos" && <ModuloCompositos onAbrirModoBalanca={abrirModoBalanca} />}
          {abaAtiva === "polimeros" && <ModuloPolimeros onAbrirModoBalanca={abrirModoBalanca} />}
          {abaAtiva === "ceramica" && <ModuloCeramica onAbrirModoBalanca={abrirModoBalanca} />}
          {abaAtiva === "solucoes" && <ModuloSolucoes onAbrirModoBalanca={abrirModoBalanca} />}
          {abaAtiva === "metais" && <ModuloMetais onAbrirModoBalanca={abrirModoBalanca} />}
        </main>
      </div>

      {painelDadosAberto && (
        <PainelDados
          onFechar={() => setPainelDadosAberto(false)}
          onAbrirHistorico={(h) => abrirModoBalanca(h, false)}
        />
      )}
    </div>
  );
}
