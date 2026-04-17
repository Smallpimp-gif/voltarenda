"use client";

// Универсальный reveal-обёртыватель в стиле icomat.co.uk / on.energy.
// Элемент начинается в размытом, смещённом, прозрачном состоянии и плавно
// приходит в норму когда входит в viewport. Триггерится по useInView,
// поэтому срабатывает даже если элемент лежит в контейнере без собственного
// useScroll.
//
// Использование:
//   <Reveal>                   // базовый blur+y+opacity
//   <Reveal delay={0.1}>       // с задержкой для stagger
//   <Reveal as="h2">           // с другим тегом-оберткой
//   <Reveal once>              // анимация только один раз
//
// Значения подобраны под icomat-look: heavy blur на entry + ощутимый y +
// subtle scale + длинное cubic-bezier easing на ~1100 ms. delay пишется
// прямо в transition чтобы не конфликтовать с variants.

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

type RevealProps = {
  children: ReactNode;
  /** Задержка перед началом анимации (сек). Для stagger между сестринскими Reveal. */
  delay?: number;
  /** Длительность анимации в секундах (default 1.1s). */
  duration?: number;
  /** Срабатывает только один раз или каждый раз при входе в viewport. */
  once?: boolean;
  /** Отступ viewport для триггера (см. useInView.margin). */
  margin?: string;
  /** Тег-обёртка. По умолчанию div. */
  as?: keyof typeof motionTags;
  /** Сквозной className. */
  className?: string;
};

const motionTags = {
  div: motion.div,
  span: motion.span,
  section: motion.section,
  article: motion.article,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  ul: motion.ul,
  li: motion.li,
} as const;

// Начальное и конечное состояние reveal'а.
// y: 32 — умеренный slide-up
// scale: 0.98 — еле заметный zoom-in
// blur: 6px — лёгкое расфокусирование, текст читается сразу
const HIDDEN = {
  opacity: 0,
  y: 32,
  scale: 0.98,
  filter: "blur(6px)",
};

const VISIBLE = {
  opacity: 1,
  y: 0,
  scale: 1,
  filter: "blur(0px)",
};

// Apple easeOutQuart — канонический "мягкий выход"
const APPLE_EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  duration = 0.85,
  once = false,
  margin = "-8% 0px -8% 0px",
  as = "div",
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  // @ts-expect-error — useInView принимает любой ref с current: Element
  const inView = useInView(ref, { once, margin });

  const Component = motionTags[as];

  return (
    <Component
      // @ts-expect-error — ref type совместим на рантайме
      ref={ref}
      className={className}
      initial={HIDDEN}
      animate={inView ? VISIBLE : HIDDEN}
      transition={{
        duration,
        delay,
        ease: APPLE_EASE,
      }}
      style={inView ? { willChange: "transform, filter, opacity" } : undefined}
    >
      {children}
    </Component>
  );
}
