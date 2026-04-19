"use client";

// Секция "Велосипед ВОЛЬТ U2" — v6: sticky + scroll-scrub возвращены.
//
// История:
// - v4 было 4 экрана scroll-хайджека (h-300vh/420vh) + 15+ useTransform на
//   scroll для контентных reveal'ов.
// - v5 (моя ошибка) — убрал scrub и sticky вообще, сделал h-screen autoplay.
//   Юзер указал: пропал главный брендовый момент — видео не реагирует на
//   скролл. Ок, возвращаю scrub.
// - v6 — компромисс: sticky + scrub остаются (брендовый момент жив), но
//   длина секции ~2 экрана вместо 4 (h-[180vh] md:h-[200vh]). Контентные
//   reveal'ы — через useInView (один раз при входе), а не через 15+
//   scroll-useTransform. Main-thread разгружен, feel сохранён.

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { APPLE_EASE } from "./motion-config";

const METRICS: { value: string; label: string }[] = [
  { value: "до 120 км", label: "пробег на смену" },
  { value: "60 + 30 Ач", label: "LiFePO4 · 2 АКБ" },
  { value: "150 кг", label: "грузоподъёмность" },
  { value: "до 65 км/ч", label: "макс. скорость" },
];

export function BikeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.1 });

  // Выбор mobile/desktop видео через matchMedia.
  // Пробовали `<source media="(max-width: 767px)">` — НЕ РАБОТАЕТ:
  // атрибут media на <source> внутри <video> исключён из HTML5-спеки,
  // Chrome/Safari всегда берут первый <source> независимо от viewport.
  // Hydration-safe: SSR отдаёт desktop (isMobile=false), на клиенте
  // matchMedia-эффект мгновенно свапает к mobile, key пересоздаёт <video>.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const videoSrc = isMobile ? "/bike-video-mobile.mp4" : "/bike-video-desktop.mp4";

  // Scrub видео по скроллу — брендовый момент ТОЛЬКО на десктопе.
  // На мобилке scrub убран: для scrub нужна секция h-[140–200vh]
  // (sticky h-screen + 40–100vh скролла), что давало dead-space между
  // концом видео и блоком BikeSpecs — юзер видел пустой чёрный участок
  // и отмечал «что-то сломано». На мобилке видео просто autoplay loop,
  // секция компактна = h-screen, дальше сразу specs.
  //
  // Desktop scrub сохранён:
  // - НЕ оборачивать в useSpring: inertia ~50–100ms даёт ощущение
  //   «видео отстаёт от пальца». Direct raw progress — мгновенная
  //   связь палец↔видео.
  // - rAF throttle: scroll fires 100+ events/sec, каждый seek в mp4
  //   это синхронный decode. Throttle до 1 update за frame.
  // - Threshold 0.85 = видео проигрывается за первые 85% прогресса,
  //   последние 15% — hold на финальном кадре перед Tariffs.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const rafPendingRef = useRef(false);
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (isMobile) return; // mobile uses autoplay, no scrub
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    requestAnimationFrame(() => {
      rafPendingRef.current = false;
      const v = videoRef.current;
      if (!v) return;
      const d = v.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      v.currentTime = Math.max(0, Math.min(1, progress / 0.85)) * d;
    });
  });

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      id="bike"
      // Mobile — h-screen (без dead-space до BikeSpecs).
      // Desktop — h-[200vh] для scrub-scroll space (sticky child h-screen
      // + 100vh scrollspace прокручивают currentTime видео).
      // ВАЖНО: НЕ добавлять overflow-hidden на section — это ломает
      // position: sticky дочернего элемента (sticky requires nearest
      // scrolling ancestor; overflow-hidden создаёт scroll context).
      // Видео clip'ится внутри child'a, который имеет overflow-hidden.
      className="relative h-screen text-white md:h-[200vh]"
    >
      <div className="relative h-full overflow-hidden md:sticky md:top-0 md:h-screen">
        {/* Видео — currentTime управляется scroll-scrub'ом, без autoplay */}
        <motion.div
          aria-hidden
          initial={{ scale: 1.1, filter: "brightness(0.3)" }}
          animate={inView ? { scale: 1, filter: "brightness(1)" } : {}}
          transition={{ duration: 1.2, ease: APPLE_EASE }}
          className="absolute inset-0"
        >
          {/* preload="auto" — весь файл качается заранее, чтобы scrub
              не ждал partial-decode (раньше metadata = только заголовок,
              keyframes тянулись через range-requests при scroll = лаг).
              Цена: +4MB mobile / +5.5MB desktop к initial transfer, но
              юзер уже коммитнулся к чтению — bike секция #2 после hero.

              Poster СНЯТ: раньше был /rider.webp — то же фото курьера что
              в hero. На мобилке юзер скроллил от hero (курьер) → bike
              (poster=тот же курьер) → создавало дежавю, будто hero
              повторяется. Без poster — до загрузки видео показывается
              чёрный фон section, что ок для dark-секции. */}
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            muted
            playsInline
            preload="auto"
            // Mobile — autoplay loop (scrub выключен, см. выше).
            // Desktop — без autoplay: scroll-scrub управляет currentTime.
            autoPlay={isMobile}
            loop={isMobile}
            className="h-full w-full object-cover object-center"
          />
        </motion.div>

        {/* Два scrim'а — сверху под eyebrow/title/desc, снизу под метрики.
            Нижний усилен (from-black via-black/85 to-black/30) — на мобилке
            байк имеет яркие блики на колесе/раме, метрики «60 + 30 Ач» и
            «до 65 км/ч» читались поверх светлых точек и терялись.
            Усиление только снизу — верхняя часть по-прежнему полупрозрачна,
            чтобы байк оставался виден как продукт. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-black/85 via-black/45 to-transparent"
        />
        {/* Нижний scrim — только на десктопе, лёгкий. На мобилке метрики
            ушли в отдельную BikeSpecs, плотный scrim тут создавал «пустую»
            чёрную половину viewport и читался как gap до specs. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-[45%] bg-gradient-to-t from-black via-black/50 to-transparent md:block"
        />

        {/* Контент-контейнер — теперь содержит только верхний текст.
            Метрики вынесены в отдельную секцию BikeSpecs ниже (чёрный
            фон, apple-style грид), чтобы фото/видео продукта оставалось
            чистым без наложенных UI-плашек. */}
        <div className="relative mx-auto flex h-full max-w-content flex-col px-8 pt-24 md:px-12 md:pt-28">
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
        </div>
      </div>
    </section>
  );
}

