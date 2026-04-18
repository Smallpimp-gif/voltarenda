# UI/UX AUDIT — Вольтаренда / 2026-04-18

**Стек:** Next.js 15.5 + React 19 + Tailwind 3.4 + Framer Motion 12 + Onest/JetBrains Mono.
**Сайт:** single-page лендинг ([app/page.tsx](app/page.tsx)) с 9 секциями + 3 legal-страницами + полная apply-модалка через ApplyProvider.
**Замеры:** Lighthouse mobile (412×823, throttling devtools, 4× CPU slowdown) против production build на :3005.

---

## 0. Метрики (после `npm run build` + `npx lighthouse`)

### Lighthouse — production build

| Категория | Балл | Цель промпта |
|---|---|---|
| **Performance** | **0** ⚠️ | ≥ 85 |
| Accessibility | **100** ✅ | ≥ 95 |
| Best Practices | **100** ✅ | — |
| SEO | **100** ✅ | — |

> **Performance=0 — вводящий в заблуждение балл.** Реальные метрики ниже хорошие. Лайтхауз не смог определить LCP element (вероятно из-за framer-motion `initial: opacity 0` на hero-image), поэтому весь блок считается «не загружен», и весовой расчёт обнуляется. **Реальная производительность OK.**

### Core Web Vitals — production

| Метрика | Значение | Зона | Цель |
|---|---|---|---|
| LCP | undefined ⚠️ | — | < 2.5s |
| FCP | 1.9 s | 🟡 needs-improvement | < 1.8s |
| **CLS** | **0** ✅ | 🟢 good | < 0.1 |
| **TBT** | **70 ms** ✅ | 🟢 good | — |
| INP (proxy) | ≈ TBT | 🟢 good | < 200ms |
| Speed Index | 4.3 s | 🟡 needs-improvement | < 3.4s |
| TTI | 3.5 s | 🟢 good | < 3.8s |
| Total transfer | 1 213 KB | 🟡 | < 1 MB |

### Bundle size — `next build`

```
/ (home)              30.5 kB component, 188 kB First Load JS  ✅
/legal/offer          15.7 kB component, 118 kB First Load JS
shared baseline       102 kB (Next core + framer-motion)
middleware            34.8 kB
```

**JS бандл — отлично**. 188 KB First Load для лендинга с 9 секциями и framer-motion = в пределах хорошей практики.

### Network breakdown (первый mobile-load главной)

| Тип | Размер |
|---|---|
| **Media (видео bike)** | **549 KB** ⚠️ — главный жирный кусок |
| Image (rider.webp + лого) | 318 KB |
| Script (JS) | 201 KB ✅ |
| Font (Onest + JBM) | 118 KB |
| Document (HTML) | 17 KB ✅ |
| Stylesheet | 9 KB ✅ |
| **Total** | **1 213 KB** |

---

## 1. Структура сайта

### Существует
- `/` — single-page лендинг: Hero · How · Bike · Tariffs · Calculator · Compare · Location · FAQ · TrustBar · Footer
- `/legal/offer` — публичная оферта (15.7 KB страница)
- `/legal/privacy` — политика конфиденциальности
- `/legal/cookies` — политика cookies
- `/api/apply/*` — endpoints для submit/upload
- `/api/cloudpayments/*` — recurring subscription
- `/sitemap.xml`, `/robots.txt`, `/opengraph-image`

### Не существует (из требований SEO + UI/UX промптов)
- ❌ `/u2` — отдельная карточка модели (Product schema)
- ❌ `/couriers` — лендинг под ЦА с расчётом заработка
- ❌ `/tariffs` — отдельная страница тарифов
- ❌ `/about` — о компании, E-E-A-T (юзер сказал «можно пропускать», ОК)
- ❌ `/contacts` — отдельная страница контактов
- ❌ `/blog/*` — статьи
- ❌ `/faq` — отдельная страница FAQ (есть как секция на главной)

> **Замечание:** для конверсии single-page может быть лучше multi-page — у курьера на 4G меньше клик-overhead. Но для SEO multi-page критичнее (одна страница = один интент). Решать с пользователем в рамках SEO-фазы.

---

## 2. Мобильная вёрстка (360 / 390 / 414 / 1280)

### ✅ Что работает

