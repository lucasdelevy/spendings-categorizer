const TRANSFER_PREFIXES = [
  "transferência enviada",
  "transferencia enviada",
  "transferência recebida",
  "transferencia recebida",
] as const;

/** Strips Nubank-style noise from merchant/payee display names. */
export function cleanPayeeName(raw: string): string {
  let name = raw.trim();
  if (!name) return name;

  if (name.includes("|")) {
    name = name.split("|").pop()!.trim();
  }

  const lower = name.toLowerCase();
  for (const prefix of TRANSFER_PREFIXES) {
    if (lower.startsWith(prefix)) {
      name = name.slice(prefix.length).replace(/^[\s|:\-–—]+/, "").trim();
      break;
    }
  }

  return name.length > 60 ? name.substring(0, 60) : name;
}
