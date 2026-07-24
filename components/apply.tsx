"use client";

// Фул-скрин модалка заявки на аренду — 5 шагов.
// Открывается из любого CTA через useApply().open(tariffKey?).
// Mock submit: на финале показываем экран "Заявка принята".

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { APPLE_EASE, EASE, MODAL_SPRING } from "./motion-config";
import {
  BUYOUT_CONFIGS,
  DEFAULT_BUYOUT_CONFIG,
  getBuyoutConfig,
  getBuyoutPlan,
  batteryContractLine,
  rentWeekly,
  type BuyoutConfigKey,
} from "@/lib/bikes";
import {
  validatePassport,
  validatePersonal,
  validatePassportFields,
  validatePersonalFields,
  type FieldErrors,
  maskSeries,
  maskNumber,
  maskDeptCode,
  maskDate,
} from "@/lib/passport-validate";
// Куда ведёт кнопка «Написать нам» на успешном финале заявки.
const TG_CHAT_URL = "https://t.me/voltarenda_bike";

// ============================================================
// Типы и константы
// ============================================================

export type TariffKey = "three-day" | "week" | "month" | "buyout";

type FormData = {
  firstName: string;
  lastName: string;
  middleName: string; // отчество (распознаётся с паспорта)
  phone: string; // хранится в формате +7 (XXX) XXX-XX-XX
  email: string;
  telegram: string; // @username — в Mini App подтянется сам
  regAddress: string; // адрес регистрации (для договора)
  currentAddress: string; // актуальное место проживания
  // Паспортные данные — авто-распознаются с фото главного разворота
  // (Yandex Vision OCR, см. lib/passport-ocr.ts), пользователь проверяет.
  passport: {
    birthDate: string;
    birthPlace: string;
    series: string;
    number: string;
    issuedBy: string;
    issueDate: string;
    departmentCode: string;
  };
  photoMain: { fileId: string; previewUrl: string } | null;
  photoRegistration: { fileId: string; previewUrl: string } | null;
  photoSelfie: { fileId: string; previewUrl: string } | null;
  agreed: boolean;
  // Тип сделки: аренда (понедельно, бессрочно) или выкуп (срок в неделях).
  mode: "rent" | "buyout";
  // Комплектация АКБ (общая для обоих типов) и срок выкупа.
  buyoutConfig: BuyoutConfigKey;
  buyoutWeeks: number;
  // true, если главное фото распознано как паспорт (или OCR не настроен —
  // тогда не блокируем). false — фото не паспорт → на след. шаг не пускаем.
  mainPhotoRecognized: boolean;
};

const EMPTY_PASSPORT: FormData["passport"] = {
  birthDate: "",
  birthPlace: "",
  series: "",
  number: "",
  issuedBy: "",
  issueDate: "",
  departmentCode: "",
};

const EMPTY_FORM: FormData = {
  firstName: "",
  lastName: "",
  middleName: "",
  phone: "",
  email: "",
  telegram: "",
  regAddress: "",
  currentAddress: "",
  passport: { ...EMPTY_PASSPORT },
  photoMain: null,
  photoRegistration: null,
  photoSelfie: null,
  agreed: false,
  mode: "buyout",
  buyoutConfig: DEFAULT_BUYOUT_CONFIG,
  buyoutWeeks: getBuyoutConfig(DEFAULT_BUYOUT_CONFIG)!.plans[0].weeks,
  mainPhotoRecognized: false,
};

const STEPS = [
  { key: "bike", label: "Условия" },
  { key: "contact", label: "Контакты" },
  { key: "photos", label: "Документы" },
  { key: "review", label: "Заявка" },
] as const;

const STEP_TITLES = [
  "Велосипед и условия",
  "Как с тобой связаться",
  "Документы · фото распознаются автоматически",
  "Проверьте и отправьте",
];

const STEP_SUBTITLES = [
  "Mingto U2 Pro 2000W. Выкуп или аренда, комплект АКБ и срок — цена посчитается сама.",
  "Напишем в Telegram после проверки. Без спама.",
  "Сфотографируй паспорт — данные подставятся сами. Прописка и фото с паспортом в руках. Данные не передаём третьим лицам.",
  "Проверьте данные и отправьте — и сразу напиши нам в Telegram.",
];

// ============================================================
// Analytics — Яндекс.Метрика events
// ============================================================
function trackEvent(goal: string, params?: Record<string, unknown>) {
  try {
    const ym = (window as any).ym;
    if (ym) ym(108583356, "reachGoal", goal, params);
  } catch {
    // Метрика заблокирована или не загружена — тихо игнорим
  }
}

// ============================================================
// Context
// ============================================================

// Выбор, сделанный в конфигураторе на лендинге, переносится в форму.
type BikeConfig = {
  mode?: "rent" | "buyout";
  buyoutConfig?: BuyoutConfigKey;
  buyoutWeeks?: number;
};

type ApplyContextValue = {
  open: (tariff?: TariffKey, cfg?: BikeConfig) => void;
  close: () => void;
  /** Сколько шагов уже заполнено в persisted форме (0..STEPS.length).
   *  Используется для Resume-баннера в Hero. */
  persistedProgress: number;
  /** Есть ли persisted форма с хотя бы одним заполненным шагом. */
  hasPersisted: boolean;
};

const ApplyContext = createContext<ApplyContextValue | null>(null);

export function useApply(): ApplyContextValue {
  const ctx = useContext(ApplyContext);
  if (!ctx) throw new Error("useApply must be used inside <ApplyProvider>");
  return ctx;
}

// Подсчёт сколько шагов формы уже заполнено — используется и в Resume-
// баннере на Hero, и внутри провайдера чтобы определять стартовый stepIdx
// при восстановлении.
// Возвращает индекс шага, на котором стоит открыть форму при восстановлении.
// Шаг «Выкуп» (0) имеет дефолты — его пропускаем, как только заполнены
// контакты: contact-done → photos(2), + photos-done → review(3), иначе → 0.
function computeProgress(form: FormData): number {
  const contactDone =
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    form.phone.length > 0 &&
    form.email.length > 0;
  const photosDone = !!(form.photoMain && form.photoRegistration && form.photoSelfie);
  if (contactDone && photosDone) return 3;
  if (contactDone) return 2;
  return 0;
}

// ============================================================
// Provider — рендерит модалку и хранит state
// ============================================================

// ============================================================
// Persist формы в localStorage.
// Если пользователь случайно закрыл вкладку — данные сохраняются и
// автоматически подхватываются при следующем открытии модалки.
// ============================================================
const STORAGE_KEY = "voltarenda-apply-v2";

function loadPersisted(): Partial<FormData> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<FormData>) : null;
  } catch {
    return null;
  }
}