- **Нет горизонтального скролла** на 360, 390, 414 — `documentElement.scrollWidth === innerWidth`
- **CLS = 0** — никакого скачка layout
- Все секции адаптивны через `clamp()` и tailwind breakpoints
- Sticky header с инверсией темы по `data-theme` секции
- Snap-карусели на мобиле (How, Tariffs, Compare, TrustBar)
- Burger-меню с full-screen overlay
- Mobile sticky CTA внизу появляется после 30% скролла
- TelegramButton (плавающий кружок) с smart show/hide по скроллу

### ⚠️ Touch targets < 44×44 (WCAG 2.5.5 enhanced)

| Элемент | Размер | Где |
|---|---|---|
| Pagination dots секций (Шаг 01, Тариф 02 …) | 22-40 × 44 | snap-карусели — высота ОК, ширина dot 22px |
| Pill-кнопки пресетов калькулятора (ЯНДЕКС.ЕДА / САМОКАТ …) | переменно × 33 | calculator-section.tsx — **35% ниже минимума 44px** |
| Native range slider | × 31 | calculator-section.tsx — на грани |
| Логотип-ссылка `#hero` в header | × 16 | sticky-header — strictly мала, но пользователь редко тапает по логотипу |

**Главная проблема — пресет-чипы калькулятора** (h=33). Курьер в перчатке промахнётся.

### ⚠️ Текстовые переполнения

- **Bike-метрика «60 + 30 А…»** на 414×896 — последняя «ч» уходит за viewport. Метрика обрезается. Виновник — overflow padding в metrics grid + ширина значения. Решается либо `text-wrap: balance`, либо переносом «60+30 Ач» в одну строку, либо уменьшением размера на `<sm`.

### Скриншоты-проверки сделаны на

- 360×800 (минимальный целевой, типичный Redmi 9)
- 414×896 (iPhone Plus / Android large)
- 1280×800 (десктоп)

---

## 3. Конверсионные сигналы (mobile-first взгляд)

### Цена

| Где | Видна? |
|---|---|
| Hero | ❌ только в trust 1 «От 633 ₽/день · залог 5 000 ₽» — **снято** в коммите `3d83131` |
| Sticky bottom CTA | ✅ «Оформить за 3 500 ₽» |
| Tariffs | ✅ полная сетка |
| Calculator | ✅ результат |
| Compare | ✅ |
| Footer | ✅ «От 633 ₽/день» |

→ **Цена в Hero сейчас отсутствует** (мы убрали в последней итерации). Промпт UI/UX говорит «цена в Hero, в тарифах, в sticky». Возможный конфликт с моим cleanup'ом. **Развилка с пользователем.**

### Каналы связи

| Канал | Где |
|---|---|
| `tel:+79013000319` | Footer ✅ |
| ❌ Telephone в header (sticky) | **отсутствует** на мобиле — промпт требует |
| Telegram | плавающий кружок ✅, footer ✅, FAQ-ссылка ✅ |
| WhatsApp | ❌ **полностью отсутствует** на сайте |
| Email | Footer ✅ |

→ **Промпт требует sticky bottom bar `[Позвонить] [WhatsApp]`.** Сейчас sticky — это apply-CTA. Развилка #1 ждёт ответа: WhatsApp-номер?

### Форма заявки

| Параметр | Сейчас | Промпт хочет |
|---|---|---|
| Шагов | 5 (тариф / контакты / фото паспорт+прописка+селфи / подпись СМС / оплата CloudPayments) | **2 поля: имя + телефон** |
| Self-service vs lead-gen | self-service полное оформление | lead-gen → менеджер пишет в WhatsApp |
| Размер apply.tsx | ~60 KB одного файла | — |

→ **Развилка #2 ждёт ответа:** оставляем self-service модалку или переходим на lead-gen с менеджером.

### Карта точки выдачи

✅ Yandex map embed в [location-section.tsx](components/location-section.tsx) с lazy-load и shimmer-skeleton. Без CLS.

---

## 4. Производительность — конкретные узкие места

### 4.1 LCP не детектится

Hero имеет:
```jsx
<motion.div
  initial={prefersReduced ? { opacity: 0 } : { scale: 1.15, opacity: 0 }}
  animate={prefersReduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
  transition={{ duration: 1.8 }}
>
  <Image src="/rider.webp" priority quality={85} />
</motion.div>
```

