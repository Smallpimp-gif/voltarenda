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
import { TariffCard } from "./tariff-card";
import { APPLE_EASE, EASE, MODAL_SPRING } from "./motion-config";

// ============================================================
// Типы и константы
// ============================================================

export type TariffKey = "three-day" | "week" | "month" | "buyout";

const TARIFFS: {
  key: TariffKey;
  index: string;
  name: string;
  price: string;
  period: string;
  accent?: boolean;
}[] = [
  { key: "three-day", index: "01", name: "3 дня", price: "3500", period: "3 ДНЯ" },
  { key: "week", index: "02", name: "Неделя", price: "5500", period: "7 ДНЕЙ", accent: true },
  { key: "month", index: "03", name: "Месяц", price: "19000", period: "30 ДНЕЙ" },
  { key: "buyout", index: "04", name: "Выкуп", price: "6500", period: "НЕД × 26" },
];

// Value-спеки — те же что в tariffs-section.tsx на лендинге.
const TARIFF_SPECS = [
  { label: "ВЕЛОСИПЕД", value: "ВОЛЬТ U2" },
  { label: "ДВА АККУМУЛЯТОРА", value: "ЗАПАС 70 КМ" },
  { label: "ЗАРЯДКА + ЗАМОК", value: "В КОМПЛЕКТЕ" },
  { label: "ТО И МЕХАНИК", value: "50% НА НАС" },
];

type FormData = {
  tariff: TariffKey | null;
  firstName: string;
  lastName: string;
  phone: string; // хранится в формате +7 (XXX) XXX-XX-XX
  email: string;
  // Паспортные данные убраны — оператор вводит с фото
  photoMain: { fileId: string; previewUrl: string } | null;
  photoRegistration: { fileId: string; previewUrl: string } | null;
  photoSelfie: { fileId: string; previewUrl: string } | null;
  agreed: boolean;
};

const EMPTY_FORM: FormData = {
  tariff: null,
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  photoMain: null,
  photoRegistration: null,
  photoSelfie: null,
  agreed: false,
};

const STEPS = [
  { key: "tariff", label: "Тариф" },
  { key: "contact", label: "Контакты" },
  { key: "photos", label: "Документы" },
  { key: "payment", label: "Оплата" },
] as const;

const STEP_TITLES = [
  "Выбери тариф",
  "Как с тобой связаться",
  "Фото документов",
  "Проверь и оплати",
];

const STEP_SUBTITLES = [
  "В тариф входит ВОЛЬТ U2 + залог 5 000 ₽ (вернём за 3 дня).",
  "Перезвоним после проверки. Без спама.",
  "Три фото: паспорт с фото, прописка, селфи с паспортом. Оператор проверит данные с фото — вводить вручную не нужно.",
  "Осталось оплатить. Залог 5 000 ₽ вернём за 3 рабочих дня.",
];

// Числовые цены тарифов для шага оплаты (без пробелов и ₽).
const TARIFF_PRICES: Record<TariffKey, number> = {
  "three-day": 3500,
  week: 5500,
  month: 19000,
  buyout: 6500, // ₽/неделя × 26 недель = 169 000 ₽ за весь срок
};

const DEPOSIT_RUB = 5000;

function formatRub(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n);
}

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

