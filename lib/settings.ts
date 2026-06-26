// Настройки сайта, управляемые из кабинета владельца. Сейчас одно поле —
// число свободных велосипедов (показывается и на лендинге, и в админке).
// JSON-файл data/site/settings.json (gitignored, как остальной data/).
// Атомарная запись tmp+rename.

import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "data", "site");
const FILE = path.join(DIR, "settings.json");

export type SiteSettings = {
  availableBikes: number;
  updatedAt: string | null;
};

const DEFAULTS: SiteSettings = { availableBikes: 0, updatedAt: null };

export function loadSettings(): SiteSettings {
  if (!existsSync(FILE)) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(FILE, "utf-8")) };
  } catch (err) {
    console.error("[settings] не смог прочитать settings.json:", (err as Error).message);
    return DEFAULTS;
  }
}

export function getAvailableBikes(): number {
  return loadSettings().availableBikes;
}

export function setAvailableBikes(n: number): SiteSettings {
  const next: SiteSettings = {
    ...loadSettings(),
    availableBikes: Math.max(0, Math.floor(n)),
    updatedAt: new Date().toISOString(),
  };
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(next, null, 2), "utf-8");
  renameSync(tmp, FILE);
  return next;
}