// ============================================================
// BikeSpecs — apple tech-specs грид.
// Mobile: один столбец с горизонтальными строками, каждая — hairline
// сверху, label слева mono uppercase, volt-значение справа.
// Desktop: 4 колонки, hairline сверху каждой колонки, label над
// значением, и eyebrow «ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ» над гридом
// (apple-style category header).
// ============================================================
function BikeSpecs() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      data-theme="dark"
      className="bg-[#0A0A0A] text-white"
    >
      <div className="mx-auto max-w-content px-gutter py-16 md:py-28">
        {/* Eyebrow-заголовок раздела — apple-style «на что ты смотришь» */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: APPLE_EASE }}
          className="mb-10 flex items-baseline justify-between border-b border-white/10 pb-6 md:mb-16"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/50 md:text-[12px]">
            Технические характеристики
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/30 md:text-[12px]">
            ВОЛЬТ U2
          </span>
        </motion.div>

        {/* Mobile: список (1 col), каждая строка — label слева, значение
            справа, с hairline сверху. Desktop: 4 columns, в каждой колонке
            label сверху, значение снизу. */}
        <div className="flex flex-col md:grid md:grid-cols-4 md:gap-x-10">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.6, ease: APPLE_EASE }}
              className="
                flex items-baseline justify-between gap-4 border-t border-white/10 py-6
                last:border-b last:border-white/10
                md:flex-col md:items-start md:justify-start md:border-b-0 md:py-8 md:last:border-b-0
              "
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/50 md:text-[12px]">
                {m.label}
              </span>
              <span className="whitespace-nowrap font-sans font-bold leading-none text-volt text-[clamp(28px,4.2vw,56px)] tracking-[-0.02em] md:mt-5">
                {m.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Оба компонента выносятся как один default-export-like bundle: page.tsx
// использует <BikeSection />, а BikeSpecs автоматически рендерится
// следом. Это держит page.tsx неизменным и группирует связанную логику
// «Вольт U2 показ + спецификация» в одном файле.
export { BikeSpecs };
