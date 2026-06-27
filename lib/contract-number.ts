// Сквозной номер договора. Хранится в KV ("site/contract-counter").
// Последний бумажный договор — №17, поэтому стартуем со следующего.

import { readJSON, writeJSON } from "@/lib/store";

const KEY = "site/contract-counter";
const LAST_PAPER = 18; // последний оформлённый вручную — №18 (Роман)

export async function nextContractNumber(): Promise<number> {
  const cur = await readJSON<number>(KEY, LAST_PAPER);
  const next = (Number.isFinite(cur) ? cur : LAST_PAPER) + 1;
  await writeJSON(KEY, next);
  return next;
}
