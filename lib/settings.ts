// Настройки сайта (число свободных велосипедов) — через lib/store
// (ключ "site/settings"). Показывается на лендинге, правится владельцем.

import { readJSON, writeJSON } from "@/lib/store";

const KEY = "site/settings";

export type SiteSettings = {
  availableBikes: number;
  updatedAt: string | null;
};

const DEFAULTS: SiteSettings = { availableBikes: 0, updatedAt: null };

export async function loadSettings(): Promise<SiteSettings> {
  return { ...DEFAULTS, ...(await readJSON<Partial<SiteSettings>>(KEY, {})) };
}

export async function getAvailableBikes(): Promise<number> {
  return (await loadSettings()).availableBikes;
}

export async function setAvailableBikes(n: number): Promise<SiteSettings> {
  const next: SiteSettings = {
    ...(await loadSettings()),
    availableBikes: Math.max(0, Math.floor(n)),
    updatedAt: new Date().toISOString(),
  };
  await writeJSON(KEY, next);
  return next;
}
