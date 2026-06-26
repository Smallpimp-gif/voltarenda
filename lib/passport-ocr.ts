// Распознавание паспорта РФ через Yandex Vision OCR.
//
// Почему Yandex: исходящий REST-вызов (не упирается в блокировку входящих
// зарубежных IP на проде, см. memory), данные обрабатываются в РФ (152-ФЗ),
// готовая модель "passport" для главного разворота, ~0.13 ₽/документ.
//
// Активируется переменными окружения:
//   YANDEX_VISION_API_KEY — API-ключ сервисного аккаунта Yandex Cloud
//   YANDEX_FOLDER_ID      — id каталога (folder) в Yandex Cloud
// Если их нет — recognizePassport вернёт { configured: false }, и форма
// просто оставит поля для ручного ввода.
//
// Dev-мок: OCR_MOCK=1 (в .env.local) возвращает образец данных без вызова
// сети — чтобы прогнать UX авто-заполнения локально.

const OCR_URL = "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText";

export type PassportFields = {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string; // дд.мм.гггг (как на паспорте)
  birthPlace: string;
  series: string;
  number: string;
  issuedBy: string;
  issueDate: string; // дд.мм.гггг
  departmentCode: string;
};

export type RecognizeResult =
  | { configured: false }
  | { configured: true; ok: true; fields: PassportFields }
  | { configured: true; ok: false; error: string };

const EMPTY: PassportFields = {
  lastName: "",
  firstName: "",
  middleName: "",
  birthDate: "",
  birthPlace: "",
  series: "",
  number: "",
  issuedBy: "",
  issueDate: "",
  departmentCode: "",
};

const MOCK: PassportFields = {
  lastName: "Иванов",
  firstName: "Иван",
  middleName: "Иванович",
  birthDate: "01.01.1995",
  birthPlace: "гор. Санкт-Петербург",
  series: "4017",
  number: "123456",
  issuedBy: "ТП №1 ОУФМС России по гор. Санкт-Петербургу",
  issueDate: "15.02.2016",
  departmentCode: "780-001",
};

// Сопоставление имён сущностей Yandex Vision (модель passport) с полями.
// Имена могут отличаться между версиями модели — собираем по нескольким
// возможным алиасам, поэтому маппинг — массив вариантов.
const ENTITY_MAP: Record<keyof PassportFields, string[]> = {
  lastName: ["surname", "last_name", "family_name"],
  firstName: ["name", "first_name", "given_name"],
  middleName: ["patronymic", "middle_name", "second_name"],
  birthDate: ["birth_date", "date_of_birth", "birthdate"],
  birthPlace: ["birth_place", "place_of_birth", "birthplace"],
  series: ["series", "doc_series", "passport_series"],
  number: ["number", "doc_number", "passport_number"],
  issuedBy: ["issued_by", "authority", "issue_authority", "issuer"],
  issueDate: ["issue_date", "date_of_issue", "issuedate"],
  departmentCode: ["subdivision_code", "department_code", "issue_authority_code", "code"],
};

type YandexEntity = { name?: string; text?: string };

function parseEntities(entities: YandexEntity[]): PassportFields {
  const byName = new Map<string, string>();
  for (const e of entities) {
    if (e?.name && typeof e.text === "string") {
      byName.set(e.name.toLowerCase(), e.text.trim());
    }
  }
  const out: PassportFields = { ...EMPTY };
  (Object.keys(ENTITY_MAP) as (keyof PassportFields)[]).forEach((field) => {
    for (const alias of ENTITY_MAP[field]) {
      const v = byName.get(alias);
      if (v) {
        out[field] = v;
        break;
      }
    }
  });

  // Серия+номер иногда приходят одной строкой "4017 123456".
  if (!out.series && !out.number) {
    const combined = byName.get("series_number") || byName.get("series_and_number");
    if (combined) {
      const digits = combined.replace(/\D/g, "");
      if (digits.length >= 10) {
        out.series = digits.slice(0, 4);
        out.number = digits.slice(4, 10);
      }
    }
  }
  return out;
}

export async function recognizePassport(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<RecognizeResult> {
  if (process.env.OCR_MOCK === "1") {
    return { configured: true, ok: true, fields: MOCK };
  }

  const apiKey = process.env.YANDEX_VISION_API_KEY;
  const folderId = process.env.YANDEX_FOLDER_ID;
  if (!apiKey || !folderId) return { configured: false };

  try {
    const res = await fetch(OCR_URL, {
      method: "POST",
      headers: {
        Authorization: `Api-Key ${apiKey}`,
        "x-folder-id": folderId,
        "x-data-logging-enabled": "false", // не логировать ПДн на стороне Yandex
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mimeType,
        languageCodes: ["ru"],
        model: "passport",
        content: imageBuffer.toString("base64"),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { configured: true, ok: false, error: `Vision ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      result?: { textAnnotation?: { entities?: YandexEntity[] } };
    };
    const entities = data?.result?.textAnnotation?.entities ?? [];
    return { configured: true, ok: true, fields: parseEntities(entities) };
  } catch (err) {
    return { configured: true, ok: false, error: (err as Error).message };
  }
}
