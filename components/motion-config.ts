// Единая конфигурация анимаций по всему сайту.
// Изменил один раз — и весь сайт меняет feel.

/**
 * Параметры spring-физики для smoothed scroll progress.
 * Значения scroll-driven useTransform'ов оборачиваются через useSpring,
 * чтобы анимация "догоняла" скролл с лёгкой инерцией. Это и есть тот
 * "масляный" Apple/icomat feel — не линейное следование за пикселем,
 * а критически-демпфированная пружина.
 *
 *  stiffness ↑  = жёстче, быстрее догоняет
 *  damping ↑    = меньше колебаний, больше трения
 *  mass ↑       = "тяжелее", больше инерции
 *
 * Critical damping достигается при damping² = 4·stiffness·mass.
 *  120 · 0.5 · 4 = 240, √240 ≈ 15.5
 * У нас damping 30 > 15.5 → overdamped, без колебаний, с небольшим
 * лагом. Именно то что нужно для скролла.
 */
export const SMOOTH_SCROLL = {
  stiffness: 120,
  damping: 30,
  mass: 0.5,
} as const;

/**
 * Параметры spring для модального окна — чуть жёстче чем SMOOTH_SCROLL,
 * чтобы открывалось быстро но не дёргалось.
 */
export const MODAL_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 0.8,
};

/**
 * Apple easeOutQuart — канонический мягкий выход для duration-анимаций
 * где spring не подходит (например reveal).
 */
export const APPLE_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * cubicBezier-версия APPLE_EASE для useTransform({ ease }).
 * Импортируй EASE из motion-config вместо создания в каждом файле.
 */
export { cubicBezier } from "framer-motion";
import { cubicBezier } from "framer-motion";
export const EASE = cubicBezier(0.22, 1, 0.36, 1);
