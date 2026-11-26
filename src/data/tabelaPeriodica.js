// 118 elementos IUPAC: [Simbolo, Nome PT, Nome EN, Massa Atomica]
const ELEMENTOS_RAW = [
  ["H","Hidrogênio","Hydrogen",1.008],["He","Hélio","Helium",4.0026],["Li","Lítio","Lithium",6.94],["Be","Berílio","Beryllium",9.0122],
  ["B","Boro","Boron",10.81],["C","Carbono","Carbon",12.011],["N","Nitrogênio","Nitrogen",14.007],["O","Oxigênio","Oxygen",15.999],
  ["F","Flúor","Fluorine",18.998],["Ne","Neônio","Neon",20.180],["Na","Sódio","Sodium",22.990],["Mg","Magnésio","Magnesium",24.305],
  ["Al","Alumínio","Aluminum",26.982],["Si","Silício","Silicon",28.085],["P","Fósforo","Phosphorus",30.974],["S","Enxofre","Sulfur",32.06],
  ["Cl","Cloro","Chlorine",35.45],["Ar","Argônio","Argon",39.948],["K","Potássio","Potassium",39.098],["Ca","Cálcio","Calcium",40.078],
  ["Sc","Escândio","Scandium",44.956],["Ti","Titânio","Titanium",47.867],["V","Vanádio","Vanadium",50.942],["Cr","Cromo","Chromium",51.996],
  ["Mn","Manganês","Manganese",54.938],["Fe","Ferro","Iron",55.845],["Co","Cobalto","Cobalt",58.933],["Ni","Níquel","Nickel",58.693],
  ["Cu","Cobre","Copper",63.546],["Zn","Zinco","Zinc",65.38],["Ga","Gálio","Gallium",69.723],["Ge","Germânio","Germanium",72.630],
  ["As","Arsênio","Arsenic",74.922],["Se","Selênio","Selenium",78.971],["Br","Bromo","Bromine",79.904],["Kr","Criptônio","Krypton",83.798],
  ["Rb","Rubídio","Rubidium",85.468],["Sr","Estrôncio","Strontium",87.62],["Y","Ítrio","Yttrium",88.906],["Zr","Zircônio","Zirconium",91.224],
  ["Nb","Nióbio","Niobium",92.906],["Mo","Molibdênio","Molybdenum",95.95],["Tc","Tecnécio","Technetium",98.0],["Ru","Rutênio","Ruthenium",101.07],
  ["Rh","Ródio","Rhodium",102.91],["Pd","Paládio","Palladium",106.42],["Ag","Prata","Silver",107.87],["Cd","Cádmio","Cadmium",112.41],
  ["In","Índio","Indium",114.82],["Sn","Estanho","Tin",118.71],["Sb","Antimônio","Antimony",121.76],["Te","Telúrio","Tellurium",127.60],
  ["I","Iodo","Iodine",126.90],["Xe","Xenônio","Xenon",131.29],["Cs","Césio","Cesium",132.91],["Ba","Bário","Barium",137.33],
  ["La","Lantânio","Lanthanum",138.91],["Ce","Cério","Cerium",140.12],["Pr","Praseodímio","Praseodymium",140.91],["Nd","Neodímio","Neodymium",144.24],
  ["Pm","Promécio","Promethium",145.0],["Sm","Samário","Samarium",150.36],["Eu","Európio","Europium",151.96],["Gd","Gadolínio","Gadolinium",157.25],
  ["Tb","Térbio","Terbium",158.93],["Dy","Disprósio","Dysprosium",162.50],["Ho","Hólmio","Holmium",164.93],["Er","Érbio","Erbium",167.26],
  ["Tm","Túlio","Thulium",168.93],["Yb","Itérbio","Ytterbium",173.05],["Lu","Lutécio","Lutetium",174.97],["Hf","Háfnio","Hafnium",178.49],
  ["Ta","Tântalo","Tantalum",180.95],["W","Tungstênio","Tungsten",183.84],["Re","Rênio","Rhenium",186.21],["Os","Ósmio","Osmium",190.23],
  ["Ir","Irídio","Iridium",192.22],["Pt","Platina","Platinum",195.08],["Au","Ouro","Gold",196.97],["Hg","Mercúrio","Mercury",200.59],
  ["Tl","Tálio","Thallium",204.38],["Pb","Chumbo","Lead",207.2],["Bi","Bismuto","Bismuth",208.98],["Po","Polônio","Polonium",209.0],
  ["At","Astato","Astatine",210.0],["Rn","Radônio","Radon",222.0],["Fr","Frâncio","Francium",223.0],["Ra","Rádio","Radium",226.0],
  ["Ac","Actínio","Actinium",227.0],["Th","Tório","Thorium",232.04],["Pa","Protactínio","Protactinium",231.04],["U","Urânio","Uranium",238.03],
  ["Np","Netúnio","Neptunium",237.0],["Pu","Plutônio","Plutonium",244.0],["Am","Amerício","Americium",243.0],["Cm","Cúrio","Curium",247.0],
  ["Bk","Berquélio","Berkelium",247.0],["Cf","Califórnio","Californium",251.0],["Es","Einstênio","Einsteinium",252.0],["Fm","Férmio","Fermium",257.0],
  ["Md","Mendelévio","Mendelevium",258.0],["No","Nobélio","Nobelium",259.0],["Lr","Laurêncio","Lawrencium",266.0],["Rf","Rutherfórdio","Rutherfordium",267.0],
  ["Db","Dúbnio","Dubnium",268.0],["Sg","Seabórgio","Seaborgium",269.0],["Bh","Bóhrio","Bohrium",270.0],["Hs","Hássio","Hassium",277.0],
  ["Mt","Meitnério","Meitnerium",278.0],["Ds","Darmstádio","Darmstadtium",281.0],["Rg","Roentgênio","Roentgenium",282.0],["Cn","Copernício","Copernicium",285.0],
  ["Nh","Nihônio","Nihonium",286.0],["Fl","Fleróvio","Flerovium",289.0],["Mc","Moscóvio","Moscovium",290.0],["Lv","Livermório","Livermorium",293.0],
  ["Ts","Tenessino","Tennessine",294.0],["Og","Oganessônio","Oganesson",294.0]
];

