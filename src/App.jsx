import { lazy, Suspense, useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Database,
  Layers,
  Droplet,
  Flame,
  FlaskConical,
  Cpu,
  Beaker,
  Wifi,
  WifiOff,
} from "lucide-react";
import ModuloCompositos from "./modules/ModuloCompositos";
import { TEMAS_MODULO } from "./utils/temaModulos";
import { adicionarHistorico } from "./utils/storage";
import {
  RESOLUCAO_BALANCA_PADRAO,
  exportarCSV,
  gerarLinkCompartilhamento,
  lerLinkCompartilhado,
} from "./utils/exportacao";
import baseCientificaPubChem from "./data/base_cientifica_pubchem.json";

const ModuloPolimeros = lazy(() => import("./modules/ModuloPolimeros"));
const ModuloCeramica = lazy(() => import("./modules/ModuloCeramica"));
const ModuloSolucoes = lazy(() => import("./modules/ModuloSolucoes"));
const ModuloMetais = lazy(() => import("./modules/ModuloMetais"));
const PainelDados = lazy(() => import("./components/PainelDados"));
const ModoBalanca = lazy(() => import("./components/ModoBalanca"));

const DATA_BASE_PUBCHEM = baseCientificaPubChem?.atualizado_em_utc
  ? new Date(baseCientificaPubChem.atualizado_em_utc).toLocaleDateString("pt-BR")
  : "Não informada";

