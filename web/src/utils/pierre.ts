import type { Account } from "@aletheia/shared";

export const PIERRE_API_KEY_URL = "https://pierre.finance/api-key";

export function expiredApiKeyAccounts(accounts: Account[]): Account[] {
  return accounts.filter((a) => a.apiKeyExpired);
}

export function openPierreApiKeyPage(): void {
  window.open(PIERRE_API_KEY_URL, "_blank", "noopener,noreferrer");
}
