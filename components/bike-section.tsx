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
        {/* Нижний scrim — обеспечивает читаемость метрик поверх видео.
            Плотность максимума снизу, плавно уходит в прозрачность к
            середине viewport (чтобы средняя часть байка оставалась видна). */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/80 to-transparent md:h-[50%]"
        />

        {/* Контент-контейнер — верхний текст + нижние метрики.
            Всё внутри sticky-child поверх видео: eyebrow/H2/desc сверху,
            apple-style hairline specs снизу, видео виден в середине
            (сам продукт). */}
        <div className="relative mx-auto flex h-full max-w-content flex-col justify-between px-8 pb-28 pt-24 md:px-12 md:pb-14 md:pt-28">
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

          {/* Apple tech-specs grid — снизу поверх scrim.
              Mobile: 2×2 с hairline сверху каждой ячейки (label mono, value volt).
              Desktop: 4 колонки, всё на одной строке. */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-0 md:grid-cols-4 md:gap-x-8">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.75 + i * 0.08, duration: 0.55, ease: APPLE_EASE }}
                className="min-w-0 border-t border-white/20 py-4 md:py-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/60 md:text-[11px]">
                  {m.label}
                </div>
                <div className="mt-2 whitespace-nowrap font-sans font-bold leading-none text-volt text-[clamp(22px,3.4vw,40px)] tracking-[-0.02em] md:mt-3">
                  {m.value}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// BikeSpecs удалён — метрики вернулись overlay'ем поверх видео внутри
// bike-section (юзер: «вся информация должна быть на видео»). Перенос
// в отдельную плоскую секцию читался как placeholder, хотя apple-style
// tech-specs. Возврат к overlay с hairline-оформлением.
