"use client";

// Яндекс.Метрика — загружается ТОЛЬКО после cookie consent.
// До принятия cookies скрипт Метрики не подключается,
// что соответствует требованиям 152-ФЗ.

import { useEffect } from "react";

const METRIKA_ID = 108583356;
const STORAGE_KEY = "voltarenda-cookies-accepted";

export function YandexMetrika() {
  useEffect(() => {
    // Проверяем, дал ли пользователь согласие на cookies
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      // Подписываемся на изменение localStorage (cookie-consent ставит ключ)
      const handler = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue === "1") {
          loadMetrika();
          window.removeEventListener("storage", handler);
        }
      };
      // Также проверяем через interval — StorageEvent не фаерится
      // в той же вкладке, где setItem вызван
      const interval = setInterval(() => {
        if (localStorage.getItem(STORAGE_KEY) === "1") {
          loadMetrika();
          clearInterval(interval);
        }
      }, 1000);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("storage", handler);
        clearInterval(interval);
      };
    }
    // Уже принял — грузим сразу
    loadMetrika();
  }, []);

  return null;
}

function loadMetrika() {
  // Не грузить повторно
  if ((window as any).ym) return;

  // Инициализируем ym-функцию (очередь вызовов до загрузки скрипта)
  (window as any).ym =
    (window as any).ym ||
    function (...args: unknown[]) {
      ((window as any).ym.a = (window as any).ym.a || []).push(args);
    };
  (window as any).ym.l = Date.now();

  // Загружаем скрипт Метрики
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
  document.head.appendChild(script);

  // Инициализация после загрузки
  (window as any).ym(METRIKA_ID, "init", {
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    accurateTrackBounce: true,
    trackLinks: true,
  });
}
