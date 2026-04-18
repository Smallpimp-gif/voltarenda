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

const METRICS: [string, string][] = [
  ["~120 км", "запас на 2 АКБ"],
  ["60 + 30 Ач", "два аккумулятора"],
  ["150 кг", "грузоподъёмность"],
  ["до 65 км/ч", "макс. скорость"],
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

        {/* Контент-контейнер */}
        {/* pb-56 на мобиле — Telegram-кнопка fixed bottom-20 right-4
            (h-14, занимает зону viewport bottom 80–136px) перекрывала
            нижнюю метрику «до 65 км/ч». Sticky-CTA внизу добавляет
            ещё ~76px. Эмпирически 14rem = 224px чисто отбивает оба
            фиксированных элемента + safe-area. Десктоп остаётся pb-20. */}
        <div className="relative mx-auto flex h-full max-w-content flex-col justify-between px-8 pb-56 pt-24 md:px-12 md:pb-20 md:pt-28">
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
                // min-w-0: grid-item по умолчанию имеет min-width:auto и
                // не уменьшается под содержимое — большая метрика растягивает
                // колонку и обрезается sticky-child overflow-hidden.
                className="min-w-0"
              >
                {/* text-display-2 (clamp 32–64px) был широковат — «60 + 30 Ач»
                    переполнял колонку на 360–414px viewport. Поменяли на
                    адаптивный clamp 24–48px: на 360px = 24px, на 768px = 42px,
                    на 1280px+ = 48px. Помещается в любой колонке. */}
                <div className="font-sans tnum text-[clamp(24px,5.5vw,48px)] leading-none text-white">
                  {value}
                </div>
                <div className="mt-2 font-mono text-caption uppercase text-white/60">
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
