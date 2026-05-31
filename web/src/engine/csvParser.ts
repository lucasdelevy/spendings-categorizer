import Papa from "papaparse";
import type { StatementType } from "../types";

export interface RawRow {
  [key: string]: string;
}

export interface ParsedCSV {
  type: StatementType;
  headers: string[];
  rows: RawRow[];
}

export function parseCSV(text: string): ParsedCSV {
  const cleaned = text.replace(/^\uFEFF/, "");

  const result = Papa.parse<RawRow>(cleaned, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = result.meta.fields ?? [];
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  const isBank =
    normalizedHeaders.includes("data") &&
    normalizedHeaders.includes("valor") &&
    (normalizedHeaders.includes("descrição") ||
      normalizedHeaders.includes("descricao"));

  const isCard =
    normalizedHeaders.includes("date") &&
    normalizedHeaders.includes("title") &&
    normalizedHeaders.includes("amount");

  if (!isBank && !isCard) {
    throw new Error(
      `Formato CSV não reconhecido. Colunas encontradas: ${headers.join(", ")}`,
    );
  }

  return {
    type: isBank ? "bank" : "card",
    headers,
    rows: result.data,
  };
}
