// Контактные ссылки — единый источник истины.
// Раньше URL'ы TG / tel / email были размазаны по компонентам; при
// добавлении WhatsApp проще ввести общий модуль, чем синхронизировать
// 6 файлов вручную.

export const PHONE_RAW = "+79013000319";
export const PHONE_DISPLAY = "+7 (901) 300-03-19";
export const PHONE_TEL = `tel:${PHONE_RAW}`;

export const EMAIL = "hi@voltarenda.ru";
export const EMAIL_MAILTO = `mailto:${EMAIL}`;

export const TELEGRAM_HANDLE = "@Voltarenda";
export const TELEGRAM_URL = "https://t.me/Voltarenda";

// WhatsApp на том же номере что и tel. Если у бренда отдельный WA-канал —
// поменять номер здесь, и все точки входа (mobile-bottom-nav / footer /
// faq / apply success) подтянут новое значение.
// wa.me требует номер без + и без разделителей.
const WHATSAPP_NUMBER = PHONE_RAW.replace(/^\+/, "");

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_URL_WITH_INTENT = `${WHATSAPP_URL}?text=${encodeURIComponent(
  "Здравствуйте, интересует аренда электробайка"
)}`;