function persistForm(form: FormData) {
  if (typeof window === "undefined") return;
  try {
    // SECURITY: НЕ сохраняем фото в localStorage.
    // Сохраняем только прогресс заполнения (тариф, контакты).
    const { photoMain, photoRegistration, photoSelfie, mainPhotoRecognized, ...safe } = form;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // localStorage полный или заблокирован — тихо игнорим
  }
}

function clearPersisted() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function ApplyProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Чтобы избежать hydration mismatch, гидратим форму из localStorage
  // на клиенте после первого рендера.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      setForm((prev) => ({ ...prev, ...persisted }));
    }
    setHydrated(true);
  }, []);

  // Авто-подстановка Telegram-username, если форма открыта в Mini App.
  useEffect(() => {
    try {
      const wa = (
        window as unknown as {
          Telegram?: { WebApp?: { initDataUnsafe?: { user?: { username?: string } } } };
        }
      ).Telegram?.WebApp;
      const uname = wa?.initDataUnsafe?.user?.username;
      if (uname) setForm((f) => (f.telegram ? f : { ...f, telegram: uname }));
    } catch {
      /* не в Telegram — поле заполнят вручную */
    }
  }, []);

  // Автосейв в localStorage на каждом изменении формы (после гидрации, чтобы
  // не затирать persisted → EMPTY_FORM на первом рендере).
  useEffect(() => {
    if (!hydrated) return;
    // Не сохраняем пустую форму (чтобы не создавать ключ зря).
    const isEmpty =
      !form.firstName &&
      !form.lastName &&
      !form.phone &&
      !form.email;
    if (isEmpty) return;
    persistForm(form);
  }, [form, hydrated]);

  const open = useCallback((_tariff?: TariffKey, cfg?: BikeConfig) => {
    // Если пришли из конфигуратора с готовым выбором — переносим его в форму
    // и пропускаем шаг «Выкуп»: человек уже выбрал на лендинге.
    setForm((prev) => {
      const next: FormData = { ...prev };
      if (cfg?.mode) next.mode = cfg.mode;
      if (cfg?.buyoutConfig && getBuyoutConfig(cfg.buyoutConfig)) {
        next.buyoutConfig = cfg.buyoutConfig;
        const c = getBuyoutConfig(cfg.buyoutConfig)!;
        const w = cfg.buyoutWeeks;
        next.buyoutWeeks = w && c.plans.some((p) => p.weeks === w) ? w : c.plans[0].weeks;
      }
      const start = Math.min(computeProgress(next), STEPS.length - 1);
      setStepIdx(cfg?.buyoutConfig ? Math.max(1, start) : start);
      return next;
    });
    setSubmitting(false);
    setSubmitted(false);
    setIsOpen(true);
    trackEvent("MODAL_OPEN");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Webvisor privacy — отключаем запись экрана когда модалка открыта,
  // потому что пользователь вводит паспортные данные и загружает фото.
  useEffect(() => {
    const ym = (window as any).ym;
    if (!ym) return;
    if (isOpen) {
      ym(108583356, "params", { __ym: { recording: false } });
    } else {
      ym(108583356, "params", { __ym: { recording: true } });
    }
  }, [isOpen]);

  // ESC закрытие
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Возврат с CloudPayments после успешной оплаты: ?paid=XXX — открываем модалку
  // на success-экране. Persisted форму чистим — заявка завершена.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (!paid) return;
    // Прячем query из URL, чтобы не триггерило повторно
    const url = new URL(window.location.href);
    url.searchParams.delete("paid");
    url.searchParams.delete("amount");
    url.searchParams.delete("tariff");
    window.history.replaceState({}, "", url.toString());
    clearPersisted();
    // Открываем модалку в success-состоянии
    setForm({ ...EMPTY_FORM });
    setStepIdx(STEPS.length - 1);
    setSubmitting(false);
    setSubmitted(true);
    setIsOpen(true);
  }, []);

  // Блокировка скролла body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const persistedProgress = hydrated ? computeProgress(form) : 0;
  const hasPersisted = hydrated && persistedProgress > 0;

  const value = useMemo<ApplyContextValue>(
    () => ({ open, close, persistedProgress, hasPersisted }),
    [open, close, persistedProgress, hasPersisted],
  );

  return (
    <ApplyContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <ApplyModal
            form={form}
            setForm={setForm}
            stepIdx={stepIdx}
            setStepIdx={setStepIdx}
            submitting={submitting}
            setSubmitting={setSubmitting}
            submitted={submitted}
            setSubmitted={setSubmitted}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </ApplyContext.Provider>
  );
}

// ============================================================
// Утилиты — маски, валидация
// ============================================================

function formatPhone(raw: string): string {
  // Сначала снимаем нашу маску "+7 " если она в начале — иначе цифра "7"
  // из маски будет смешиваться с реальными цифрами пользователя.
  let body = raw;
  if (body.startsWith("+7")) body = body.slice(2);
  let d = body.replace(/\D/g, "");
  // Если всё ещё длина 11 и первая 7/8 — это вставлен номер с кодом страны.
  if (d.length === 11 && (d[0] === "7" || d[0] === "8")) d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length === 0) return "";
  let out = "+7 (" + d.slice(0, 3);
  if (d.length >= 3) out += ")";
  if (d.length > 3) out += " " + d.slice(3, 6);
  if (d.length > 6) out += "-" + d.slice(6, 8);
  if (d.length > 8) out += "-" + d.slice(8, 10);
  return out;
}

function phoneDigits(phone: string): string {
  let body = phone;
  if (body.startsWith("+7")) body = body.slice(2);
  let d = body.replace(/\D/g, "");
  if (d.length === 11 && (d[0] === "7" || d[0] === "8")) d = d.slice(1);
  return d;
}

function validEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Ошибки текущего шага с привязкой к полю — чтобы подсветить конкретный
// инпут, а не показывать одну строку внизу формы.
function stepFieldErrors(step: number, form: FormData): FieldErrors {
  if (step === 1) {
    // Контакты: ФИО + адреса (отчество вводится на шаге паспорта) + связь.
    const { middleName: _skip, ...rest } = validatePersonalFields(form);
    const e: FieldErrors = { ...rest };
    if (phoneDigits(form.phone).length !== 10) e.phone = "10 цифр: +7 (XXX) XXX-XX-XX";
    if (!validEmail(form.email)) e.email = "Проверь адрес";
    return e;
  }
  if (step === 2) {
    const e: FieldErrors = { ...validatePassportFields(form.passport) };
    const mid = validatePersonalFields(form).middleName;
    if (mid) e.middleName = mid;
    return e;
  }
  return {};
}

