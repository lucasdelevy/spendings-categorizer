import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import { getConfig } from "./categoryService.js";
import { matchCategory } from "./categoryMatch.js";
import { listStatements, saveStatement } from "./statementService.js";
import { upsertUser } from "./userService.js";
import { verifyPassword } from "./password.js";
import type { CategoryConfigRecord, TransactionItem } from "../types.js";

/** App Review demo user. Password is only in App Store review notes, not in clients. */
export const REVIEW_EMAIL = "test@aletheia.com";
export const REVIEW_USER_ID = "review-aletheia";
export const REVIEW_NAME = "App Review";

const PASSWORD_SALT = "75008409503cd47b6f7197372bf25b60";
const PASSWORD_HASH =
  "8fbb699fc1598492dce03937648f377ae9f43ec616d8a375b38c26b199ef529c906921172eff50f16c188252340ff05fdf2ca7d84a0a333e210191926b20612d";

export function isReviewLogin(email: string, password: string): boolean {
  if (email.trim().toLowerCase() !== REVIEW_EMAIL) return false;
  return verifyPassword(password, PASSWORD_SALT, PASSWORD_HASH);
}

const uploadedBy = {
  userId: REVIEW_USER_ID,
  name: REVIEW_NAME,
  picture: "",
};

function tx(
  date: string,
  amount: number,
  payee: string,
  config: CategoryConfigRecord,
  extra?: Partial<TransactionItem>,
): TransactionItem {
  return {
    date,
    amount,
    payee,
    originalDescription: payee,
    installment: "",
    category: matchCategory(payee, config),
    origin: "csv",
    source: extra?.source ?? "bank",
    ...extra,
  };
}

function summarize(
  type: "bank" | "card" | "family",
  transactions: TransactionItem[],
) {
  let totalIn = 0;
  let totalOut = 0;
  const catMap = new Map<string, { category: string; total: number; count: number }>();
  for (const t of transactions) {
    if (t.hidden) continue;
    if (t.amount >= 0) totalIn += t.amount;
    else totalOut += t.amount;
    const existing = catMap.get(t.category);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      catMap.set(t.category, { category: t.category, total: t.amount, count: 1 });
    }
  }
  return {
    type,
    totalIn,
    totalOut,
    balance: totalIn + totalOut,
    categories: Array.from(catMap.values()),
  };
}

function september(config: CategoryConfigRecord): TransactionItem[] {
  return [
    tx("2026-09-01", -89.9, "SUPERMERCADO EXTRA", config),
    tx("2026-09-01", -22.4, "UBER *TRIP", config),
    tx("2026-09-02", 8500, "SALÁRIO EMPRESA LTDA", config),
    tx("2026-09-02", -67.8, "POSTO SHELL COMBUSTIVEL", config),
    tx("2026-09-03", -34.9, "PADARIA REAL", config),
    tx("2026-09-03", -55, "RESTAURANTE BBQ PREMIUM", config, { source: "card" }),
    tx("2026-09-04", -9.9, "SPOTIFY BRASIL", config, { source: "card" }),
    tx("2026-09-04", -39.9, "NETFLIX.COM", config, { source: "card" }),
    tx("2026-09-05", -250, "PIX ENVIADO - ALUGUEL", config),
    tx("2026-09-06", -63, "DROGASIL MEDICAMENTOS", config),
    tx("2026-09-07", -79.9, "INTERNET VIVO FIBRA", config),
    tx("2026-09-08", -199.9, "LOJAS RENNER ROUPAS", config, { source: "card" }),
    tx("2026-09-09", -75, "CORTE CABELO BARBEARIA", config),
    tx("2026-09-10", -120, "CONSULTA MEDICO DR SOUZA", config),
    tx("2026-09-11", -18.5, "IFOOD *RESTAURANTE BBQ PREMIUM", config, { source: "card" }),
    tx("2026-09-12", -45, "ESTACIONAMENTO CENTER", config),
    tx("2026-09-13", -14.9, "YOUTUBE PREMIUM", config, { source: "card" }),
    tx("2026-09-14", -88, "SUPERMERCADO CARREFOUR", config),
    tx("2026-09-15", -110, "CONTA DE AGUA SABESP", config),
    tx("2026-09-16", 400, "TRANSFERÊNCIA RECEBIDA FREELANCE", config),
  ];
}

function august(config: CategoryConfigRecord): TransactionItem[] {
  return [
    tx("2026-08-02", 8500, "SALÁRIO EMPRESA LTDA", config),
    tx("2026-08-03", -250, "PIX ENVIADO - ALUGUEL", config),
    tx("2026-08-05", -102.3, "SUPERMERCADO EXTRA", config),
    tx("2026-08-08", -71.2, "POSTO SHELL COMBUSTIVEL", config),
    tx("2026-08-10", -39.9, "NETFLIX.COM", config, { source: "card" }),
    tx("2026-08-12", -9.9, "SPOTIFY BRASIL", config, { source: "card" }),
    tx("2026-08-18", -156.4, "LOJAS RENNER ROUPAS", config, { source: "card" }),
    tx("2026-08-22", -48, "UBER *TRIP", config),
    tx("2026-08-28", -79.9, "INTERNET VIVO FIBRA", config),
  ];
}

async function alreadySeeded(): Promise<boolean> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${REVIEW_USER_ID}`, SK: "DEMOSEED" },
    }),
  );
  return Boolean(result.Item);
}

async function markSeeded(): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: `USER#${REVIEW_USER_ID}`, SK: "DEMOSEED", seededAt: new Date().toISOString() },
    }),
  );
}

export async function ensureReviewAccount(): Promise<void> {
  await upsertUser({
    userId: REVIEW_USER_ID,
    email: REVIEW_EMAIL,
    name: REVIEW_NAME,
    picture: "",
  });

  if (await alreadySeeded()) return;
  const existing = await listStatements(REVIEW_USER_ID);
  if (existing.length > 0) {
    await markSeeded();
    return;
  }

  const config = await getConfig(REVIEW_USER_ID);
  const sep = september(config);
  const aug = august(config);

  await saveStatement({
    userId: REVIEW_USER_ID,
    yearMonth: "202609",
    type: "family",
    fileName: "Demo September 2026",
    summary: summarize("family", sep),
    transactions: sep,
    uploadedBy,
  });
  await saveStatement({
    userId: REVIEW_USER_ID,
    yearMonth: "202608",
    type: "family",
    fileName: "Demo August 2026",
    summary: summarize("family", aug),
    transactions: aug,
    uploadedBy,
  });
  await markSeeded();
}
