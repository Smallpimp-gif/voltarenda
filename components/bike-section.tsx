"use client";

// Секция "Велосипед ВОЛЬТ U2" — v4: чистая rounded-сцена без intro-панели.
//
// Сцена:
// 1. Вход (0 — 0.15): видео "проявляется" через filter brightness 0.3 → 1 и
//    scale 1.1 → 1. Чистый crossfade из темноты.
// 2. Раскрытие (0.15 — 0.7): scrubbing видео, revealed title / desc / metrics
//    поверх видео на scrim'ах.
// 3. Выход (0.92 — 0.98): всё fade out, секция заканчивается.
//
// Видео отрисовывается внутри rounded-[32px] контейнера с padding по краям —
// становится "карточной сценой" как у on.energy, а не full-bleed.

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";
import { SMOOTH_SCROLL } from "./motion-config";

const METRICS: [string, string][] = [
  ["70 км", "запас хода"],
  ["25 км/ч", "макс. скорость"],
  ["150 кг", "нагрузка"],
  ["48V", "батарея"],
];

export function BikeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Под десктоп — горизонтальное видео, под мобилку — вертикальное.
  // Матчим через matchMedia, чтобы избежать hydration mismatch: на сервере
  // и первом клиентском рендере всегда отдаём desktop (оптимально для SSR).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const videoSrc = isMobile ? "/bike-video-mobile.mp4" : "/bike-video-desktop.mp4";

  // rawProgress — линейно следует за скроллом, используется ТОЛЬКО для
  // scrub видео (видео должно быть 1-в-1 с позицией скролла, иначе lag
  // выглядит как баг). Все визуальные transform'ы идут через смутнутый
  // scrollYProgress ниже.
  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Scrubbing видео — задержанный старт. Раньше было `progress / 0.9` —
  // видео начинало крутиться с самого первого пикселя bike-секции, что
  // конфликтовало с уезжающими карточками How-it-works. Теперь видео
  // стоит на первом кадре до прогресса 0.5 (bike полностью занял экран),
  // потом плавно крутится до 0.9, и последние 10% — пауза до выхода.
  useMotionValueEvent(rawProgress, "change", (progress) => {
    const v = videoRef.current;
    if (!v) return;
    const duration = v.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    // Scrub 0→0.65: видео проигрывается полностью к 65% прогресса.
    // 65%→100%: «hold» — полный байк с логотипами ВОЛЬТАРЕНДА висит
    // на экране, пока Tariffs-секция не наедет сверху.
    const scrubProgress = Math.max(0, Math.min(1, progress / 0.65));
    v.currentTime = scrubProgress * duration;
  });

  // Smoothed progress для текстовых / fade-out анимаций — даёт тот самый
  // "масляный" Apple-feel (см. components/motion-config.ts).
  const scrollYProgress = useSpring(rawProgress, SMOOTH_SCROLL);

  // ============================================================
  // Видео проявляется из темноты: brightness + scale crossfade
  // ============================================================
  // Brightness: из тёмного в яркое на входе. НЕТ exit-fade — bike
  // просто уезжает вверх под Tariffs-секцию (z-10 -mt-[100vh]).
  const videoBrightness = useTransform(
    scrollYProgress,
    [0, 0.15],
    [0.3, 1]
  );
  const videoFilter = useMotionTemplate`brightness(${videoBrightness})`;
  // Scale: мягкий zoom-out на входе, потом hold — без shrink на выходе.
  const videoScale = useTransform(
    scrollYProgress,
    [0, 0.2],
    [1.1, 1]
  );
  // Opacity: всегда 1 (нет fade-out). Tariffs наедет сверху.
  const videoOpacity = useTransform(
    scrollYProgress,
    [0, 0.01],
    [1, 1]
  );

  // ============================================================
  // Content reveals поверх видео
  // ============================================================

  // Контент — stagger entry, БЕЗ exit-fade. Bike-сцена остаётся
  // полностью видимой пока Tariffs-секция не наедет сверху.
  const contentOpacity = useTransform(
    scrollYProgress,
    [0.05, 0.12],
    [0, 1]
  );

  const titleOpacity = useTransform(
    scrollYProgress,
    [0.05, 0.12],
    [0, 1]
  );
  const titleY = useTransform(scrollYProgress, [0.05, 0.12], [40, 0]);

  const descOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.18],
    [0, 1]
  );
  const descY = useTransform(scrollYProgress, [0.1, 0.18], [30, 0]);

  const m1Opacity = useTransform(
    scrollYProgress,
    [0.12, 0.17],
    [0, 1]
  );
  const m2Opacity = useTransform(
    scrollYProgress,
    [0.14, 0.19],
    [0, 1]
  );
  const m3Opacity = useTransform(
    scrollYProgress,
    [0.16, 0.21],
    [0, 1]
  );
  const m4Opacity = useTransform(
    scrollYProgress,
    [0.18, 0.23],
    [0, 1]
  );

  const m1Y = useTransform(scrollYProgress, [0.12, 0.17], [24, 0]);
  const m2Y = useTransform(scrollYProgress, [0.14, 0.19], [24, 0]);
  const m3Y = useTransform(scrollYProgress, [0.16, 0.21], [24, 0]);
  const m4Y = useTransform(scrollYProgress, [0.18, 0.23], [24, 0]);

  const metricMotions: { opacity: MotionValue<number>; y: MotionValue<number> }[] = [
    { opacity: m1Opacity, y: m1Y },
    { opacity: m2Opacity, y: m2Y },
    { opacity: m3Opacity, y: m3Y },
    { opacity: m4Opacity, y: m4Y },
  ];

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      id="bike"
      className="relative z-0 -mt-[100vh] h-[300vh] text-white md:h-[420vh]"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Full-bleed scene container без padding и без rounded */}
        <div className="relative h-full w-full overflow-hidden">
          {/* Video — brightness crossfade + scale */}
          <motion.div
            aria-hidden
            style={{
              scale: videoScale,
              filter: videoFilter,
              opacity: videoOpacity,
            }}
            className="absolute inset-0"
          >
            <video
              ref={videoRef}
              key={videoSrc}
              src={videoSrc}
              poster="/rider.webp"
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover object-center"
            />
          </motion.div>

            {/* Контент + scrim'ы над видео */}
            <motion.div
              style={{ opacity: contentOpacity }}
              className="pointer-events-none absolute inset-0"
            >
              {/* Scrim сверху — для eyebrow + title + desc */}
              <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-black/85 via-black/45 to-transparent" />
              {/* Scrim снизу — для метрик */}
              <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              {/* Контент-контейнер — текст сверху опущен (pt-28/pt-32),
                  метрики сверху подняты (pb-24/pb-28 чтобы не прилипали ко дну) */}
              <div className="relative mx-auto flex h-full max-w-content flex-col justify-between px-8 pb-24 pt-28 md:px-12 md:pb-28 md:pt-32">
                {/* Top — eyebrow + title + desc */}
                <div className="max-w-[640px]">
                  <span className="block font-mono text-caption uppercase text-white/60">
                    02 / ВЕЛОСИПЕД
                  </span>
                  <motion.h2
                    style={{ opacity: titleOpacity, y: titleY }}
                    className="mt-4 font-sans text-display-1 text-white"
                  >
                    ВОЛЬТ U2
                  </motion.h2>
                  <motion.p
                    style={{ opacity: descOpacity, y: descY }}
                    className="mt-6 max-w-[44ch] font-sans text-body-lg text-white/75"
                  >
                    Электровелосипед, собранный под повседневную работу курьера.
                    Запас хода — целая смена доставок без подзарядки.
                  </motion.p>
                </div>

                {/* Bottom — метрики */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-t border-white/15 pt-8 sm:gap-x-8 sm:gap-y-8 md:grid-cols-4">
                  {METRICS.map(([value, label], i) => (
                    <motion.div
                      key={label}
                      style={{
                        opacity: metricMotions[i].opacity,
                        y: metricMotions[i].y,
                      }}
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
            </motion.div>
        </div>
      </div>
    </section>
  );
}