function validateStep(step: number, form: FormData): string | null {
  switch (step) {
    case 0: {
      // Комплектация обязательна; срок — только для выкупа.
      const cfg = getBuyoutConfig(form.buyoutConfig);
      if (!cfg) return "Выбери комплектацию";
      if (form.mode === "buyout" && !cfg.plans.some((p) => p.weeks === form.buyoutWeeks))
        return "Выбери срок выкупа";
      return null;
    }
    case 1: {
      // Контакты + строгая проверка ФИО и адресов (идут в договор).
      if (phoneDigits(form.phone).length !== 10) return "Телефон в формате +7 (XXX) XXX-XX-XX";
      if (!validEmail(form.email)) return "Проверь email";
      const personal = validatePersonal(form);
      if (personal.length) return personal[0];
      return null;
    }
    case 2: {
      if (!form.photoMain) return "Загрузи разворот паспорта с фото";
      if (!form.mainPhotoRecognized)
        return "На фото не распознан паспорт — переснимите разворот с фото чётче";
      if (!form.photoRegistration) return "Загрузи разворот с пропиской";
      if (!form.photoSelfie) return "Загрузи фото с паспортом в руках";
      // Паспортные данные обязательны и без мусора — идут в договор.
      const pass = validatePassport(form.passport);
      if (pass.length) return pass[0];
      return null;
    }
    case 3:
      // Финальный шаг: согласие, затем отправка оператору.
      if (!form.agreed) return "Нужно согласие на обработку данных";
      return null;
    default:
      return null;
  }
}

// ============================================================
// Modal (основной компонент)
// ============================================================

type ModalProps = {
  form: FormData;
  setForm: (f: FormData | ((prev: FormData) => FormData)) => void;
  stepIdx: number;
  setStepIdx: (i: number | ((prev: number) => number)) => void;
  submitting: boolean;
  setSubmitting: (b: boolean) => void;
  submitted: boolean;
  setSubmitted: (b: boolean) => void;
  onClose: () => void;
};

