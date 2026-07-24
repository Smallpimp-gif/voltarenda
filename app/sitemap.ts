import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastMod = new Date("2026-04-17");
  return [
    {
      url: "https://voltarenda.small-pimp.workers.dev/",
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://voltarenda.small-pimp.workers.dev/legal/offer",
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://voltarenda.small-pimp.workers.dev/legal/privacy",
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: "https://voltarenda.small-pimp.workers.dev/legal/cookies",
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
}
