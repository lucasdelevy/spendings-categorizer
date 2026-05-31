export function parseDateToNum(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.includes("T") ? raw.split("T")[0] : raw;

  if (cleaned.includes("-")) {
    const [y, m, d] = cleaned.split("-");
    const n = Number(y) * 10000 + Number(m) * 100 + Number(d);
    return Number.isNaN(n) ? null : n;
  }
  if (cleaned.includes("/")) {
    const [d, m, y] = cleaned.split("/");
    const n = Number(y) * 10000 + Number(m) * 100 + Number(d);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function compareDatesAsc(a: string, b: string): number {
  const an = parseDateToNum(a);
  const bn = parseDateToNum(b);
  if (an === null && bn === null) return 0;
  if (an === null) return 1;
  if (bn === null) return -1;
  return an - bn;
}

export function compareDatesDesc(a: string, b: string): number {
  return -compareDatesAsc(a, b);
}
