"use client";

// Секция FAQ — Apple-style scroll reveal + раскрывающиеся вопросы.

import { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
  AnimatePresence,
  MotionValue,
} from "framer-motion";
import { EASE, SMOOTH_SCROLL } from "./motion-config";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Что нужно для оформления?",
    a: "Паспорт (РФ, ВНЖ или иностранный — мы работаем не только с гражданами РФ), селфи для верификации и банковская карта на твоё имя. Весь процесс занимает ~10 минут с телефона.",
  },
  {
    q: "Как происходит оплата?",
    a: "При оформлении замораживается залог 5 000 ₽ на карте. Оплата тарифа списывается автоматически раз в выбранный период (3 дня, неделя или месяц).",
  },
  {
    q: "Что если я сломаю или разобью велик?",
    a: "Мелкие поломки от повседневной эксплуатации мы чиним сами. За серьёзные повреждения по вине курьера удерживается из залога по фактической стоимости ремонта.",
  },
  {
    q: "Можно ли отменить аренду?",
    a: "Да, до момента выдачи велика — отмена бесплатна, залог возвращается. После выдачи тариф не возвращается, но ты можешь не продлевать на следующий период.",
  },
  {
    q: "Как работает выкуп?",
    a: "Платишь 6 500 ₽ в неделю 26 недель подряд (итого 169 000 ₽) — велик становится твоим. Всё это время ты на нём работаешь, никаких дополнительных платежей.",
  },
  {
    q: "Можно ли продлить аренду?",
    a: "Продление автоматическое: если не отменил за 3 дня до конца периода — списывается следующий тариф и ты продолжаешь работать.",
  },
  {
    q: "Как работает автосписание?",
    a: "При оформлении ты привязываешь карту через CloudPayments. Аренда списывается автоматически каждый период (3 дня, неделя или месяц). Если хочешь остановить — отменяй за 3 дня до конца периода, и следующее списание не произойдёт.",
  },
  {
    q: "Что если велик украдут?",
    a: "Ты возмещаешь стоимость велосипеда (165 000 ₽). Поэтому храни в закрытом помещении и всегда на замок. Если украли — сообщи нам в течение 6 часов и напиши заявление в полицию.",
  },
  {
    q: "Можно приостановить аренду?",
    a: "Отменяешь за 3 дня до конца текущего периода — и следующий не списывается. Велик возвращаешь на точку. Когда будешь готов — оформляешь заново за 10 минут.",
  },
  {
    q: "Сколько километров на одном заряде?",
    a: "Около 60 км на основной батарее (60 Ач) — подтверждено отзывами наших арендаторов, не маркетинговое обещание. В комплекте вторая запасная батарея (30 Ач) — итого ~120 км на смену. Реальный запас зависит от веса курьера, стиля езды и температуры.",
  },
  {
    q: "Что если обе батареи разрядятся?",
    a: "~120 км на смену — это с запасом под типичную курьерскую загрузку. Если всё-таки разрядилось — велосипед едет и без мотора как обычный, доедешь до дома или до точки. Но на практике до этого не доходит: вторую батарею курьеры обычно трогают только к вечеру.",
  },
  {
    q: "Где и как заряжать батареи?",
    a: "От обычной домашней розетки 220V через зарядник из комплекта. Обе батареи заряжаешь дома за ночь — к утру готов на новую смену. Возить их на точку выдачи не нужно.",
  },
  {
    q: "Я не гражданин РФ. Можно арендовать?",
    a: "Да. Принимаем паспорт РФ, вид на жительство (ВНЖ), разрешение на временное проживание (РВП) или иностранный паспорт. Главное — чтобы документ был действующим, и банковская карта оформлена на твоё имя. Если работаешь по патенту — тоже подходит.",
  },
  {
    q: "А по ПДД можно ехать 65 км/ч? Нужны ли права?",
    a: "По стоковой прошивке велосипед едет до 25 км/ч — это категория «электровелосипед», без прав, без регистрации, можно по велодорожкам. Технически двигатель U2 способен на большее (до 65 км/ч), но в этом режиме ТС юридически переходит в категорию «мопед»: нужны права категории «М» (или любой другой), движение только по проезжей части, велодорожки запрещены. Что выбрать — твоё решение и твоя ответственность.",
  },
];

