import type { CategoryConfigRecord } from "../types.js";

type CatMap = CategoryConfigRecord["bankCategories"];

const BANK_CATEGORIES: Record<string, string[]> = {
  Moradia: [
    "aluguel", "condominio", "condomínio", "iptu", "imobiliaria",
    "imobiliária",
  ],
  "Educação": [
    "escola", "paradiso", "faculdade", "universidade", "curso",
    "mensalidade escolar",
  ],
  "Alimentação": [
    "hayashi", "supermercado", "açougue", "acougue",
    "hortifruti", "padaria", "panificadora", "ultrabox",
    "atacadão", "atacadao", "assaí", "assai", "carrefour", "extra",
    "pão de açúcar", "hortifruit", "alimentos",
  ],
  "Saúde": [
    "clinico", "clínico", "hospital", "farmacia", "farmácia",
    "drogaria", "laboratorio", "laboratório", "médico", "medico",
    "dentista", "odonto", "saude", "saúde", "centro clinico",
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
    "eletrônica",
  ],
  Assinaturas: [
    "netflix", "spotify", "disney", "hbo", "prime video", "youtube",
    "apple", "subscription", "assinatura", "vindi",
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
};

const CARD_CATEGORIES: Record<string, string[]> = {
  IOF: ["iof de "],
  "Assinaturas / Apps": [
    "cursor ai", "obsidian", "netflix", "spotify", "disney",
    "hbo", "amazon music", "prime video", "youtube", "apple",
    "companyhero", "ig*companyhero", "nu seguro",
  ],
  "Educação": [
    "esc paradiso", "escola paradiso", "faculdade", "universidade",
    "bmb *esc paradiso", "quintino e zanani", "gracie barra",
  ],
  Padaria: ["panificadora", "panificadorapark", "padaria"],
  "Alimentação": [
    "ultrabox", "pao de acucar",
    "pão de açúcar", "sams club", "sam's club", "super adega",
    "bellavia", "frutos do goias", "hadco", "emporio vitalia",
    "emporio prime", "atacadão", "atacadao", "assaí", "assai",
    "carrefour", "hortifruti",
  ],
  "Restaurantes / Delivery": [
    "bbq premium", "nalenha", "crepe royale", "frans cafe",
    "fran s cafe", "mc donalds", "mcdonald", "restaurante",
    "casarao", "umami", "delicia", "antoniocarlos", "saida sul",
    "smoov", "aero brasilia", "solar garden",
    "fortunata",
  ],
  "Saúde": [
    "drogasil", "drogaria", "farmacia", "farmácia", "hospital",
    "clinico", "clínico", "laboratorio", "laboratório", "dentista",
    "odonto", "bandfarma", "marcelinho", "casa aya",
  ],
  Carro: [
    "detran", "your best car", "i park", "estacionamento", "uber",
    "99app", "multa", "licenciamento", "dpvat",
  ],
  Gasolina: [
    "cascol", "combustivel", "combustível", "posto", "shell",
    "ipiranga", "auto posto", "rede aqui",
  ],
  "Compras / Shopping": [
    "amazon", "leroy merlin", "daiso", "renner", "riachuelo",
    "magalu", "americanas", "first class", "decathlon",
    "dona park", "bcs - brasilia", "lojas renner",
    "sh brasilia",
  ],
  Moradia: [
    "condominio", "condomínio", "motiva imoveis", "motiva imóveis",
    "aluguel",
  ],
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
  "Assinaturas / Apps": "#a855f7",
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
    bankCategories: toCatMap(BANK_CATEGORIES),
    cardCategories: toCatMap(CARD_CATEGORIES),
    bankIgnore: ["aplicação rdb", "aplicacao rdb", "resgate rdb"],
    cardIgnore: ["pagamento recebido"],
    bankRename: {
      "hayashi comercio, importacao de produtos alimenticios ltda":
        "Frutaria Vargem Bonita",
      "hayashi alimentos.": "Frutaria Vargem Bonita",
    },
    cardRename: {
      "quintino e zanani": "Gracie Barra Lago Sul",
      "hayashi alimentos.": "Frutaria Vargem Bonita",
    },
    updatedAt: new Date().toISOString(),
  };
}
