"use client";

// Секция "Велосипед ВОЛЬТ U2" — v5: 1 экран вместо 4.
//
// Что убрано:
// - sticky h-screen + h-[300vh]/420vh — четырёхэкранный scroll-хайджек
// - scrubbing видео через currentTime на onScroll — 4MB видео + jank на 4G
// - 15+ useTransform на scroll'овый прогресс — шло в бюджет main-thread
// - overlap `-mt-[100vh]` с How-it-works (и симметричный overlap Tariffs
//   через tariffs -mt-[100vh] снят параллельно в tariffs-section.tsx)
//
// Что заменено:
// - Сцена — обычная h-screen секция в потоке
// - Видео — autoplay muted playsInline, один прогон через loop
// - Вход (brightness/scale) + stagger контента — useInView (once:true),
//   framer-motion initial/animate. Рендерится один раз при входе в вьюпорт,
//   main-thread свободен на скролл.
// - Выбор mobile/desktop видео — через <source media>, без matchMedia
//   и hydration-dance.

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { APPLE_EASE } from "./motion-config";

const METRICS: [string, string][] = [
  ["~120 км", "запас на 2 АКБ"],
  ["60 + 30 Ач", "два аккумулятора"],
  ["150 кг", "грузоподъёмность"],
  ["25 км/ч", "макс. скорость"],
];

export function BikeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      id="bike"
      className="relative h-screen overflow-hidden text-white"
    >
      {/* Видео — autoplay loop, один прогон, scrub больше не используется */}
      <motion.div
        aria-hidden
        initial={{ scale: 1.1, filter: "brightness(0.3)" }}
        animate={inView ? { scale: 1, filter: "brightness(1)" } : {}}
        transition={{ duration: 1.2, ease: APPLE_EASE }}
        className="absolute inset-0"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/rider.webp"
          className="h-full w-full object-cover object-center"
        >
          {/* media-сорсы: браузер сам выбирает mobile/desktop, без JS. */}
          <source src="/bike-video-mobile.mp4" media="(max-width: 767px)" type="video/mp4" />
          <source src="/bike-video-desktop.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Два scrim'а — сверху под eyebrow/title/desc, снизу под метрики */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-black/85 via-black/45 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/50 to-transparent"
      />

      {/* Контент-контейнер */}
      <div className="relative mx-auto flex h-full max-w-content flex-col justify-between px-8 pb-16 pt-24 md:px-12 md:pb-20 md:pt-28">
        {/* Top — eyebrow + title + desc */}
        <div className="max-w-[640px]">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5, ease: APPLE_EASE }}
            className="block font-mono text-caption uppercase text-white/60"
          >
            02 / ВЕЛОСИПЕД
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.7, ease: APPLE_EASE }}
            className="mt-4 font-sans text-display-1 text-white"
          >
            ВОЛЬТ U2
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.55, duration: 0.7, ease: APPLE_EASE }}
            className="mt-6 max-w-[44ch] font-sans text-body-lg text-white/75"
          >
            Собран под повседневную работу курьера. Два АКБ в комплекте —
            ~60 км на каждом, ~120 км на смену без тревоги о зарядке.
          </motion.p>
        </div>

        {/* Bottom — метрики */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-t border-white/15 pt-8 sm:gap-x-8 sm:gap-y-8 md:grid-cols-4">
          {METRICS.map(([value, label], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.75 + i * 0.08, duration: 0.55, ease: APPLE_EASE }}
            >
              <div className="font-sans text-display-2 tnum text-white">
                {value}
              </div>
              <div className="mt-2 font-mono text-caption uppercase text-white/60">
                {label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
