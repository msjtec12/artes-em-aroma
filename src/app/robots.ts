import type { MetadataRoute } from "next";

const SITE_URL = "https://artesemaroma.konnexy.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/produtos", "/guias", "/sobre", "/duvidas", "/contato"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/sacola",
          "/*?q=*",
          "/*?sort=*",
          "/*?minPrice=*",
          "/*?maxPrice=*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