type ApplyContextValue = {
  open: (tariff?: TariffKey) => void;
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
function computeProgress(form: FormData): number {
  let done = 0;
  if (form.tariff) done++;
  if (
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    form.phone.length > 0 &&
    form.email.length > 0
  )
    done++;
  if (form.photoMain && form.photoRegistration && form.photoSelfie) done++;
  return done;
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
    const { photoMain, photoRegistration, photoSelfie, ...safe } = form;
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

  // Автосейв в localStorage на каждом изменении формы (после гидрации, чтобы
  // не затирать persisted → EMPTY_FORM на первом рендере).
  useEffect(() => {
    if (!hydrated) return;
    // Не сохраняем пустую форму (чтобы не создавать ключ зря).
    const isEmpty =
      !form.tariff &&
      !form.firstName &&
      !form.lastName &&
      !form.phone &&
      !form.email;
    if (isEmpty) return;
    persistForm(form);
  }, [form, hydrated]);

  const open = useCallback((tariff?: TariffKey) => {
    // Смешиваем явный tariff из CTA с persisted формой и вычисляем
    // стартовый шаг — первый НЕзаполненный. Если всё заполнено —
    // отправляем на последний шаг (Оплата).
    setForm((prev) => {
      const next = tariff ? { ...prev, tariff } : prev;
      const progress = computeProgress(next);
      setStepIdx(Math.min(progress, STEPS.length - 1));
      return next;
    });
    setSubmitting(false);
    setSubmitted(false);
    setIsOpen(true);
    trackEvent("MODAL_OPEN", { tariff });
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

function validateStep(step: number, form: FormData): string | null {
  switch (step) {
    case 0:
      if (!form.tariff) return "Выбери тариф";
      return null;
    case 1:
      if (form.firstName.trim().length < 2) return "Укажи имя";
      if (form.lastName.trim().length < 2) return "Укажи фамилию";
      if (phoneDigits(form.phone).length !== 10) return "Телефон в формате +7 (XXX) XXX-XX-XX";
      if (!validEmail(form.email)) return "Проверь email";
      return null;
    case 2:
      if (!form.photoMain) return "Загрузи разворот паспорта с фото";
      if (!form.photoRegistration) return "Загрузи разворот с пропиской";
      if (!form.photoSelfie) return "Загрузи селфи с паспортом в руках";
      return null;
    case 3:
      // Объединённый последний шаг: проверка данных + согласие + оплата
      if (!form.tariff) return "Тариф не выбран";
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

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const goNext = async () => {
    const err = validateStep(stepIdx, form);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (isLast) {
      // Оплата через CloudPayments виджет
      await submitPayment();
      return;
    }
    trackEvent("STEP_COMPLETE", { step: stepIdx + 1, tariff: form.tariff });
    setStepIdx((i) => i + 1);
  };

  const submitPayment = async () => {
    if (!form.tariff) return;
    setSubmitting(true);
    try {
      const tariffName =
        TARIFFS.find((t) => t.key === form.tariff)?.name ?? form.tariff;
      const tariffPrice = TARIFF_PRICES[form.tariff];
      const total = tariffPrice + DEPOSIT_RUB;

      // CloudPayments виджет — lazy-загрузка при первой оплате
      const cp = await loadCloudPayments();
      if (!cp) {
        setError("Платёжный виджет не загрузился. Отключи блокировщик рекламы или попробуй другой браузер.");
        setSubmitting(false);
        return;
      }

      trackEvent("PAYMENT_START", { tariff: form.tariff, amount: total });
      const widget = new cp.CloudPayments();
      widget.pay(
        "charge",
        {
          publicId:
            process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID ?? "",
          description: `Аренда ВОЛЬТ U2 · тариф ${tariffName} + залог`,
          amount: total,
          currency: "RUB",
          accountId: form.email || form.phone,
          email: form.email,
          data: {
            tariff_key: form.tariff,
            tariff_name: tariffName,
            tariff_price: tariffPrice,
            phone: form.phone,
            firstName: form.firstName,
            lastName: form.lastName,
          },
        },
        {
          // Успешная оплата — виджет вернул token, создаём подписку
          onSuccess: async (options: any) => {
            try {
              await fetch("/api/cloudpayments/create-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token: options.token,
                  tariff: {
                    key: form.tariff,
                    name: tariffName,
                    price: tariffPrice,
                  },
                  customer: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone,
                    email: form.email,
                  },
                }),
              });
            } catch {
              // Подписка не создалась — но первый платёж прошёл.
              // Оператор создаст подписку вручную.
            }
            // Показываем success-экран
            trackEvent("PAYMENT_SUCCESS", { tariff: form.tariff, amount: total });
            setSubmitted(true);
            clearPersisted();
            setSubmitting(false);
          },
          onFail: (reason: string) => {
            trackEvent("PAYMENT_FAIL", { tariff: form.tariff, reason });
            setError(
              `Платёж отклонён: ${reason}. Попробуй другую карту или свяжись с нами`,
            );
            setSubmitting(false);
          },
          onComplete: () => {
            // Виджет закрыт (с любым результатом)
          },
        },
      );
      return; // Не сбрасываем submitting — виджет ещё открыт
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
    if (stepIdx === 0 || stepIdx === 2) return; // skip Тариф (кнопки) и Документы (file inputs)
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

          {/* RIGHT — active form step */}
          <div className="flex-1 overflow-y-auto px-gutter py-12 md:py-20">
            <div
              className={`mx-auto w-full ${
                stepIdx === 0 ? "max-w-[880px]" : "max-w-[640px]"
              }`}
            >
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
                  {stepIdx === 0 && <StepTariff form={form} setForm={setForm} />}
                  {stepIdx === 1 && <StepContact form={form} setForm={setForm} />}
                  {stepIdx === 2 && <StepPhotos form={form} setForm={setForm} />}
                  {stepIdx === 3 && (
                    <StepPayment form={form} setForm={setForm} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sticky price summary — над футер-навигацией, чтобы всегда видеть
            выбранный тариф и итоговую сумму, даже когда заполняешь паспорт
            на шаге 3. */}
        {!submitted && form.tariff && (
          <div className="border-t border-[var(--line)] bg-[var(--bg-2)]/80 px-gutter py-3 backdrop-blur-sm lg:pl-[340px]">
            <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-4 font-mono text-caption uppercase">
              <div className="flex items-baseline gap-3 text-mute">
                <span className="text-[var(--text)]">
                  {TARIFFS.find((t) => t.key === form.tariff)?.name}
                </span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">ВОЛЬТ U2</span>
              </div>
              <div className="flex items-baseline gap-3 text-mute">
                <span className="hidden sm:inline">
                  ШАГ {stepIdx + 1} / {STEPS.length}
                </span>
                <span className="hidden sm:inline">·</span>
                <span className="tnum text-[var(--text)]">
                  {formatRub(
                    (form.tariff ? TARIFF_PRICES[form.tariff] : 0) +
                      DEPOSIT_RUB,
                  )}{" "}
                  ₽{form.tariff === "buyout" ? " · ×26 НЕД" : ""}
                </span>
              </div>
            </div>
          </div>
        )}

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
                    <span>Оплатить {form.tariff ? formatRub((TARIFF_PRICES[form.tariff] || 0) + DEPOSIT_RUB) + " ₽" : ""}</span>
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

function StepTariff({
  form,
  setForm,
}: {
  form: FormData;
  setForm: ModalProps["setForm"];
}) {
  return (
    <div className="apply-modal-tariffs mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
      {TARIFFS.map((t) => {
        const selected = form.tariff === t.key;
        return (
          <motion.div
              key={t.key}
              className="relative"
              animate={{ scale: selected ? 1 : 1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
            {selected && (
              <motion.div
                layoutId="tariff-select-ring"
                className="pointer-events-none absolute -inset-[3px] z-10 rounded-lg border-2 border-volt"
                aria-hidden
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <TariffCard
              index={t.index}
              name={t.name}
              price={formatRub(TARIFF_PRICES[t.key])}
              period={t.period}
              specs={TARIFF_SPECS}
              accent={t.accent}
              onApply={() => setForm((f) => ({ ...f, tariff: t.key }))}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

function StepContact({
  form,
  setForm,
}: {
  form: FormData;
  setForm: ModalProps["setForm"];
}) {
  return (
    <div>
      <div className="mt-10 flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Field label="Имя">
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
          <Field label="Фамилия">
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

        <Field label="Телефон">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) =>
              setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))
            }
            autoComplete="tel"
            className={inputCls}
            placeholder="+7 (___) ___-__-__"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            autoComplete="email"
            className={inputCls}
            placeholder="ivan@example.com"
          />
        </Field>
      </div>
    </div>
  );
}

type PhotoSlotKey = "photoMain" | "photoRegistration" | "photoSelfie";

const PHOTO_SLOTS: {
  key: PhotoSlotKey;
  index: string;
  title: string;
  hint: string;
  tips: string[]; // ✅ подсказки для хорошего фото
  capture: "environment" | "user";
}[] = [
  {
    key: "photoMain",
    index: "01",
    title: "Паспорт · разворот с фото",
    hint: "2-3 страница с фото и ФИО",
    tips: [
      "✅ Все данные читаемы, без бликов",
      "✅ Паспорт лежит на ровной поверхности",
      "❌ Не закрывай пальцами текст",
    ],
    capture: "environment",
  },
  {
    key: "photoRegistration",
    index: "02",
    title: "Паспорт · разворот с пропиской",
    hint: "Страница с регистрацией целиком",
    tips: [
      "✅ Виден штамп прописки полностью",
      "✅ Текст читаемый, в фокусе",
      "❌ Не обрезай края страницы",
    ],
    capture: "environment",
  },
  {
    key: "photoSelfie",
    index: "03",
    title: "Селфи с паспортом",
    hint: "Паспорт рядом с лицом",
    tips: [
      "✅ Лицо и паспорт в кадре одновременно",
      "✅ Хорошее освещение, без теней",
      "❌ Не используй фильтры и маски",
    ],
    capture: "user",
  },
];

function StepPhotos({
  form,
  setForm,
}: {
  form: FormData;
  setForm: ModalProps["setForm"];
}) {
  return (
    <div className="mt-10 flex flex-col gap-6">
      {PHOTO_SLOTS.map((slot) => (
        <PhotoSlot
          key={slot.key}
          slot={slot}
          value={form[slot.key]}
          onChange={(dataUrl) =>
            setForm((f) => ({ ...f, [slot.key]: dataUrl }))
          }
        />
      ))}
    </div>
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
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setProcessing(true);
    setUploadError(null);
    try {
      // Сжимаем клиентски перед отправкой — экономим трафик на мобиле
      const compressedBlob = await compressImageToBlob(file, {
        maxDim: 1600,
        quality: 0.85,
      });

      // Загружаем на сервер
      const formData = new FormData();
      formData.append("photo", compressedBlob, `${slot.key}.jpg`);
      formData.append("slot", slot.key);

      const res = await fetch("/api/apply/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Ошибка загрузки");
      }

      const data = await res.json();
      const previewUrl = URL.createObjectURL(compressedBlob);
      onChange({ fileId: data.fileId, previewUrl });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setProcessing(false);
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
            <>
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-volt border-t-transparent" />
              <div className="font-mono text-caption uppercase text-mute">
                ЗАГРУЖАЕМ...
              </div>
            </>
          ) : (
            <>
              <div className="font-sans text-h3">＋ Загрузить фото</div>
              <div className="mt-1 flex flex-col gap-0.5 px-4">
                {slot.tips.map((tip) => (
                  <span key={tip} className="font-mono text-[11px] tracking-[0.04em] text-mute">
                    {tip}
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
  const tariff = TARIFFS.find((t) => t.key === form.tariff);
  const tariffPrice = form.tariff ? TARIFF_PRICES[form.tariff] : 0;
  const total = tariffPrice + DEPOSIT_RUB;

  return (
    <div className="mt-10 flex flex-col">
      {/* Краткое резюме заявки */}
      <div className="border-b border-[var(--line)] pb-3">
        <span className="font-mono text-caption uppercase text-mute">
          ТЕХ. ПАСПОРТ ЗАЯВКИ
        </span>
      </div>
      <SummaryRow
        label="ФИО"
        value={`${form.firstName} ${form.lastName}`.trim().toUpperCase() || "—"}
      />
      <SummaryRow label="ТЕЛЕФОН" value={form.phone || "—"} />
      <SummaryRow label="EMAIL" value={form.email?.toUpperCase() || "—"} />
      <SummaryRow
        label="ДОКУМЕНТЫ"
        value={(() => {
          const total = 3;
          const done = [
            form.photoMain,
            form.photoRegistration,
            form.photoSelfie,
          ].filter(Boolean).length;
          return done === total ? `${done} / ${total} ✓` : `${done} / ${total}`;
        })()}
      />

      {/* Расчёт к оплате */}
      <div className="mt-10 border-b border-[var(--line)] pb-3">
        <span className="font-mono text-caption uppercase text-mute">
          РАСЧЁТ К ОПЛАТЕ
        </span>
      </div>
      <SummaryRow
        label={`ТАРИФ · ${(tariff?.name ?? "").toUpperCase()}`}
        value={
          form.tariff === "buyout"
            ? `${formatRub(tariffPrice)} ₽ / НЕД × 26`
            : `${formatRub(tariffPrice)} ₽`
        }
      />
      <SummaryRow
        label="ЗАЛОГ (ВОЗВРАТНЫЙ)"
        value={`${formatRub(DEPOSIT_RUB)} ₽`}
      />
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-[var(--text)] py-6">
        <span className="font-mono text-caption uppercase text-mute">
          {form.tariff === "buyout" ? "ПЕРВЫЙ ПЛАТЁЖ" : "ИТОГО"}
        </span>
        <span className="font-sans text-h2 tnum">{formatRub(total)} ₽</span>
      </div>
      {form.tariff === "buyout" && (
        <p className="mt-4 max-w-[44ch] font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
          далее автоматически списывается по 6 500 ₽ еженедельно
          в течение 25 недель. итого по тарифу «выкуп»: 169 000 ₽ +
          залог 5 000 ₽. по окончании право собственности на велосипед
          переходит к арендатору.
        </p>
      )}

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

      {/* Платёжка info */}
      <div className="mt-8 flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5">
        <div className="flex items-baseline justify-between gap-4 font-mono text-caption uppercase">
          <span className="text-mute">ПРОВАЙДЕР</span>
          <span className="tnum text-[var(--text)]">CLOUDPAYMENTS</span>
        </div>
        <div className="flex items-baseline justify-between gap-4 font-mono text-caption uppercase">
          <span className="text-mute">ПРИНИМАЕМ</span>
          <span className="tnum text-[var(--text)]">
            VISA / MIR / MASTERCARD / SBP
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4 font-mono text-caption uppercase">
          <span className="text-mute">ЗАЩИТА</span>
          <span className="tnum text-[var(--text)]">3DSECURE · SSL</span>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({
  form,
  onClose,
}: {
  form: FormData;
  onClose: () => void;
}) {
  const tariff = TARIFFS.find((t) => t.key === form.tariff);

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
      <h3 className="mt-8 font-sans text-h2">Заявка принята</h3>
      <p className="mx-auto mt-4 max-w-[44ch] font-sans text-body-lg text-mute">
        Оператор проверит документы и перезвонит на {form.phone || "указанный номер"} в
        течение ~15 минут.
      </p>

      {/* Чеклист статуса — что происходит дальше */}
      <div className="mx-auto mt-8 max-w-[400px] text-left">
        <div className="flex flex-col gap-4 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5">
          <div className="flex items-center gap-3 font-mono text-caption uppercase">
            <span className="text-volt">✓</span>
            <span className="text-[var(--text)]">Оплата прошла</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-caption uppercase">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-volt border-t-transparent" />
            <span className="text-[var(--text)]">Проверка документов · ~15 мин</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-caption uppercase text-mute">
            <span>○</span>
            <span>Готов к выдаче</span>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a
            href="tel:+79013000319"
            className="btn-cta btn-cta-outline flex flex-1 items-center justify-center gap-2 rounded-md border border-[var(--line-strong)] px-4 py-4 font-mono text-caption uppercase hover:border-volt hover:text-volt"
          >
            Позвонить оператору
          </a>
          <a
            href="https://yandex.ru/maps/?rtext=~60.081695,30.311619&rtt=auto"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta btn-cta-outline flex flex-1 items-center justify-center gap-2 rounded-md border border-[var(--line-strong)] px-4 py-4 font-mono text-caption uppercase hover:border-volt hover:text-volt"
          >
            Маршрут до точки
          </a>
        </div>

        {/* Инфо о тарифе */}
        <div className="mt-4 flex items-baseline justify-between gap-4 font-mono text-caption uppercase text-mute">
          <span>ТАРИФ</span>
          <span className="text-[var(--text)]">{tariff?.name ?? "—"} · ВОЛЬТ U2</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="btn-cta btn-cta-volt mt-8 rounded-md bg-volt px-8 py-4 font-mono text-caption uppercase text-ink hover:bg-volt-hover"
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-caption uppercase text-mute">{label}</span>
      {children}
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
// Lazy-загрузка CloudPayments виджета.
// Скрипт ~100KB грузится только когда пользователь дошёл до оплаты,
// а не при первом визите на сайт.
// ============================================================
let cpPromise: Promise<any> | null = null;

function loadCloudPayments(): Promise<any> {
  if ((window as any).cp) return Promise.resolve((window as any).cp);
  if (cpPromise) return cpPromise;

  cpPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://widget.cloudpayments.ru/bundles/cloudpayments.js";
    script.async = true;
    script.onload = () => resolve((window as any).cp || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return cpPromise;
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