// FAQ Schema (FAQPage) — JSON-LD для rich snippets в Google SERP.
// Google показывает dropdown с вопросами прямо в результатах поиска.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export function FaqSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "start 10%"],
  });
  const scrollYProgress = useSpring(rawProgress, SMOOTH_SCROLL);

  // Header (левая колонка)
  const headerOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1], { ease: EASE });
  const headerScale = useTransform(scrollYProgress, [0, 0.4], [0.95, 1], { ease: EASE });
  const headerBlurVal = useTransform(scrollYProgress, [0, 0.4], [6, 0], { ease: EASE });
  const headerBlur = useMotionTemplate`blur(${headerBlurVal}px)`;

  // 6 вопросов — inline stagger
  const o1 = useTransform(scrollYProgress, [0.15, 0.5], [0, 1], { ease: EASE });
  const y1 = useTransform(scrollYProgress, [0.15, 0.5], [24, 0], { ease: EASE });
  const b1 = useTransform(scrollYProgress, [0.15, 0.5], [6, 0], { ease: EASE });
  const f1 = useMotionTemplate`blur(${b1}px)`;

  const o2 = useTransform(scrollYProgress, [0.18, 0.53], [0, 1], { ease: EASE });
  const y2 = useTransform(scrollYProgress, [0.18, 0.53], [24, 0], { ease: EASE });
  const b2 = useTransform(scrollYProgress, [0.18, 0.53], [6, 0], { ease: EASE });
  const f2 = useMotionTemplate`blur(${b2}px)`;

  const o3 = useTransform(scrollYProgress, [0.21, 0.56], [0, 1], { ease: EASE });
  const y3 = useTransform(scrollYProgress, [0.21, 0.56], [24, 0], { ease: EASE });
  const b3 = useTransform(scrollYProgress, [0.21, 0.56], [6, 0], { ease: EASE });
  const f3 = useMotionTemplate`blur(${b3}px)`;

  const o4 = useTransform(scrollYProgress, [0.24, 0.59], [0, 1], { ease: EASE });
  const y4 = useTransform(scrollYProgress, [0.24, 0.59], [24, 0], { ease: EASE });
  const b4 = useTransform(scrollYProgress, [0.24, 0.59], [6, 0], { ease: EASE });
  const f4 = useMotionTemplate`blur(${b4}px)`;

  const o5 = useTransform(scrollYProgress, [0.27, 0.62], [0, 1], { ease: EASE });
  const y5 = useTransform(scrollYProgress, [0.27, 0.62], [24, 0], { ease: EASE });
  const b5 = useTransform(scrollYProgress, [0.27, 0.62], [6, 0], { ease: EASE });
  const f5 = useMotionTemplate`blur(${b5}px)`;

  const o6 = useTransform(scrollYProgress, [0.3, 0.65], [0, 1], { ease: EASE });
  const y6 = useTransform(scrollYProgress, [0.3, 0.65], [24, 0], { ease: EASE });
  const b6 = useTransform(scrollYProgress, [0.3, 0.65], [6, 0], { ease: EASE });
  const f6 = useMotionTemplate`blur(${b6}px)`;

  const o7 = useTransform(scrollYProgress, [0.33, 0.68], [0, 1], { ease: EASE });
  const y7 = useTransform(scrollYProgress, [0.33, 0.68], [24, 0], { ease: EASE });
  const b7 = useTransform(scrollYProgress, [0.33, 0.68], [6, 0], { ease: EASE });
  const f7 = useMotionTemplate`blur(${b7}px)`;

  const o8 = useTransform(scrollYProgress, [0.36, 0.71], [0, 1], { ease: EASE });
  const y8 = useTransform(scrollYProgress, [0.36, 0.71], [24, 0], { ease: EASE });
  const b8 = useTransform(scrollYProgress, [0.36, 0.71], [6, 0], { ease: EASE });
  const f8 = useMotionTemplate`blur(${b8}px)`;

  const o9 = useTransform(scrollYProgress, [0.39, 0.74], [0, 1], { ease: EASE });
  const y9 = useTransform(scrollYProgress, [0.39, 0.74], [24, 0], { ease: EASE });
  const b9 = useTransform(scrollYProgress, [0.39, 0.74], [6, 0], { ease: EASE });
  const f9 = useMotionTemplate`blur(${b9}px)`;

  const o10 = useTransform(scrollYProgress, [0.42, 0.77], [0, 1], { ease: EASE });
  const y10 = useTransform(scrollYProgress, [0.42, 0.77], [24, 0], { ease: EASE });
  const b10 = useTransform(scrollYProgress, [0.42, 0.77], [6, 0], { ease: EASE });
  const f10 = useMotionTemplate`blur(${b10}px)`;

  const o11 = useTransform(scrollYProgress, [0.45, 0.80], [0, 1], { ease: EASE });
  const y11 = useTransform(scrollYProgress, [0.45, 0.80], [24, 0], { ease: EASE });
  const b11 = useTransform(scrollYProgress, [0.45, 0.80], [6, 0], { ease: EASE });
  const f11 = useMotionTemplate`blur(${b11}px)`;

  const o12 = useTransform(scrollYProgress, [0.48, 0.83], [0, 1], { ease: EASE });
  const y12 = useTransform(scrollYProgress, [0.48, 0.83], [24, 0], { ease: EASE });
  const b12 = useTransform(scrollYProgress, [0.48, 0.83], [6, 0], { ease: EASE });
  const f12 = useMotionTemplate`blur(${b12}px)`;

  const o13 = useTransform(scrollYProgress, [0.51, 0.86], [0, 1], { ease: EASE });
  const y13 = useTransform(scrollYProgress, [0.51, 0.86], [24, 0], { ease: EASE });
  const b13 = useTransform(scrollYProgress, [0.51, 0.86], [6, 0], { ease: EASE });
  const f13 = useMotionTemplate`blur(${b13}px)`;

  const o14 = useTransform(scrollYProgress, [0.54, 0.89], [0, 1], { ease: EASE });
  const y14 = useTransform(scrollYProgress, [0.54, 0.89], [24, 0], { ease: EASE });
  const b14 = useTransform(scrollYProgress, [0.54, 0.89], [6, 0], { ease: EASE });
  const f14 = useMotionTemplate`blur(${b14}px)`;

  const items: {
    opacity: MotionValue<number>;
    y: MotionValue<number>;
    filter: MotionValue<string>;
  }[] = [
    { opacity: o1, y: y1, filter: f1 },
    { opacity: o2, y: y2, filter: f2 },
    { opacity: o3, y: y3, filter: f3 },
    { opacity: o4, y: y4, filter: f4 },
    { opacity: o5, y: y5, filter: f5 },
    { opacity: o6, y: y6, filter: f6 },
    { opacity: o7, y: y7, filter: f7 },
    { opacity: o8, y: y8, filter: f8 },
    { opacity: o9, y: y9, filter: f9 },
    { opacity: o10, y: y10, filter: f10 },
    { opacity: o11, y: y11, filter: f11 },
    { opacity: o12, y: y12, filter: f12 },
    { opacity: o13, y: y13, filter: f13 },
    { opacity: o14, y: y14, filter: f14 },
  ];

  return (
    <section
      ref={sectionRef}
      data-theme="light"
      id="faq"
      className="relative bg-[var(--bg)] text-[var(--text)]"
    >
      {/* FAQPage JSON-LD для Google rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-content px-gutter py-section-y">
        <div className="grid grid-cols-1 gap-6 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          {/* Левая — header */}
          <motion.div
            style={{ opacity: headerOpacity, scale: headerScale, filter: headerBlur }}
            className="flex flex-col gap-4 pb-6 lg:pb-0"
          >
            <span className="font-mono text-caption uppercase text-mute">
              07 / FAQ
            </span>
            <h2 className="font-sans text-h2">Частые вопросы</h2>
            <p className="mt-2 max-w-[32ch] font-sans text-body text-mute">
              Не нашёл ответ?{" "}
              <a
                href="https://t.me/Voltarenda"
                className="inline-block py-1 text-[var(--text)] underline underline-offset-4 transition-colors duration-quick ease-out-soft hover:text-volt"
              >
                Напиши нам в Telegram
              </a>
              {" "}— ответим за 10 минут.
            </p>
          </motion.div>

          {/* Правая — список */}
          <div className="flex flex-col">
            {FAQ.map((item, i) => {
              const isOpen = openIdx === i;
              return (
                <motion.div
                  key={item.q}
                  style={{
                    opacity: items[i].opacity,
                    y: items[i].y,
                    filter: items[i].filter,
                  }}
                  className="border-b border-[var(--line)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 py-6 text-left"
                  >
                    <span className="font-sans text-h3">{item.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0, scale: isOpen ? 0.85 : 1 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="font-mono text-h3 text-mute"
                    >
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${i}`}
                        role="region"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[60ch] pb-6 font-sans text-body leading-[1.55] text-mute">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