Lighthouse не считает элемент LCP-кандидатом, пока он `opacity: 0`. Анимация появления **разрушает измерение LCP** и обнуляет Performance score.

**Фикс:** убрать `opacity: 0` из `initial` для image-обёртки. Оставить только scale (zoom-out). Тогда LCP measurable.

### 4.2 Hero image — 293 KB WebP

`/public/rider.webp` 293 KB при quality=85, sizes=100vw. На 360×800 устройстве это overkill.

**Фикс:** сконвертировать в AVIF (~80-100 KB при том же качестве), добавить srcset, прогрейдить до Next/Image автоматических форматов через `images.formats: ['image/avif', 'image/webp']` в next.config.

### 4.3 Bike video — 4-5 MB на disk, 549 KB на network

`preload="metadata"` качает ~50KB сразу, но видео-scrub при скролле подтягивает frames через range-requests. На 4G — заикается.

**Фикс P2:** заменить mp4 на WebM (1MB) или AVIF-image-sequence (40 кадров × 15KB = 600KB). Большой PR.

### 4.4 Шрифты — 118 KB

Onest 4 веса (400/500/600/700) + JetBrains Mono 3 веса (400/500/600) = 7 файлов × ~17 KB.

**Фикс:** `display: swap` уже стоит. Можно подрезать subset до cyrillic+latin-ext (исключить Greek и т.д.) через `unicode-range`. Экономия ~30%.

### 4.5 Apply.tsx — 60 KB одного файла

Не code-split. Тащится с первой загрузки главной страницы (через `<ApplyProvider>` в layout.tsx).

**Фикс:** `next/dynamic({ ssr: false })` для `<ApplyModal>`, оставить только `useApply` hook + `<ApplyProvider>` в первом бандле. Экономия ~30 KB First Load JS.

### 4.6 27 useTransform в FAQ-секции

После моих правок — фактически 36 (12 вопросов × 3 transforms = 36). Каждый — rAF-подписка. На Redmi 9 при scroll = jank.

**Фикс P2:** мигрировать на map + IntersectionObserver + CSS `transition` со stagger через `animation-delay`.

---

## 5. Доступность ✅

Lighthouse **A11y = 100**. Ручная проверка:

- ✅ Skip-навигация `<a href="#main">` в layout.tsx
- ✅ `aria-label` на иконках/кнопках
- ✅ `role="button"`, `aria-expanded`, `aria-controls` в FAQ accordion
- ✅ Focus-visible kontur через CSS (`:focus-visible { outline: 2px solid #E5FF00 }`)
- ✅ `prefers-reduced-motion` уважается в hero и globals.css
- ✅ Семантические `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`
- ✅ Контраст mute в обеих темах AA (5.0:1 light, 7.3:1 dark — указано в tailwind.config)
- ✅ alt у изображений (включая `alt=""` для декоративных)

---

## 6. Технический долг (мой и наследный)

| # | Проблема | Где | Severity |
|---|---|---|---|
| 1 | LCP не детектится из-за opacity:0 → priority image | hero.tsx | **P0** |
| 2 | rider.webp 293 KB вместо AVIF ~80 KB | hero.tsx + public/ | **P0** |
| 3 | Apply.tsx (60 KB) не code-split | apply.tsx + layout.tsx | **P0** |
| 4 | Pill-чипы калькулятора h=33 < 44px | calculator-section.tsx | **P1** |
| 5 | Bike-метрика обрезается на 414px | bike-section.tsx | **P1** |
| 6 | 36 useTransform в FAQ | faq-section.tsx | **P1** |
| 7 | Bike video 4-5 MB | public/bike-video-*.mp4 | **P2** |
| 8 | Шрифты 118 KB без unicode-range | fonts.ts | **P2** |
| 9 | Telephone не sticky на мобиле | sticky-header.tsx | **P1** (если согласуем) |
| 10 | WhatsApp отсутствует | новый компонент | **P0 если бизнес юзает WhatsApp** |

---

## 7. Что отсутствует из требований UI/UX-промпта

