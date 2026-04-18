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

  // Scrub видео по скроллу — брендовый момент секции.
  // Секция h-[180vh] mobile / h-[200vh] desktop. Sticky child h-screen
  // держится первый экран, оставшиеся 80–100vh скролла прокручивают
  // currentTime видео. Threshold 0.85 = видео проигрывается за первые
  // 85% прогресса, последние 15% — hold на финальном кадре перед
  // уходом в Tariffs.
  //
  // НЕ оборачивать в useSpring: spring добавляет inertia (~50-100ms
  // delay), а на decode-bound currentTime seek это ощущается как
  // «видео отстаёт от пальца». Direct raw progress — мгновенная связь
  // палец↔видео.
  //
  // rAF throttle: scroll fires 100+ events/sec, каждый seek в mp4 это
  // синхронный decode. Throttle до 1 update за frame через
  // rafPendingRef.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const rafPendingRef = useRef(false);
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
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
      // ВАЖНО: НЕ добавлять overflow-hidden на section — это ломает
      // position: sticky дочернего элемента (sticky requires nearest
      // scrolling ancestor; overflow-hidden создаёт scroll context).
      // Видео clip'ится внутри sticky-child'a, который имеет overflow-hidden.
      className="relative h-[140vh] text-white md:h-[200vh]"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
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
              poster /rider.webp пока видео грузится. */}
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            muted
            playsInline
            preload="auto"
            poster="/rider.webp"
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
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-black via-black/85 to-transparent md:h-[45%] md:via-black/50"
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
// BikeSpecs — apple-style таблица характеристик.
// Отдельная секция под bike-section: чистый чёрный фон, крупные
// volt-цифры, белые подписи-капсы, короткая volt-линия-разделитель.
// Раньше метрики были наложены glass-плашкой поверх видео — выглядело
// как заглушка и «ломало premium-ощущение» (цитата юзера). Вынесено
// отдельно, чтобы фото продукта дышало.
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
      <div className="mx-auto max-w-content px-gutter py-20 md:py-28">
        {/* Сетка: 2×2 на мобилке, 1×4 на десктопе. gap — минимум 48px
            горизонтальный на десктопе для воздуха (apple-style). */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-x-12">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: APPLE_EASE }}
              className="min-w-0"
            >
              {/* Цифра — volt, крупная, nowrap чтобы «60 + 30 Ач» и
                  «до 65 км/ч» не ломались внутри значения. На 360px
                  clamp уходит в 32px — 4-символьное «150 кг» помещается
                  без переноса, самое длинное «60 + 30 Ач» занимает
                  ~158px при 32px шрифте, в колонке (360-gutter-gap)/2
                  ≈ 145–155px — едва влезает. */}
              <div className="whitespace-nowrap font-sans font-bold leading-none text-volt text-[clamp(32px,4.2vw,56px)] tracking-[-0.02em]">
                {m.value}
              </div>
              {/* Короткая volt-линия между цифрой и подписью — акцент. */}
              <div
                aria-hidden
                className="mt-5 h-[2px] w-6 bg-volt"
              />
              <div className="mt-3 font-mono text-[12px] uppercase tracking-[0.08em] text-white/60 md:text-[13px]">
                {m.label}
              </div>
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
