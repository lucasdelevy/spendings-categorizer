import { describe, expect, it } from "vitest";
import { cleanPayeeName } from "./payee";

describe("cleanPayeeName", () => {
  it("extracts merchant after pipe separator", () => {
    expect(cleanPayeeName("Transferência enviada|Hayashi Alimentos.")).toBe(
      "Hayashi Alimentos.",
    );
    expect(cleanPayeeName("Transferência Recebida|LDL SOLUTI")).toBe("LDL SOLUTI");
  });

  it("strips transfer prefix without pipe", () => {
    expect(cleanPayeeName("Transferência enviada ESCOLA PARADISO LTDA")).toBe(
      "ESCOLA PARADISO LTDA",
    );
  });

  it("leaves ordinary merchant names unchanged", () => {
    expect(cleanPayeeName("Cursor Usage Mid May")).toBe("Cursor Usage Mid May");
  });
});
