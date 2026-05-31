import { describe, it, expect } from "vitest";
import { parseCSV } from "./csvParser";

describe("parseCSV", () => {
  it("detects bank statement from headers", () => {
    const text = "Data,Valor,Identificador,Descrição\n01/03/2026,-100.00,abc,Test";
    const result = parseCSV(text);
    expect(result.type).toBe("bank");
    expect(result.rows).toHaveLength(1);
  });

  it("detects card statement from headers", () => {
    const text = "date,title,amount\n2026-03-01,Store,-50.00";
    const result = parseCSV(text);
    expect(result.type).toBe("card");
  });
});
