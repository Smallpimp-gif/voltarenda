// Контактные ссылки — единый источник истины.
// Раньше URL'ы TG / tel / email были размазаны по компонентам; при
// добавлении второго мессенджера проще ввести общий модуль, чем
// синхронизировать 6 файлов вручную.

export const PHONE_RAW = "+79013000319";
export const PHONE_DISPLAY = "+7 (901) 300-03-19";
export const PHONE_TEL = `tel:${PHONE_RAW}`;

export const EMAIL = "hi@voltarenda.ru";
export const EMAIL_MAILTO = `mailto:${EMAIL}`;

export const TELEGRAM_HANDLE = "@voltarenda_bot";
export const TELEGRAM_URL = "https://t.me/voltarenda_bot";

// ВКонтакте — группа бренда. Плейсхолдер; если у сообщества другой
// адрес (например vk.com/voltarenda-spb) — заменить одну строку, все
// точки входа (mobile-bottom-nav / footer / faq / apply success /
// error / not-found) подтянут новое значение.
// В отличие от WhatsApp, ВК не принимает ?text=... для пре-филла
// сообщения, поэтому URL с намерением = URL группы (пользователь
// переходит, открывает «Написать сообществу» и пишет сам).
export const VK_HANDLE = "vk.com/voltarenda";
export const VK_URL = "https://vk.com/voltarenda";
export const VK_URL_WITH_INTENT = VK_URL;