export const ELEMENTOS_INFO = ELEMENTOS_RAW.map(([simbolo, nome, nomeEn, massa], idx) => ({
  numeroAtomico: idx + 1,
  simbolo,
  nome,
  nomeEn,
  massa,
}));

export const TABELA_PERIODICA = Object.fromEntries(
  ELEMENTOS_RAW.map(([simbolo, , , massa]) => [simbolo, massa])
);

export const PRECURSORES_CERAMICOS = [
  { formula: "BaCO3", nome: "Carbonato de Bário", pureza: 99.0, alertas: ["toxico"] },
  { formula: "TiO2", nome: "Dióxido de Titânio", pureza: 99.5, alertas: [] },
  { formula: "CaCO3", nome: "Carbonato de Cálcio", pureza: 99.0, alertas: [] },
  { formula: "SrCO3", nome: "Carbonato de Estrôncio", pureza: 99.0, alertas: [] },
  { formula: "ZrO2", nome: "Dióxido de Zircônio", pureza: 99.0, alertas: [] },
  { formula: "Y2O3", nome: "Óxido de Ítrio", pureza: 99.9, alertas: ["secar_estufa"] },
  { formula: "Al2O3", nome: "Alumina Alfa", pureza: 99.8, alertas: ["secar_estufa"] },
  { formula: "ZnO", nome: "Óxido de Zinco", pureza: 99.5, alertas: [] },
  { formula: "Fe2O3", nome: "Óxido de Ferro (III)", pureza: 99.0, alertas: [] },
  { formula: "MnO2", nome: "Dióxido de Manganês", pureza: 99.0, alertas: ["oxidante"] },
  { formula: "La2O3", nome: "Óxido de Lantânio", pureza: 99.9, alertas: ["higroscopico", "secar_estufa"] },
  { formula: "Nb2O5", nome: "Pentóxido de Nióbio", pureza: 99.5, alertas: [] },
  { formula: "Li2CO3", nome: "Carbonato de Lítio", pureza: 99.0, alertas: [] },
  { formula: "Na2CO3", nome: "Carbonato de Sódio", pureza: 99.5, alertas: ["higroscopico"] },
  { formula: "K2CO3", nome: "Carbonato de Potássio", pureza: 99.0, alertas: ["higroscopico"] },
  { formula: "Bi2O3", nome: "Óxido de Bismuto (III)", pureza: 99.9, alertas: [] },
  { formula: "PbO", nome: "Óxido de Chumbo (II)", pureza: 99.0, alertas: ["toxico", "usar_capela"] },
  { formula: "SiO2", nome: "Dióxido de Silício", pureza: 99.8, alertas: ["po_fino_mascara"] },
  { formula: "MgO", nome: "Óxido de Magnésio", pureza: 99.0, alertas: ["higroscopico"] },
  { formula: "CuO", nome: "Óxido de Cobre (II)", pureza: 99.0, alertas: [] },
  { formula: "CeO2", nome: "Óxido de Cério (IV)", pureza: 99.9, alertas: [] },
  { formula: "Eu2O3", nome: "Óxido de Európio (III)", pureza: 99.99, alertas: ["secar_estufa"] },
  { formula: "NH4H2PO4", nome: "Fosfato de Amônio Monobásico", pureza: 99.0, alertas: [] },
  { formula: "Ca(NO3)2·4H2O", nome: "Nitrato de Cálcio Tetrahidratado", pureza: 99.0, alertas: ["higroscopico", "oxidante"] }
];
