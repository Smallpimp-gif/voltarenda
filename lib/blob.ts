// Хранилище фото паспорта. На Cloudflare (без диска) — через сам Telegram:
// бот шлёт файл в приватный чат и хранит file_id. Локально — папка uploads/.
// Ref: "tg:<file_id>" в Telegram-режиме, uuid — локально.
//
// Зачем Telegram, а не облако: бесплатно, доступно из РФ, без карты, и
// оператор сразу видит фото в чате. ПДн: фото лежат в Telegram (приватный
// чат бота) — приемлемый MVP-компромисс.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOADS = path.join(process.cwd(), "uploads");

function tgConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_STORAGE_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

function extFor(contentType: string): "png" | "jpg" {
  return contentType.includes("png") ? "png" : "jpg";
}

export async function savePhoto(buffer: Buffer, contentType: string): Promise<string> {
  const tg = tgConfig();
  if (tg) {
    const form = new FormData();
    form.append("chat_id", tg.chatId);
    const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
    form.append("document", blob, `passport.${extFor(contentType)}`);
    const res = await fetch(`https://api.telegram.org/bot${tg.token}/sendDocument`, {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { ok: boolean; result?: { document?: { file_id?: string } } };
    const fileId = data?.result?.document?.file_id;
    if (!data.ok || !fileId) throw new Error("telegram sendDocument failed");
    return `tg:${fileId}`;
  }
  // Локально — файл.
  const id = randomUUID();
  const ext = extFor(contentType);
  await fs.mkdir(UPLOADS, { recursive: true });
  await fs.writeFile(path.join(UPLOADS, `${id}.${ext}`), buffer);
  return id;
}

export async function readPhoto(ref: string): Promise<{ buffer: Buffer; mime: string } | null> {
  if (ref.startsWith("tg:")) {
    const tg = tgConfig();
    if (!tg) return null;
    const fileId = ref.slice(3);
    try {
      const r1 = await fetch(
        `https://api.telegram.org/bot${tg.token}/getFile?file_id=${encodeURIComponent(fileId)}`,
      );
      const d1 = (await r1.json()) as { ok: boolean; result?: { file_path?: string } };
      const fp = d1?.result?.file_path;
      if (!fp) return null;
      const r2 = await fetch(`https://api.telegram.org/file/bot${tg.token}/${fp}`);
      if (!r2.ok) return null;
      const buffer = Buffer.from(await r2.arrayBuffer());
      const mime = fp.endsWith(".png") ? "image/png" : "image/jpeg";
      return { buffer, mime };
    } catch {
      return null;
    }
  }
  // Локально: ref = uuid.
  for (const ext of ["jpg", "png"] as const) {
    try {
      const buffer = await fs.readFile(path.join(UPLOADS, `${ref}.${ext}`));
      return { buffer, mime: ext === "png" ? "image/png" : "image/jpeg" };
    } catch {
      /* следующее расширение */
    }
  }
  return null;
}