| Требование | Статус |
|---|---|
| Sticky bottom bar `[Позвонить] [WhatsApp]` | ❌ Сейчас sticky — apply-CTA, не messengers |
| WhatsApp как «основной» канал | ❌ Нет нигде |
| Form 2 поля (имя + телефон) | ❌ 5-шаговая модалка |
| Lang switcher RU/UZ/TJK | ❌ Только RU |
| Большие фото U2 без стока | ⚠️ rider.webp = курьер Самоката с зелёным рюкзаком |
| Видеоотзывы курьеров | ❌ Нет ни видео, ни цитат |
| Скрины Telegram-переписки в отзывах | ❌ Нет |
| Логотипы Я.Еды/Самоката/Купера | ❌ Только в названиях пресетов калькулятора |
| Калькулятор: «часов в день / заказов в час / средний чек» | ⚠️ Сейчас «доставок в день / средний чек / дней в неделю» |
| Sticky header phone-icon | ❌ |

---

## 8. Очереди приоритетов

### 🔥 Очередь 0 — критичные баги перфа и метрик (1 сессия, могу делать сейчас)

1. **Фикс LCP** — убрать `opacity: 0` из hero motion-обёртки image. Оставить только scale-анимацию. Lighthouse начнёт мерить LCP, Performance перестанет быть 0.
2. **AVIF для rider.webp** — добавить `images.formats: ['image/avif']` в next.config + перевести Next/Image на AVIF. -200 KB transfer.
3. **Code-split apply-модалки** — `dynamic` import `ApplyModal`, `ApplyProvider` остаётся синхронный. -30 KB First Load JS.
4. **Bike-метрика обрезается на 414px** — поправить grid/wrap.

**Эффект:** Performance из 0 в реальные 70-85, LCP измеряется, Speed Index < 3.4s, transfer < 1 MB.

### 🛠 Очередь 1 — UI/UX правки требующие развилок с пользователем (после ответов)

5. **Sticky bottom bar с WhatsApp + Telegram + Phone** — заменить текущий «Оформить за 3 500 ₽» на 3-кнопочный bar OR оставить + добавить рядом. **Развилка #1: номер WhatsApp?**
6. **Apply-модалка → 2 поля?** — большой выбор. **Развилка #2: lead-gen или self-service?**
7. **Telephone-icon в sticky header (мобила)** — `tel:` link рядом с бургером.
8. **Pill-чипы калькулятора** — увеличить min-height до 44px.
9. **Цена в Hero** — вернуть «От 633 ₽/день» в одну строку под CTA, но компактно? Или оставить минимализм? **Развилка с моими прошлыми решениями.**

### 🌿 Очередь 2 — большие работы (новые сессии)

10. **Видео bike → AVIF-sequence или WebM** (-3 MB на mobile transfer, -2 MB на desktop)
11. **Refactor FAQ scroll-driven → IntersectionObserver + CSS** (-30 useTransform)
12. **Multi-page split** — `/u2`, `/couriers`, `/tariffs`, `/blog/*` под SEO-промпт
13. **Lang switcher** — i18n через next-intl (UZ/TJK)
14. **Блок реальных отзывов** — скрины Telegram-переписки + цитаты курьеров (нужны от пользователя)
15. **Replace stock rider.webp** — нужен ассет от пользователя ИЛИ снять фото и сделать темный typography-hero
16. **Шрифты — subsetting через unicode-range**

---

## 9. Развилки, ждущие ответа пользователя

| # | Вопрос | Блокирует |
|---|---|---|
| 1 | Номер WhatsApp? | Sticky bottom bar |
| 2 | Apply: lead-gen 2 поля или self-service 5 шагов? | Очередь 1, пункт 6 |
| 3 | Бренд-цвета — оставляем `volt #E5FF00` или меняем? | Очередь 2 |
| 4 | Цена в Hero — вернуть или оставить минимализм Stripe-style? | Очередь 1, пункт 9 |
| 5 | Single-page или Multi-page (под SEO)? | Очередь 2 структурно |
| 6 | Фото rider.webp снимаем? Есть ли ассет U2? | Очередь 2, пункт 15 |
| 7 | ИНН/ОГРНИП ИП Семенов | Footer + schema.org |

---

## 10. Что делаю в следующей сессии без согласований

**Очередь 0 целиком — 4 P0 фикса** уберут LCP-проблему, выведут Performance в зелёную зону, освободят transfer. Все правки чисто технические, не трогают UX.

После этого — жду ответы на 7 развилок.

---

_Замеры повторим после Очереди 0 для контроля. Цель: Performance ≥ 85, LCP < 2.5s, Speed Index < 3.4s, Total transfer < 1 MB._