const MODULOS = [
  { id: "compositos", nome: "Compósitos e Blendas", desc: "Conversão % wt ↔ % vol e densidade teórica", icon: Layers },
  { id: "polimeros", nome: "Polímeros e Resinas", desc: "Formulação em phr, EEW / AHEW e cargas", icon: Droplet },
  { id: "ceramica", nome: "Síntese Cerâmica", desc: "Estequiometria de precursores e dopagem", icon: Flame },
  { id: "solucoes", nome: "Soluções e Diluições", desc: "Sólidos, líquidos P.A. e diluição C₁V₁", icon: FlaskConical },
  { id: "metais", nome: "Metais e Ligas", desc: "Conversão % at. ↔ % wt. e rendimento de fusão", icon: Cpu },
];

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState("compositos");
  const [linkInicial] = useState(() => lerLinkCompartilhado());
  const [dadosBalanca, setDadosBalanca] = useState(() => linkInicial);
  const [marcados, setMarcados] = useState({});
  const [massasReais, setMassasReais] = useState({});
  const [painelDadosAberto, setPainelDadosAberto] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [wakeLockAtivo, setWakeLockAtivo] = useState(false);
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Resolucao da balanca e metadados da ficha de bancada (PDF)
  const [resolucaoBalanca, setResolucaoBalanca] = useState(
    () => linkInicial?.resolucaoBalanca || RESOLUCAO_BALANCA_PADRAO
  );
  const [metaFicha, setMetaFicha] = useState(() => ({
    laboratorio: linkInicial?.metaFicha?.laboratorio || "",
    lote: linkInicial?.metaFicha?.lote || "",
    responsavel: linkInicial?.metaFicha?.responsavel || "",
  }));

  const [modoEscuro, setModoEscuro] = useState(() => {
    const salvo = localStorage.getItem("calc_bancada_tema");
    return salvo ? salvo === "dark" : false;
  });

  useEffect(() => {
    function atualizarRede() {
      setOnline(navigator.onLine);
    }
    window.addEventListener("online", atualizarRede);
    window.addEventListener("offline", atualizarRede);
    return () => {
      window.removeEventListener("online", atualizarRede);
      window.removeEventListener("offline", atualizarRede);
    };
  }, []);

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
    setMassasReais({});
    setLinkCopiado(false);
    if (payload?.resolucaoBalanca) {
      setResolucaoBalanca(payload.resolucaoBalanca);
    }
    if (payload?.metaFicha) {
      setMetaFicha({
        laboratorio: payload.metaFicha.laboratorio || "",
        lote: payload.metaFicha.lote || "",
        responsavel: payload.metaFicha.responsavel || "",
      });
    }
    if (salvarNoHistorico) {
      adicionarHistorico(payload);
    }
    setDadosBalanca(payload);
  }

  function alternarItem(id) {
    setMarcados((prev) => {
      const proximo = !prev[id];
      if (proximo && typeof navigator !== "undefined") {
        navigator.vibrate?.(15);
      }
      return { ...prev, [id]: proximo };
    });
  }

  function marcarComoPesado(id) {
    if (typeof navigator !== "undefined") {
      navigator.vibrate?.(15);
    }
    setMarcados((prev) => ({ ...prev, [id]: true }));
  }

  function atualizarMassaReal(id, valor) {
    setMassasReais((prev) => ({ ...prev, [id]: valor }));
  }

  async function copiarLinkWhatsApp() {
    if (!dadosBalanca) return;
    const link = gerarLinkCompartilhamento(dadosBalanca, { metaFicha, resolucaoBalanca });
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2500);
    } catch {
      window.prompt("Copie o link para compartilhar:", link);
    }
  }

  // MODO BALANCA
  if (dadosBalanca) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#0b0d12] flex items-center justify-center text-xs font-mono text-slate-400">
            Carregando Modo Balança...
          </div>
        }
      >
        <ModoBalanca
          dadosBalanca={dadosBalanca}
          marcados={marcados}
          massasReais={massasReais}
          onAlternarItem={alternarItem}
          onMarcarPesado={marcarComoPesado}
          onAtualizarMassaReal={atualizarMassaReal}
          onLimpar={() => {
            setMarcados({});
            setMassasReais({});
          }}
          onFechar={() => {
            window.history.replaceState({}, "", window.location.pathname);
            setDadosBalanca(null);
          }}
          onCopiarLink={copiarLinkWhatsApp}
          onExportarCSV={() => exportarCSV(dadosBalanca, { metaFicha, resolucaoBalanca, massasReais })}
          linkCopiado={linkCopiado}
          wakeLockAtivo={wakeLockAtivo}
          resolucaoBalanca={resolucaoBalanca}
          onChangeResolucao={setResolucaoBalanca}
          metaFicha={metaFicha}
          onChangeMetaFicha={setMetaFicha}
          modoEscuro={modoEscuro}
          onAlternarTema={() => setModoEscuro((prev) => !prev)}
          dataBasePubChem={DATA_BASE_PUBCHEM}
        />
      </Suspense>
    );
  }

  const moduloAtual = MODULOS.find((m) => m.id === abaAtiva) || MODULOS[0];
  const IconeModulo = moduloAtual.icon;
  const temaAtual = TEMAS_MODULO[moduloAtual.id] || TEMAS_MODULO.compositos;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-3 sm:p-5 gap-5 max-w-[1440px] mx-auto">
      {/* SIDEBAR FLUTUANTE ARREDONDADA */}
      <aside className="lg:w-72 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] shrink-0 rounded-3xl bg-white dark:bg-[#141720] border border-slate-200/70 dark:border-white/8 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08)] flex flex-col justify-between p-4">
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-sm">
                <Beaker className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight leading-none">LabCalc</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bancada · v1.0.0
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

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {MODULOS.map((m) => {
              const Icone = m.icon;
              const ativo = abaAtiva === m.id;
              const temaItem = TEMAS_MODULO[m.id] || TEMAS_MODULO.compositos;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAbaAtiva(m.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    ativo
                      ? temaItem.sidebarAtivo
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
        <header className="rounded-3xl bg-white/90 dark:bg-[#141720]/90 backdrop-blur-md border border-slate-200/70 dark:border-white/8 px-6 py-5 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.06)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${temaAtual.headerIcon}`}>
              <IconeModulo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {moduloAtual.nome}
                </h2>
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${temaAtual.headerBadge}`}>
                  {temaAtual.nomeCurto}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {moduloAtual.desc}
              </p>
            </div>
          </div>

          <span
            className={`hidden sm:inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border ${
              online
                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                : "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20"
            }`}
          >
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {online ? "Cálculo local · PubChem online" : "Modo offline · PubChem indisponível"}
          </span>
        </header>

        <main className="flex-1 lab-workspace" data-modulo={abaAtiva}>
          <Suspense
            fallback={
              <div className="min-h-[420px] rounded-3xl bg-white/70 dark:bg-[#141720]/70 border border-slate-200/70 dark:border-white/8 flex items-center justify-center text-xs font-mono text-slate-400">
                Carregando módulo...
              </div>
            }
          >
            {abaAtiva === "compositos" && <ModuloCompositos onAbrirModoBalanca={abrirModoBalanca} />}
            {abaAtiva === "polimeros" && <ModuloPolimeros onAbrirModoBalanca={abrirModoBalanca} />}
            {abaAtiva === "ceramica" && <ModuloCeramica onAbrirModoBalanca={abrirModoBalanca} />}
            {abaAtiva === "solucoes" && <ModuloSolucoes onAbrirModoBalanca={abrirModoBalanca} />}
            {abaAtiva === "metais" && <ModuloMetais onAbrirModoBalanca={abrirModoBalanca} />}
          </Suspense>
        </main>
      </div>

      {painelDadosAberto && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center text-xs font-mono text-white">
              Carregando...
            </div>
          }
        >
          <PainelDados
            onFechar={() => setPainelDadosAberto(false)}
            onAbrirHistorico={(h) => abrirModoBalanca(h, false)}
          />
        </Suspense>
      )}
    </div>
  );
}
