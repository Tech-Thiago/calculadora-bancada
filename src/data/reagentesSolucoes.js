export const SOLIDOS_SOLUCOES = [
  { formula: "NaOH", nome: "Hidróxido de Sódio", pureza: 98.0, alertas: ["corrosivo", "higroscopico", "exotermico"] },
  { formula: "KOH", nome: "Hidróxido de Potássio", pureza: 85.0, alertas: ["corrosivo", "higroscopico", "exotermico"] },
  { formula: "NaCl", nome: "Cloreto de Sódio", pureza: 99.5, alertas: [] },
  { formula: "KCl", nome: "Cloreto de Potássio", pureza: 99.5, alertas: [] },
  { formula: "CuSO4·5H2O", nome: "Sulfato de Cobre (II) Pentahidratado", pureza: 99.0, alertas: ["toxico"] },
  { formula: "AgNO3", nome: "Nitrato de Prata", pureza: 99.8, alertas: ["corrosivo", "fotossensivel", "oxidante"] },
  { formula: "C6H8O7", nome: "Ácido Cítrico Anidro", pureza: 99.5, alertas: [] },
  { formula: "C6H8O7·H2O", nome: "Ácido Cítrico Monohidratado", pureza: 99.5, alertas: [] },
  { formula: "H3BO3", nome: "Ácido Bórico", pureza: 99.5, alertas: [] },
  { formula: "Na2CO3", nome: "Carbonato de Sódio Anidro", pureza: 99.5, alertas: ["higroscopico"] },
  { formula: "NaHCO3", nome: "Bicarbonato de Sódio", pureza: 99.5, alertas: [] },
  { formula: "FeCl3·6H2O", nome: "Cloreto de Ferro (III) Hexahidratado", pureza: 99.0, alertas: ["corrosivo", "higroscopico"] },
  { formula: "Zn(NO3)2·6H2O", nome: "Nitrato de Zinco Hexahidratado", pureza: 98.0, alertas: ["oxidante", "higroscopico"] },
  { formula: "KMnO4", nome: "Permanganato de Potássio", pureza: 99.0, alertas: ["oxidante"] },
  { formula: "C10H14N2Na2O8·2H2O", nome: "EDTA Dissódico Dihidratado", pureza: 99.0, alertas: [] }
];

export const LIQUIDOS_CONCENTRADOS = [
  { formula: "HCl", nome: "Ácido Clorídrico P.A. (37%)", pureza: 37.0, densidade: 1.19, acidoForte: true, alertas: ["corrosivo", "volatil", "usar_capela"] },
  { formula: "H2SO4", nome: "Ácido Sulfúrico P.A. (98%)", pureza: 98.0, densidade: 1.84, acidoForte: true, alertas: ["corrosivo", "exotermico", "usar_capela"] },
  { formula: "HNO3", nome: "Ácido Nítrico P.A. (65%)", pureza: 65.0, densidade: 1.40, acidoForte: true, alertas: ["corrosivo", "oxidante", "usar_capela"] },
  { formula: "H3PO4", nome: "Ácido Fosfórico P.A. (85%)", pureza: 85.0, densidade: 1.69, acidoForte: true, alertas: ["corrosivo"] },
  { formula: "CH3COOH", nome: "Ácido Acético Glacial (99,7%)", pureza: 99.7, densidade: 1.049, acidoForte: true, alertas: ["corrosivo", "volatil", "usar_capela"] },
  { formula: "HF", nome: "Ácido Fluorídrico (48%)", pureza: 48.0, densidade: 1.15, acidoForte: true, alertas: ["altamente_toxico", "corrosivo", "usar_capela", "nao_usar_vidro"] },
  { formula: "NH3", nome: "Hidróxido de Amônio (28% NH3)", pureza: 28.0, densidade: 0.90, acidoForte: false, alertas: ["corrosivo", "volatil", "usar_capela"] },
  { formula: "H2O2", nome: "Peróxido de Hidrogênio (30%)", pureza: 30.0, densidade: 1.11, acidoForte: false, alertas: ["oxidante", "corrosivo"] },
  { formula: "C2H5OH", nome: "Etanol Absoluto (99,5%)", pureza: 99.5, densidade: 0.789, acidoForte: false, alertas: ["inflamavel", "volatil"] }
];
