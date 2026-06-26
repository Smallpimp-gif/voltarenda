// Хранилище бота — простые JSON-файлы в data/bot/ (вне репозитория,
// .gitignore исключает data/). БД не нужна: десяток арендаторов, один
// процесс-читатель/писатель, гонок нет. Запись атомарная (tmp + rename),
// чтобы файл не побился, если процесс упадёт посреди записи.
//
//   tenants.json      — список арендаторов (генерит import-tenants.py)
//   subscribers.json  — кто нажал «Старт»: chat_id ↔ арендатор
//   sent-log.json     — что уже отправили (защита от повторов)

import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const DATA_DIR = fileURLToPath(new URL("../../data/bot/", import.meta.url));

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load(file, fallback) {
  const path = join(DATA_DIR, file);
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (err) {
    console.error(`[storage] не смог прочитать ${file}:`, err.message);
    return fallback;
  }
}

function save(file, data) {
  ensureDir();
  const path = join(DATA_DIR, file);
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  renameSync(tmp, path); // атомарно на той же ФС
}

// --- Арендаторы (только чтение; источник — import-tenants.py) ---------

export function loadTenants() {
  const tenants = load("tenants.json", null);
  if (!tenants) {
    throw new Error(
      "data/bot/tenants.json не найден. Запусти: python3 bot/import-tenants.py",
    );
  }
  return tenants;
}

// --- Подписчики -------------------------------------------------------
// { [chatId]: { chatId, username, firstName, tenantId|null,
//               status: "active"|"stopped", startedAt, linkedAt } }

export function loadSubscribers() {
  return load("subscribers.json", {});
}

export function saveSubscribers(subs) {
  save("subscribers.json", subs);
}

/** Создаёт/обновляет запись подписчика по входящему «Старту». */
export function upsertSubscriber(subs, { chatId, username, firstName }) {
  const key = String(chatId);
  const existing = subs[key];
  subs[key] = {
    chatId,
    username: username || existing?.username || "",
    firstName: firstName || existing?.firstName || "",
    tenantId: existing?.tenantId ?? null,
    status: existing?.status ?? "active",
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    linkedAt: existing?.linkedAt ?? null,
  };
  return subs[key];
}

// --- Журнал отправленных (дедуп) -------------------------------------

export function loadSentLog() {
  return load("sent-log.json", { keys: [] });
}

export function saveSentLog(log) {
  if (log.keys.length > 1000) log.keys = log.keys.slice(-1000);
  save("sent-log.json", log);
}
