// Кто может быть владельцем — список email в переменной окружения
// OWNER_EMAILS (через запятую). Один или несколько — просто перечисли.
// Владелец не арендатор: регистрируется email+пароль без договора, но
// только если его email в этом списке.

export function ownerEmails(): string[] {
  return (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email: string): boolean {
  return ownerEmails().includes(email.trim().toLowerCase());
}

// Владельцы по Telegram-id (для входа через Mini App). Числовые id через
// запятую в OWNER_TELEGRAM_IDS. Узнать свой id: написать боту @userinfobot.
export function ownerTelegramIds(): string[] {
  return (process.env.OWNER_TELEGRAM_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isOwnerTelegramId(id: string | number): boolean {
  return ownerTelegramIds().includes(String(id));
}
