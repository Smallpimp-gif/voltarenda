import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://voltarenda.small-pimp.workers.dev/sitemap.xml",
    host: "https://voltarenda.small-pimp.workers.dev",
  };
}
