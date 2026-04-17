import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastMod = new Date("2026-04-17");
  return [
    {
      url: "https://voltarenda.ru/",
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://voltarenda.ru/legal/offer",
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://voltarenda.ru/legal/privacy",
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: "https://voltarenda.ru/legal/cookies",
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
}
