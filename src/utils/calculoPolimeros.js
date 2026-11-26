export const SISTEMAS_RESINA_PRESET = [
  {
    nome: "Epóxi DGEBA + TETA (EEW 190 / AHEW 24)",
    modo: "estequiometrico",
    resinaNome: "Resina Epóxi DGEBA",
    resinaPureza: "100",
    resinaDensidade: "1.16",
    endurecedorNome: "Endurecedor TETA",
    endurecedorPureza: "97",
    endurecedorDensidade: "0.98",
    eew: "190",
    ahew: "24",
    phrManual: "12.6",
  },
  {
    nome: "Epóxi DGEBA + IPDA (EEW 190 / AHEW 42.6)",
    modo: "estequiometrico",
    resinaNome: "Resina Epóxi DGEBA",
    resinaPureza: "100",
    resinaDensidade: "1.16",
    endurecedorNome: "Endurecedor IPDA",
    endurecedorPureza: "99",
    endurecedorDensidade: "0.92",
    eew: "190",
    ahew: "42.6",
    phrManual: "22.4",
  },
  {
    nome: "Epóxi Comercial 2:1 em massa (50 phr)",
    modo: "phr",
    resinaNome: "Resina Epóxi (Parte A)",
    resinaPureza: "100",
    resinaDensidade: "1.15",
    endurecedorNome: "Endurecedor (Parte B)",
    endurecedorPureza: "100",
    endurecedorDensidade: "1.02",
    eew: "190",
    ahew: "95",
    phrManual: "50",
  },
  {
    nome: "Poliéster Insaturado + MEKP (1,5 phr)",
    modo: "phr",
    resinaNome: "Resina Poliéster Insaturada",
    resinaPureza: "100",
    resinaDensidade: "1.12",
    endurecedorNome: "Iniciador MEKP",
    endurecedorPureza: "50",
    endurecedorDensidade: "1.17",
    eew: "190",
    ahew: "24",
    phrManual: "1.5",
  },
];

export function calcularPolimero({
  modo = "estequiometrico",
  resinaNome = "Resina",
  resinaPureza = 100,
  resinaDensidade = 1.16,
  endurecedorNome = "Endurecedor",
  endurecedorPureza = 100,
  endurecedorDensidade = 0.98,
  eew = 190,
  ahew = 24,
  phrManual = 50,
  massaAlvoG = 100,
  alvoTipo = "total",
  perdaPct = 0,
  aditivos = [],
}) {
  const mAlvo = Number(massaAlvoG);
  if (!(mAlvo > 0)) {
    return { valido: false, erro: "Informe uma massa alvo positiva (em gramas)." };
  }

  const purRes = Number(resinaPureza);
  const purEnd = Number(endurecedorPureza);
  if (!(purRes > 0 && purRes <= 100)) {
    return { valido: false, erro: "Pureza da resina deve estar entre 0,1% e 100%." };
  }
  if (!(purEnd > 0 && purEnd <= 100)) {
    return { valido: false, erro: "Pureza do endurecedor deve estar entre 0,1% e 100%." };
  }

  let phrEndurecedor = 0;
  if (modo === "estequiometrico") {
    const vEew = Number(eew);
    const vAhew = Number(ahew);
    if (!(vEew > 0) || !(vAhew > 0)) {
      return { valido: false, erro: "EEW e AHEW devem ser maiores que zero." };
    }
    phrEndurecedor = (vAhew / vEew) * 100;
  } else {
    phrEndurecedor = Number(phrManual);
    if (Number.isNaN(phrEndurecedor) || phrEndurecedor < 0) {
      return { valido: false, erro: "Informe um valor válido de phr para o endurecedor." };
    }
  }

  const aditivosValidos = [];
  for (const ad of aditivos) {
    const vPhr = Number(ad.phr);
    const vPur = Number(ad.purezaPct ?? 100);
    const vDens = Number(ad.densidade ?? 0);
    if (Number.isNaN(vPhr) || vPhr < 0) {
      return { valido: false, erro: `Valor de phr inválido para "${ad.nome || "aditivo"}".` };
    }
    if (!(vPur > 0 && vPur <= 100)) {
      return { valido: false, erro: `Pureza inválida para "${ad.nome || "aditivo"}".` };
    }
    aditivosValidos.push({
      id: ad.id,
      nome: (ad.nome || "Aditivo").trim(),
      phr: vPhr,
      purezaPct: vPur,
      densidade: vDens > 0 ? vDens : null,
    });
  }

  const somaPhr = 100 + phrEndurecedor + aditivosValidos.reduce((acc, a) => acc + a.phr, 0);
  const fatorPerda = 1 + Math.max(0, Number(perdaPct) || 0) / 100;

  const massaNominalResina =
    alvoTipo === "resina" ? mAlvo * fatorPerda : (mAlvo * fatorPerda * 100) / somaPhr;
  const massaNominalEnd = massaNominalResina * (phrEndurecedor / 100);

  const densRes = Number(resinaDensidade) > 0 ? Number(resinaDensidade) : null;
  const densEnd = Number(endurecedorDensidade) > 0 ? Number(endurecedorDensidade) : null;

  const montarItem = ({ id, nome, phr, massaNominalG, purezaPct, densidade }) => {
    const massaPesarG = massaNominalG / (purezaPct / 100);
    const volumeMl = densidade ? massaPesarG / densidade : null;
    return { id, nome, phr, purezaPct, densidade, massaNominalG, massaG: massaPesarG, volumeMl };
  };

  const itensBrutos = [
    montarItem({
      id: "resina-base",
      nome: resinaNome.trim() || "Resina Base",
      phr: 100,
      massaNominalG: massaNominalResina,
      purezaPct: purRes,
      densidade: densRes,
    }),
    montarItem({
      id: "endurecedor",
      nome: endurecedorNome.trim() || "Endurecedor",
      phr: phrEndurecedor,
      massaNominalG: massaNominalEnd,
      purezaPct: purEnd,
      densidade: densEnd,
    }),
    ...aditivosValidos.map((a) =>
      montarItem({
        id: a.id,
        nome: a.nome,
        phr: a.phr,
        massaNominalG: massaNominalResina * (a.phr / 100),
        purezaPct: a.purezaPct,
        densidade: a.densidade,
      })
    ),
  ];

  const massaTotalG = itensBrutos.reduce((acc, i) => acc + i.massaG, 0);
  const todosTemVolume = itensBrutos.every((i) => i.volumeMl !== null);
  const volumeTotalMl = todosTemVolume
    ? itensBrutos.reduce((acc, i) => acc + i.volumeMl, 0)
    : null;

  const itens = itensBrutos.map((i) => ({
    ...i,
    wtPct: (i.massaG / massaTotalG) * 100,
  }));

  const razaoResinaEnd =
    itens[1].massaG > 0 ? itens[0].massaG / itens[1].massaG : null;

  return {
    valido: true,
    phrEndurecedor,
    somaPhr,
    massaTotalG,
    volumeTotalMl,
    razaoResinaEnd,
    itens,
  };
}
