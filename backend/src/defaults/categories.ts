import type { CategoryConfigRecord } from "../types.js";

type CatMap = CategoryConfigRecord["categories"];

const CATEGORIES: Record<string, string[]> = {
  Moradia: [
    "aluguel", "condominio", "condomínio", "iptu", "imobiliaria",
    "imobiliária", "motiva imoveis", "motiva imóveis",
  ],
  "Educação": [
    "escola", "paradiso", "faculdade", "universidade", "curso",
    "mensalidade escolar", "esc paradiso", "escola paradiso",
    "bmb *esc paradiso", "quintino e zanani", "gracie barra",
  ],
  "Alimentação": [
    "hayashi", "supermercado", "açougue", "acougue",
    "hortifruti", "ultrabox",
    "atacadão", "atacadao", "assaí", "assai", "carrefour", "extra",
    "pão de açúcar", "pao de acucar", "hortifruit", "alimentos",
    "sams club", "sam's club", "super adega",
    "bellavia", "frutos do goias", "hadco", "emporio vitalia",
    "emporio prime",
  ],
  Padaria: ["panificadora", "panificadorapark", "padaria"],
  "Restaurantes / Delivery": [
    "bbq premium", "nalenha", "crepe royale", "frans cafe",
    "fran s cafe", "mc donalds", "mcdonald", "restaurante",
    "casarao", "umami", "delicia", "antoniocarlos", "saida sul",
    "smoov", "aero brasilia", "solar garden", "fortunata",
  ],
  "Saúde": [
    "clinico", "clínico", "hospital", "farmacia", "farmácia",
    "drogaria", "drogasil", "laboratorio", "laboratório", "médico", "medico",
    "dentista", "odonto", "saude", "saúde", "centro clinico",
    "bandfarma", "marcelinho", "casa aya",
  ],
  Carro: [
    "detran", "your best car", "i park", "estacionamento", "uber",
    "99app", "multa", "licenciamento", "dpvat",
  ],
  Gasolina: [
    "combustível", "combustivel", "posto", "shell", "ipiranga",
    "auto posto", "cascol", "rede aqui",
  ],
  "Telecom / Internet": [
    "telecom", "internet", "celular", "telefone", "claro", "vivo",
    "tim ", "g7 bsb telecom",
  ],
  "Doações / Igreja": [
    "arautos", "evangelho", "paroquia", "paróquia", "dízimo",
    "dizimo", "igreja", "doação", "doacao",
  ],
  "Compras / Shopping": [
    "cea ", "c&a", "renner", "riachuelo", "amazon", "mercado livre",
    "mercado pago", "shopee", "magazine", "magalu", "americanas",
    "devanlay", "lacoste", "essential", "musitron", "eletronica",
    "eletrônica", "leroy merlin", "daiso", "first class", "decathlon",
    "dona park", "bcs - brasilia", "lojas renner", "sh brasilia",
  ],
  Assinaturas: [
    "netflix", "spotify", "disney", "hbo", "prime video", "youtube",
    "apple", "subscription", "assinatura", "vindi",
    "cursor ai", "obsidian", "amazon music", "companyhero",
    "ig*companyhero", "nu seguro",
  ],
  "Fatura Cartão": ["pagamento de fatura"],
  "Transferências Pessoais": [
    "aluizio", "vinícius ferreira", "vinicius ferreira",
  ],
  Receitas: [
    "transferência recebida", "transferencia recebida",
    "reembolso recebido", "salário", "salario", "ldl solutions",
    "pagar.me", "appmax",
  ],
  "Câmbio": [
    "conversão para conta global", "conversao para conta global",
    "conta global",
  ],
  "Outros Pagamentos": ["c6 bank"],
  IOF: ["iof de "],
  "Viagem / Hospedagem": [
    "pousada", "pireneus", "hotel", "airbnb", "booking",
  ],
  "Cuidados Pessoais": [
    "tatyanamarianodam", "salão", "salao", "barbearia", "cabelo",
  ],
};

const COLORS: Record<string, string> = {
  Receitas: "#22c55e",
  "Alimentação": "#f97316",
  Padaria: "#d97706",
  "Restaurantes / Delivery": "#ef4444",
  "Compras / Shopping": "#8b5cf6",
  "Educação": "#3b82f6",
  Carro: "#6366f1",
  Gasolina: "#4f46e5",
  "Saúde": "#ec4899",
  "Doações / Igreja": "#14b8a6",
  "Telecom / Internet": "#06b6d4",
  Assinaturas: "#a855f7",
  "Fatura Cartão": "#64748b",
  "Transferências Pessoais": "#78716c",
  "Câmbio": "#0ea5e9",
  "Outros Pagamentos": "#94a3b8",
  Moradia: "#f59e0b",
  "Viagem / Hospedagem": "#10b981",
  "Cuidados Pessoais": "#f472b6",
  IOF: "#9ca3af",
  "Sem Categoria": "#d1d5db",
};

function toCatMap(raw: Record<string, string[]>): CatMap {
  const result: CatMap = {};
  for (const [name, keywords] of Object.entries(raw)) {
    result[name] = { keywords, color: COLORS[name] ?? "#d1d5db" };
  }
  return result;
}

export function buildDefaultConfig(): Omit<CategoryConfigRecord, "PK" | "SK"> {
  return {
    categories: toCatMap(CATEGORIES),
    ignore: [
      "aplicação rdb", "aplicacao rdb", "resgate rdb",
      "pagamento recebido",
    ],
    rename: {
      "hayashi comercio, importacao de produtos alimenticios ltda": "Frutaria Vargem Bonita",
      "hayashi alimentos.": "Frutaria Vargem Bonita",
      "quintino e zanani": "Gracie Barra Lago Sul",
    },
    updatedAt: new Date().toISOString(),
  };
}