function ApplyModal({
  form,
  setForm,
  stepIdx,
  setStepIdx,
  submitting,
  setSubmitting,
  submitted,
  setSubmitted,
  onClose,
}: ModalProps) {
  const [error, setError] = useState<string | null>(null);
  // Ошибки полей показываем только после первой попытки «Далее» — чтобы не
  // краснить форму, пока человек её ещё заполняет. Дальше они гаснут сами,
  // как только поле исправлено (fieldErrors пересчитывается на каждый ввод).
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const fieldErrors = useMemo(() => stepFieldErrors(stepIdx, form), [stepIdx, form]);
  const err = (key: string) => (showFieldErrors ? fieldErrors[key] : undefined);

  // Новый шаг — начинаем с чистого листа.
  useEffect(() => {
    setShowFieldErrors(false);
    setError(null);
  }, [stepIdx]);

  const goNext = async () => {
    const stepErr = validateStep(stepIdx, form);
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;
    if (stepErr || hasFieldErrors) {
      setShowFieldErrors(true);
      setError(stepErr ?? Object.values(fieldErrors)[0]);
      // Подскроллим к первому проблемному полю и сфокусируем его.
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>('[data-invalid="true"]');
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.querySelector("input")?.focus();
      }, 60);
      return;
    }
    setError(null);
    if (isLast) {
      // Онлайн-оплаты пока нет — отправляем заявку оператору (Telegram).
      await submitApplication();
      return;
    }
    trackEvent("STEP_COMPLETE", { step: stepIdx + 1 });
    setStepIdx((i) => i + 1);
  };

  const submitApplication = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/apply/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tariff: form.mode === "buyout" ? "buyout" : "week",
          mode: form.mode,
          buyoutConfig: form.buyoutConfig,
          buyoutWeeks: form.buyoutWeeks,
          firstName: form.firstName,
          lastName: form.lastName,
          middleName: form.middleName,
          phone: form.phone,
          email: form.email,
          telegram: form.telegram,
          regAddress: form.regAddress,
          currentAddress: form.currentAddress,
          passport: form.passport,
          photoMainId: form.photoMain?.fileId ?? "",
          photoRegistrationId: form.photoRegistration?.fileId ?? "",
          photoSelfieId: form.photoSelfie?.fileId ?? "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.errors?.[0] || data?.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
        setSubmitting(false);
        return;
      }
      trackEvent("APPLICATION_SUBMIT");
      setSubmitted(true);
      clearPersisted();
      setSubmitting(false);
    } catch {
      setError("Сеть недоступна. Проверь соединение и попробуй ещё раз");
      setSubmitting(false);
    }
  };


  const goBack = () => {
    setError(null);
    setStepIdx((i) => Math.max(0, i - 1));
  };

  // Autofocus первого input при переходе на следующий шаг — так juzer
  // сразу может начать печатать. Скипаем шаг 0 (Тариф — там кнопки) и
  // шаг 3 (Фото — там input type=file), чтобы не ломать UX.
  useEffect(() => {
    if (submitted) return;
    if (stepIdx === 1) return; // skip Документы (file inputs)
    const t = setTimeout(() => {
      const scope = document.querySelector<HTMLElement>('[class*="z-[80]"]');
      if (!scope) return;
      const el = scope.querySelector<HTMLInputElement>(
        'input:not([type="file"]):not([type="checkbox"]):not([type="hidden"])',
      );
      el?.focus();
    }, 400); // дождёмся окончания motion exit/enter
    return () => clearTimeout(t);
  }, [stepIdx, submitted]);

  // Enter в пределах формы → goNext (если не в textarea). Делаем через
  // глобальный listener чтобы работало из любого инпута.
  useEffect(() => {
    if (submitted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      if (target.tagName === "BUTTON") return;
      const scope = document.querySelector('[class*="z-[80]"]');
      if (!scope || !scope.contains(target)) return;
      e.preventDefault();
      goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, form, submitted]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Заявка на аренду"
      data-theme="dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: APPLE_EASE }}
      className="fixed inset-0 z-[80] bg-[var(--bg)] text-[var(--text)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) return;
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={MODAL_SPRING}
        className="flex h-full flex-col"
      >
        {/* Header — стилистика лендинга: eyebrow + заголовок */}
        <header className="flex items-center justify-between border-b border-[var(--line)] px-gutter py-6">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-caption uppercase text-mute">
              ОФОРМЛЕНИЕ
            </span>
            <span className="font-sans text-h3">Заявка на аренду</span>
          </div>
          <div className="flex items-center gap-6">
            {!submitted && (
              <span className="hidden font-mono text-caption uppercase text-mute md:inline lg:hidden">
                ШАГ {String(Math.min(stepIdx + 1, STEPS.length)).padStart(2, "0")}
                {" / "}
                {String(STEPS.length).padStart(2, "0")}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="btn-cta flex h-11 w-11 items-center justify-center rounded-md border border-[var(--line-strong)] font-mono text-h3 text-mute hover:border-volt hover:text-volt"
            >
              ×
            </button>
          </div>
        </header>

        {/* Progress bar — только мобилка/планшет, на lg его заменяет side rail */}
        {!submitted && (
          <div className="h-1.5 bg-[var(--line)] lg:hidden">
            <motion.div
              className="h-full bg-volt"
              initial={false}
              animate={{
                width: `${((stepIdx + 1) / STEPS.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>
        )}

        {/* Content — two-column layout: step rail + active form */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — step rail как инженерный тех-паспорт */}
          {!submitted && (
            <aside className="hidden w-[340px] shrink-0 flex-col justify-between border-r border-[var(--line)] py-16 lg:flex">
              <div className="flex flex-col">
                <div className="px-10">
                  <span className="font-mono text-caption uppercase text-mute">
                    ЭТАПЫ ОФОРМЛЕНИЯ
                  </span>
                </div>
                <nav className="mt-8 flex flex-col">
                  {STEPS.map((s, i) => {
                    const active = i === stepIdx;
                    const done = i < stepIdx;
                    const canNavigate = done; // можно вернуться к завершённым шагам
                    return (
                      <button
                        type="button"
                        key={s.key}
                        disabled={!canNavigate}
                        onClick={() => {
                          if (canNavigate) {
                            setError(null);
                            setStepIdx(i);
                          }
                        }}
                        className={`relative flex w-full items-baseline justify-between gap-4 border-b border-[var(--line)] px-10 py-5 text-left first:border-t ${
                          canNavigate ? "cursor-pointer hover:bg-white/5" : active ? "cursor-default" : "cursor-not-allowed"
                        }`}
                      >
                        {/* volt-левая вертикальная планка для активного */}
                        {active && (
                          <motion.span
                            layoutId="apply-rail-bar"
                            className="absolute left-0 top-0 h-full w-[3px] bg-volt"
                            transition={{ duration: 0.45, ease: EASE }}
                          />
                        )}
                        <div className="flex items-baseline gap-4">
                          <span
                            className={`font-mono text-caption tnum uppercase tracking-[0.08em] ${
                              active ? "text-volt" : done ? "text-[var(--text)]" : "text-mute"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`font-sans text-body-lg transition-colors duration-base ease-out-soft ${
                              active
                                ? "text-[var(--text)]"
                                : done
                                  ? "text-[var(--text)]"
                                  : "text-mute"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-[11px] uppercase tracking-[0.08em] ${
                            done ? "text-volt" : active ? "text-mute" : "text-[var(--line-strong)]"
                          }`}
                        >
                          {done ? "ГОТОВО" : active ? "СЕЙЧАС" : "—"}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-10 flex flex-col gap-6 px-10">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-caption uppercase text-mute">
                    НУЖНА ПОМОЩЬ
                  </span>
                  <a
                    href="tel:+79013000319"
                    className="font-mono tnum text-body-lg transition-colors duration-quick ease-out-soft hover:text-volt"
                  >
                    +7 (901) 300-03-19
                  </a>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-caption uppercase text-mute">
                    ПН—ВС
                  </span>
                  <span className="font-mono tnum text-body">
                    09:00 — 21:00
                  </span>
                </div>
              </div>
            </aside>
          )}

          {/* RIGHT — active form step.
              onFocusCapture + scroll-padding + pb — чтобы на мобиле
              экранная клавиатура и нижний футер «Назад/Далее» не закрывали
              поле ввода: при фокусе прокручиваем его к центру видимой зоны. */}
          <div
            className="flex-1 overflow-y-auto px-gutter py-12 [scroll-padding-bottom:9rem] md:py-20"
            onFocusCapture={(e) => {
              const t = e.target as HTMLElement;
              if (t.matches("input, textarea")) {
                setTimeout(() => t.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
              }
            }}
          >
            <div className="mx-auto w-full max-w-[640px] pb-32">
            <AnimatePresence mode="wait">
              {submitted ? (
                <SuccessScreen key="success" form={form} onClose={onClose} />
              ) : (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <StepHeader
                    index={stepIdx + 1}
                    total={STEPS.length}
                    title={STEP_TITLES[stepIdx]}
                    subtitle={STEP_SUBTITLES[stepIdx]}
                  />
                  {stepIdx === 0 && <StepBike form={form} setForm={setForm} />}
                  {stepIdx === 1 && <StepContact form={form} setForm={setForm} err={err} />}
                  {stepIdx === 2 && <StepPhotos form={form} setForm={setForm} err={err} />}
                  {stepIdx === 3 && (
                    <StepPayment form={form} setForm={setForm} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>


        {/* Error message на мобиле — НАД кнопками чтобы не обрезалось */}
        {!submitted && error && (
          <div role="alert" className="animate-slide-in-up border-t border-volt/30 bg-volt/5 px-gutter py-3 text-center font-mono text-caption uppercase text-volt sm:hidden lg:pl-[340px]">
            {error}
          </div>
        )}

        {/* Footer — навигация */}
        {!submitted && (
          <footer className="border-t border-[var(--line)] bg-[var(--bg)] px-gutter py-6 lg:pl-[340px]">
            <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-4">
              <button
                type="button"
                onClick={goBack}
                disabled={stepIdx === 0 || submitting}
                className="btn-cta btn-cta-outline rounded-md border border-[var(--line-strong)] px-6 py-4 font-mono text-caption uppercase hover:border-volt hover:text-volt disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--line-strong)] disabled:hover:text-[var(--text)] disabled:hover:!transform-none"
              >
                ← НАЗАД
              </button>

              {error && (
                <span role="alert" className="animate-slide-in-up hidden flex-1 truncate text-center font-mono text-caption uppercase text-volt sm:inline">
                  {error}
                </span>
              )}

              <button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="btn-cta btn-cta-volt flex items-center gap-3 whitespace-nowrap rounded-md bg-volt px-5 py-4 font-mono text-caption uppercase text-ink hover:bg-volt-hover disabled:cursor-not-allowed disabled:opacity-70 sm:gap-4 sm:px-7"
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                    <span>Отправка…</span>
                  </>
                ) : isLast ? (
                  <>
                    <span>Отправить заявку</span>
                    <span>→</span>
                  </>
                ) : (
                  <>
                    <span>Далее</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
            {/* Ошибка на mobile теперь показывается НАД footer — см. выше */}
          </footer>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Шаги
// ============================================================

function StepHeader({
  index,
  total,
  title,
  subtitle,
}: {
  index: number;
  total: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-[var(--line)] pb-8">
      <span className="font-mono text-caption uppercase text-mute">
        {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        {" · "}
        ШАГ
      </span>
      <h3 className="mt-3 font-sans text-h2">{title}</h3>
      {subtitle && (
        <p className="mt-4 max-w-[52ch] font-sans text-body text-mute">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function weekWord(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "неделя";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "недели";
  return "недель";
}

const fmtRub = (n: number) => n.toLocaleString("ru-RU");

// Шаг «Выкуп»: модель (U2 Pro фиксирована), комплект АКБ и срок выкупа.
// Источник цифр — BUYOUT_CONFIGS (lib/bikes.ts), те же попадают в договор.
function StepBike({
  form,
  setForm,
}: {
  form: FormData;
  setForm: ModalProps["setForm"];
}) {
  const cfg = getBuyoutConfig(form.buyoutConfig) ?? getBuyoutConfig(DEFAULT_BUYOUT_CONFIG)!;
  const plan = getBuyoutPlan(cfg, form.buyoutWeeks);

  const pickConfig = (key: BuyoutConfigKey) =>
    setForm((f) => {
      const c = getBuyoutConfig(key)!;
      const weeksOk = c.plans.some((p) => p.weeks === f.buyoutWeeks);
      return { ...f, buyoutConfig: key, buyoutWeeks: weeksOk ? f.buyoutWeeks : c.plans[0].weeks };
    });

  // Цена недели: выкуп — по выбранному плану, аренда — +10% к базовому.
  const weeklyNow = form.mode === "buyout" ? plan.weekly : rentWeekly(cfg);

  const cardCls = (active: boolean) =>
    `rounded-lg border p-4 text-left transition-colors duration-quick ${
      active ? "border-volt bg-volt/5" : "border-[var(--line-strong)] hover:border-[var(--text)]"
    }`;

  return (
    <div className="mt-10 flex flex-col gap-8">
      {/* Тип сделки */}
      <div>
        <p className="font-mono text-caption uppercase text-mute">Что оформляем</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, mode: "buyout" }))}
            className={cardCls(form.mode === "buyout")}
          >
            <span className="block font-sans text-h3 text-[var(--text)]">Выкуп</span>
            <span className="mt-1 block font-mono text-caption uppercase text-mute">
              Велосипед станет твоим
            </span>
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, mode: "rent" }))}
            className={cardCls(form.mode === "rent")}
          >
            <span className="block font-sans text-h3 text-[var(--text)]">Аренда</span>
            <span className="mt-1 block font-mono text-caption uppercase text-mute">
              Понедельно, без срока
            </span>
          </button>
        </div>
      </div>

      {/* Модель — сейчас одна доступная */}
      <div>
        <p className="font-mono text-caption uppercase text-mute">Модель</p>
        <div className="mt-3 rounded-lg border border-volt bg-volt/5 p-4">
          <span className="block text-body-lg font-semibold text-[var(--text)]">Mingto U2 Pro</span>
          <span className="mt-1 block font-mono text-caption uppercase text-mute">2000 Вт, контроллер 50A</span>
        </div>
      </div>

      {/* Комплект АКБ */}
      <div>
        <p className="font-mono text-caption uppercase text-mute">Аккумуляторы</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BUYOUT_CONFIGS.map((c) => (
            <button key={c.key} type="button" onClick={() => pickConfig(c.key)} className={cardCls(c.key === cfg.key)}>
              <span className="block font-mono text-body-lg font-semibold tabular-nums text-[var(--text)]">
                {c.batteryCount === 1 ? c.batteryParams : `${c.batteryCount} × ${c.batteryParams}`}
              </span>
              <span className="mt-1 block font-mono text-caption uppercase text-mute">
                {c.brand ? `${c.brand} · ` : ""}
                {c.range}
              </span>
              <span className="mt-1 block text-body text-mute">{c.topSpeed}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Срок выкупа — только для выкупа; аренда бессрочная */}
      {form.mode === "buyout" && (
        <div>
          <p className="font-mono text-caption uppercase text-mute">Срок выкупа</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cfg.plans.map((p) => (
              <button
                key={p.weeks}
                type="button"
                onClick={() => setForm((f) => ({ ...f, buyoutWeeks: p.weeks }))}
                className={cardCls(p.weeks === plan.weeks)}
              >
                <span className="block font-sans text-h3 text-[var(--text)]">
                  {p.weeks} {weekWord(p.weeks)}
                </span>
                <span className="mt-1 block font-mono text-caption uppercase text-mute">
                  {fmtRub(p.weekly)} ₽ / неделя
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Итог — недельный платёж (полную выкупную цену клиенту не показываем) */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--line)] pt-5">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-h2 text-[var(--text)]">{fmtRub(weeklyNow)} ₽</span>
          <span className="font-mono text-caption uppercase text-mute">в неделю</span>
        </div>
        <span className="font-mono text-caption uppercase text-mute">
          {form.mode === "buyout"
            ? `выкуп · срок ${plan.weeks} ${weekWord(plan.weeks)}`
            : "аренда · бессрочно"}{" "}
          · залог {fmtRub(cfg.deposit)} ₽
        </span>
      </div>
    </div>
  );
}

function StepContact({
  form,
  setForm,
  err,
}: {
  form: FormData;
  setForm: ModalProps["setForm"];
  err: (key: string) => string | undefined;
}) {
  return (
    <div>
      <div className="mt-10 flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Field label="Имя" required error={err("firstName")}>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              autoComplete="given-name"
              autoFocus
              className={inputCls}
              placeholder="Иван"
            />
          </Field>
          <Field label="Фамилия" required error={err("lastName")}>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              autoComplete="family-name"
              className={inputCls}
              placeholder="Петров"
            />
          </Field>
        </div>

        <Field label="Телефон" required error={err("phone")}>
          <input
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) =>
              setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))
            }
            autoComplete="tel"
            className={inputCls}
            placeholder="+7 (___) ___-__-__"
          />
        </Field>

        <Field label="Email" required error={err("email")}>
          <input
            type="email"
            inputMode="email"
            autoCapitalize="off"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            autoComplete="email"
            className={inputCls}
            placeholder="ivan@example.com"
          />
        </Field>

        <Field label="Telegram (для связи)" hint="Необязательно">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="off"
            value={form.telegram}
            onChange={(e) =>
              setForm((f) => ({ ...f, telegram: e.target.value.replace(/^@/, "") }))
            }
            className={inputCls}
            placeholder="username (без @)"
          />
        </Field>

        <Field
          label="Адрес регистрации (по паспорту)"
          required
          hint="Попадёт в договор — как в прописке"
          error={err("regAddress")}
        >
          <input
            type="text"
            value={form.regAddress}
            onChange={(e) => setForm((f) => ({ ...f, regAddress: e.target.value }))}
            autoComplete="off"
            className={inputCls}
            placeholder="г. Санкт-Петербург, ул. Ленина, д. 5, кв. 12"
          />
        </Field>

        <Field label="Актуальное место проживания" required error={err("currentAddress")}>
          <input
            type="text"
            value={form.currentAddress}
            onChange={(e) => setForm((f) => ({ ...f, currentAddress: e.target.value }))}
            autoComplete="street-address"
            className={inputCls}
            placeholder="Город, улица, дом, кв."
          />
        </Field>
      </div>
    </div>
  );
}

type PhotoSlotKey = "photoMain" | "photoRegistration" | "photoSelfie";

// Подсказка к фото: ok=true — «так надо», ok=false — «так нельзя».
// Значок рисуем сами (volt / красный акцент), без системных эмодзи —
// цветные ✅/❌ выбиваются из монохром+volt айдентики.
type PhotoTip = { ok: boolean; text: string };

const PHOTO_SLOTS: {
  key: PhotoSlotKey;
  index: string;
  title: string;
  hint: string;
  tips: PhotoTip[];
  capture: "environment" | "user";
}[] = [
  {
    key: "photoMain",
    index: "01",
    title: "Паспорт · разворот с фото",
    hint: "Данные распознаются автоматически",
    tips: [
      { ok: true, text: "Все данные читаемы, без бликов" },
      { ok: true, text: "Паспорт лежит на ровной поверхности" },
      { ok: false, text: "Не закрывай пальцами текст" },
    ],
    capture: "environment",
  },
  {
    key: "photoRegistration",
    index: "02",
    title: "Паспорт · разворот с пропиской",
    hint: "Страница с регистрацией целиком",
    tips: [
      { ok: true, text: "Виден штамп прописки полностью" },
      { ok: true, text: "Текст читаемый, в фокусе" },
      { ok: false, text: "Не обрезай края страницы" },
    ],
    capture: "environment",
  },
  {
    key: "photoSelfie",
    index: "03",
    title: "Фото с паспортом в руках",
    hint: "Вы держите раскрытый паспорт",
    tips: [
      { ok: true, text: "Лицо и паспорт в кадре одновременно" },
      { ok: true, text: "Хорошее освещение, без теней" },
      { ok: false, text: "Не используй фильтры и маски" },
    ],
    capture: "user",
  },
];

type OcrState = "idle" | "loading" | "done" | "manual" | "error";

function StepPhotos({
  form,
  setForm,
  err,
}: {
  form: FormData;
  setForm: ModalProps["setForm"];
  err: (key: string) => string | undefined;
}) {
  const [ocr, setOcr] = useState<OcrState>(form.photoMain ? "done" : "idle");

  // Распознаём паспорт после загрузки главного разворота (Yandex Vision
  // через /api/apply/recognize-passport). Поля подставляются, пользователь
  // проверяет. Если OCR не настроен/ошибся — переходим в ручной ввод.
  const recognize = async (fileId: string) => {
    setOcr("loading");
    try {
      const res = await fetch("/api/apply/recognize-passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (data?.configured && data?.ok && data.fields) {
        const fx = data.fields;
        setForm((f) => ({
          ...f,
          firstName: fx.firstName || f.firstName,
          lastName: fx.lastName || f.lastName,
          middleName: fx.middleName || f.middleName,
          mainPhotoRecognized: true,
          passport: {
            birthDate: fx.birthDate || f.passport.birthDate,
            birthPlace: fx.birthPlace || f.passport.birthPlace,
            series: fx.series || f.passport.series,
            number: fx.number || f.passport.number,
            issuedBy: fx.issuedBy || f.passport.issuedBy,
            issueDate: fx.issueDate || f.passport.issueDate,
            departmentCode: fx.departmentCode || f.passport.departmentCode,
          },
        }));
        setOcr("done");
      } else {
        // OCR не настроен — проверить фото нечем, пропускаем (recognized=true).
        // OCR настроен, но паспорт не распознан → это не паспорт: блокируем.
        const configured = !!data?.configured;
        setForm((f) => ({ ...f, mainPhotoRecognized: !configured }));
        setOcr(configured ? "error" : "manual");
      }
    } catch {
      setOcr("error");
      setForm((f) => ({ ...f, mainPhotoRecognized: false }));
    }
  };

  const handleChange = (
    key: PhotoSlotKey,
    value: { fileId: string; previewUrl: string } | null,
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "photoMain") {
      if (value) recognize(value.fileId);
      else {
        setOcr("idle");
        setForm((f) => ({ ...f, mainPhotoRecognized: false }));
      }
    }
  };

  const setP = (key: keyof FormData["passport"], v: string) =>
    setForm((f) => ({ ...f, passport: { ...f.passport, [key]: v } }));

  return (
    <div className="mt-10 flex flex-col gap-6">
      {/* Плашка приватности — свой значок замка вместо системной эмодзи. */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-4">
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden className="shrink-0 text-volt">
          <path d="M3.25 6V4a2.75 2.75 0 0 1 5.5 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="1.4" y="6" width="9.2" height="6.8" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="font-mono text-caption uppercase text-mute">
          Данные не передаём третьим лицам
        </span>
      </div>

      {PHOTO_SLOTS.map((slot) => (
        <PhotoSlot
          key={slot.key}
          slot={slot}
          value={form[slot.key]}
          onChange={(v) => handleChange(slot.key, v)}
        />
      ))}

      {/* Данные паспорта — авто-распознавание + проверка */}
      {form.photoMain && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5">
          <div className="flex items-center gap-2.5 border-b border-[var(--line)] pb-3">
            {ocr === "loading" ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-volt border-t-transparent" />
                <span className="font-mono text-caption uppercase text-mute">Распознаём паспорт…</span>
              </>
            ) : ocr === "done" ? (
              <>
                <span className="text-volt">✓</span>
                <span className="font-mono text-caption uppercase text-[var(--text)]">Данные распознаны — проверьте</span>
              </>
            ) : (
              <span className="font-mono text-caption uppercase text-mute">Данные паспорта</span>
            )}
          </div>

          {ocr !== "loading" && (
            <>
              {(ocr === "manual" || ocr === "error") && (
                <p className="mt-3 font-mono text-caption uppercase text-mute">
                  {ocr === "error" ? "Не удалось распознать — заполните вручную" : "Заполните данные с паспорта"}
                </p>
              )}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PassportField label="Отчество" value={form.middleName} onChange={(v) => setForm((f) => ({ ...f, middleName: v }))} placeholder="Иванович" error={err("middleName")} />
                <PassportField label="Дата рождения" required value={form.passport.birthDate} onChange={(v) => setP("birthDate", maskDate(v))} placeholder="дд.мм.гггг" inputMode="numeric" error={err("birthDate")} />
                <PassportField label="Серия" required value={form.passport.series} onChange={(v) => setP("series", maskSeries(v))} placeholder="0000" inputMode="numeric" error={err("series")} />
                <PassportField label="Номер" required value={form.passport.number} onChange={(v) => setP("number", maskNumber(v))} placeholder="000000" inputMode="numeric" error={err("number")} />
                <PassportField label="Дата выдачи" required value={form.passport.issueDate} onChange={(v) => setP("issueDate", maskDate(v))} placeholder="дд.мм.гггг" inputMode="numeric" error={err("issueDate")} />
                <PassportField label="Код подразделения" required value={form.passport.departmentCode} onChange={(v) => setP("departmentCode", maskDeptCode(v))} placeholder="000-000" inputMode="numeric" error={err("departmentCode")} />
                <div className="sm:col-span-2">
                  <PassportField label="Кем выдан" required value={form.passport.issuedBy} onChange={(v) => setP("issuedBy", v)} placeholder="ГУ МВД России по г. Санкт-Петербургу" error={err("issuedBy")} />
                </div>
                <div className="sm:col-span-2">
                  <PassportField label="Место рождения" required value={form.passport.birthPlace} onChange={(v) => setP("birthPlace", v)} placeholder="гор. Санкт-Петербург" error={err("birthPlace")} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Компактное поле паспорта (плотнее, чем крупный inputCls контактов).
function PassportField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  error?: string;
  required?: boolean;
}) {
  return (
    <label data-invalid={error ? "true" : undefined} className="flex flex-col gap-1.5">
      <span className="font-mono text-caption uppercase text-mute">
        {label}
        {required && <span className="text-volt"> *</span>}
      </span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-[var(--bg)] px-3 py-2.5 font-sans text-body text-[var(--text)] outline-none transition-colors duration-quick placeholder:text-[var(--line-strong)] ${
          error
            ? "border-[#ff6b6b] focus:border-[#ff6b6b]"
            : "border-[var(--line-strong)] focus:border-volt"
        }`}
      />
      {error && <span className="font-mono text-caption text-[#ff6b6b]">{error}</span>}
    </label>
  );
}

function PhotoSlot({
  slot,
  value,
  onChange,
}: {
  slot: (typeof PHOTO_SLOTS)[number];
  value: { fileId: string; previewUrl: string } | null;
  onChange: (photo: { fileId: string; previewUrl: string } | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"compress" | "upload" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setProcessing(true);
    setProgress(0);
    setPhase("compress");
    setUploadError(null);
    try {
      // Сжимаем клиентски перед отправкой — экономим трафик на мобиле
      const compressedBlob = await compressImageToBlob(file, {
        maxDim: 1600,
        quality: 0.85,
      });

      setPhase("upload");

      // Загружаем на сервер через XHR — только он отдаёт upload.onprogress.
      const formData = new FormData();
      formData.append("photo", compressedBlob, `${slot.key}.jpg`);
      formData.append("slot", slot.key);

      const data = await new Promise<{ fileId: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/apply/upload-photo");
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Ошибка ответа сервера"));
            }
          } else {
            let message = "Ошибка загрузки";
            try {
              const parsed = JSON.parse(xhr.responseText);
              if (parsed.message) message = parsed.message;
            } catch {}
            reject(new Error(message));
          }
        };
        xhr.onerror = () => reject(new Error("Ошибка сети"));
        xhr.send(formData);
      });

      const previewUrl = URL.createObjectURL(compressedBlob);
      onChange({ fileId: data.fileId, previewUrl });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setProcessing(false);
      setPhase(null);
      setProgress(0);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Eyebrow с номером слота */}
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-2">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-caption uppercase text-mute">
            {slot.index}
          </span>
          <span className="font-sans text-body-lg">{slot.title}</span>
        </div>
        {value && (
          <span className="font-mono text-caption uppercase text-volt">
            ✓ ЗАГРУЖЕНО
          </span>
        )}
      </div>

      {uploadError && (
        <div role="alert" className="font-mono text-caption uppercase text-danger">
          {uploadError}
        </div>
      )}

      {value ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.previewUrl}
            alt={slot.title}
            className="aspect-[4/3] w-full rounded-lg border border-[var(--line-strong)] object-cover sm:w-48 sm:shrink-0"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <p className="font-mono text-caption uppercase leading-relaxed text-mute">
              {slot.hint}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="self-start rounded-md border border-[var(--line-strong)] px-4 py-2 font-mono text-caption uppercase transition-colors duration-quick ease-out-soft hover:border-volt hover:text-volt"
              >
                Заменить
              </button>
              <button
                type="button"
                onClick={() => {
                  if (value.previewUrl) URL.revokeObjectURL(value.previewUrl);
                  onChange(null);
                }}
                className="self-start rounded-md border border-[var(--line-strong)] px-4 py-2 font-mono text-caption uppercase text-mute transition-colors duration-quick ease-out-soft hover:border-[var(--text)] hover:text-[var(--text)]"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={processing}
          className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--line-strong)] text-center transition-colors duration-quick ease-out-soft hover:border-volt hover:text-volt disabled:cursor-wait disabled:opacity-60"
        >
          {processing ? (
            <div className="flex w-full flex-col items-center gap-3 px-6">
              <div className="font-mono text-caption uppercase text-mute tnum">
                {phase === "compress"
                  ? "Сжимаем фото…"
                  : phase === "upload"
                    ? progress < 100
                      ? `Загружаем · ${progress}%`
                      : "Готово, сохраняем…"
                    : "…"}
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={phase === "upload" ? progress : undefined}
                className="relative h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/10"
              >
                {phase === "compress" ? (
                  <span className="absolute inset-y-0 left-0 w-1/3 animate-[progress-indeterminate_1.2s_ease-in-out_infinite] bg-volt" />
                ) : (
                  <span
                    className="absolute inset-y-0 left-0 bg-volt transition-[width] duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="font-sans text-h3">＋ Загрузить фото</div>
              <div className="mt-2 flex flex-col gap-1 px-4">
                {slot.tips.map((tip) => (
                  <span
                    key={tip.text}
                    className="flex items-start gap-2 text-left font-mono text-[11px] tracking-[0.04em] text-mute"
                  >
                    <span
                      aria-hidden
                      className={`mt-px shrink-0 leading-none ${tip.ok ? "text-volt" : "text-[#ff6b6b]"}`}
                    >
                      {tip.ok ? "✓" : "✕"}
                    </span>
                    <span>{tip.text}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture={slot.capture}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // Reset input чтобы можно было загрузить тот же файл повторно
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
    </div>
  );
}

function StepPayment({
  form,
  setForm,
}: {
  form: FormData;
  setForm: ModalProps["setForm"];
}) {
  const p = form.passport;
  const fio = [form.lastName, form.firstName, form.middleName]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
  const seriesNumber = [p.series, p.number].filter(Boolean).join(" ");
  const docsDone = [form.photoMain, form.photoRegistration, form.photoSelfie].filter(Boolean).length;
  const cfg = getBuyoutConfig(form.buyoutConfig) ?? getBuyoutConfig(DEFAULT_BUYOUT_CONFIG)!;
  const plan = getBuyoutPlan(cfg, form.buyoutWeeks);

  return (
    <div className="mt-10 flex flex-col">
      {/* Условия */}
      <div className="border-b border-[var(--line)] pb-3">
        <span className="font-mono text-caption uppercase text-mute">
          {form.mode === "buyout" ? "ВЫКУП" : "АРЕНДА"}
        </span>
      </div>
      <SummaryRow label="ВЕЛОСИПЕД" value={`${cfg.model} · ${batteryContractLine(cfg)}`} />
      <SummaryRow
        label={form.mode === "buyout" ? "СРОК" : "ПЛАТЁЖ"}
        value={
          form.mode === "buyout"
            ? `${plan.weeks} ${weekWord(plan.weeks)} · ${fmtRub(plan.weekly)} ₽/нед`
            : `${fmtRub(rentWeekly(cfg))} ₽/нед · бессрочно`
        }
      />
      <SummaryRow label="ЗАЛОГ" value={`${fmtRub(cfg.deposit)} ₽`} />

      {/* Резюме заявки */}
      <div className="mt-10 border-b border-[var(--line)] pb-3">
        <span className="font-mono text-caption uppercase text-mute">ДАННЫЕ ЗАЯВКИ</span>
      </div>
      <SummaryRow label="ФИО" value={fio || "—"} />
      <SummaryRow label="ТЕЛЕФОН" value={form.phone || "—"} />
      <SummaryRow label="EMAIL" value={form.email?.toUpperCase() || "—"} />
      <SummaryRow label="АДРЕС РЕГ." value={form.regAddress?.toUpperCase() || "—"} />
      <SummaryRow label="ПРОЖИВАНИЕ" value={form.currentAddress?.toUpperCase() || "—"} />

      {/* Паспорт */}
      <div className="mt-10 border-b border-[var(--line)] pb-3">
        <span className="font-mono text-caption uppercase text-mute">ПАСПОРТ</span>
      </div>
      <SummaryRow label="СЕРИЯ · НОМЕР" value={seriesNumber || "—"} />
      <SummaryRow label="ДАТА РОЖДЕНИЯ" value={p.birthDate || "—"} />
      <SummaryRow label="ДАТА ВЫДАЧИ" value={p.issueDate || "—"} />
      <SummaryRow label="КОД ПОДРАЗДЕЛЕНИЯ" value={p.departmentCode || "—"} />
      <SummaryRow label="КЕМ ВЫДАН" value={p.issuedBy?.toUpperCase() || "—"} />

      {/* Документы и тариф */}
      <div className="mt-10 border-b border-[var(--line)] pb-3">
        <span className="font-mono text-caption uppercase text-mute">ДОКУМЕНТЫ</span>
      </div>
      <SummaryRow
        label="ФОТО"
        value={docsDone === 3 ? `3 / 3 ✓` : `${docsDone} / 3`}
      />

      <p className="mt-6 max-w-[46ch] font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
        По этим данным сформируем договор. После отправки сразу напиши
        нам в Telegram — договоримся о выдаче.
      </p>

      {/* Согласие */}
      <label className="mt-8 flex cursor-pointer items-start gap-4">
        <input
          type="checkbox"
          checked={form.agreed}
          onChange={(e) => setForm((f) => ({ ...f, agreed: e.target.checked }))}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-volt"
        />
        <span className="font-sans text-body leading-[1.55] text-mute">
          Подтверждаю согласие на обработку персональных данных и принимаю
          условия{" "}
          <a
            href="/legal/offer"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--text)] underline underline-offset-4 transition-colors duration-quick ease-out-soft hover:text-volt"
          >
            договора оферты
          </a>{" "}
          и{" "}
          <a
            href="/legal/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--text)] underline underline-offset-4 transition-colors duration-quick ease-out-soft hover:text-volt"
          >
            политики конфиденциальности
          </a>
          .
        </span>
      </label>

    </div>
  );
}

function SuccessScreen({
  onClose,
}: {
  form: FormData;
  onClose: () => void;
}) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="py-8 text-center"
    >
      <div className="relative mx-auto h-20 w-20">
        {/* Pulse ring — расходящееся кольцо */}
        <span className="success-pulse-ring absolute inset-0 rounded-pill bg-volt/30" />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-pill bg-volt font-sans text-h2 text-ink"
        >
          ✓
        </motion.div>
      </div>
      <h3 className="mt-8 font-sans text-h2">Ты крутой!</h3>
      <p className="mx-auto mt-4 max-w-[44ch] font-sans text-body-lg text-mute">
        Спасибо, что заполнил заявку. Остался один шаг — напиши нам,
        и договоримся о выдаче.
      </p>

      <div className="mx-auto mt-8 max-w-[400px] text-left">
        {/* Главное действие — написать нам прямо сейчас */}
        <a
          href={TG_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-cta btn-cta-volt flex w-full items-center justify-center gap-3 rounded-md bg-volt px-6 py-5 font-mono text-caption uppercase text-ink hover:bg-volt-hover"
        >
          <span>Напиши нам в Telegram</span>
          <span>→</span>
        </a>
        <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.06em] text-mute">
          @voltarenda_bike — ответим быстрее всего
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="btn-cta btn-cta-outline mt-8 rounded-md border border-[var(--line-strong)] px-8 py-4 font-mono text-caption uppercase hover:border-volt hover:text-volt"
      >
        Вернуться на сайт
      </button>
    </motion.div>
  );
}

// ============================================================
// Мелкие подкомпоненты
// ============================================================

const inputCls =
  "w-full border-0 border-b-2 border-[var(--line-strong)] bg-transparent px-0 py-4 font-sans text-h3 tnum text-[var(--text)] placeholder:font-sans placeholder:text-body-lg placeholder:text-[var(--line-strong)] focus:border-volt focus:shadow-[0_2px_8px_-2px_rgba(229,255,0,0.3)] focus:outline-none transition-all duration-base ease-out-soft";

function Field({
  label,
  children,
  error,
  required,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label
      data-invalid={error ? "true" : undefined}
      className={`flex flex-col gap-2 ${error ? "[&_input]:!border-[#ff6b6b]" : ""}`}
    >
      <span className="font-mono text-caption uppercase text-mute">
        {label}
        {required && <span className="text-volt"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="font-mono text-caption text-[#ff6b6b]">{error}</span>
      ) : hint ? (
        <span className="font-mono text-caption text-mute opacity-70">{hint}</span>
      ) : null}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-4 font-mono text-caption uppercase">
      <span className="text-mute">{label}</span>
      <span className="tnum text-right text-[var(--text)]">{value}</span>
    </div>
  );
}


// ============================================================
// Сжатие фото перед загрузкой на сервер.
// Возвращает Blob (не base64!) — экономит память и трафик.
// ============================================================
async function compressImageToBlob(
  file: File,
  opts: { maxDim: number; quality: number },
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { maxDim, quality } = opts;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close?.();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("canvas.toBlob returned null"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}
