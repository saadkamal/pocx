import type { MetadataRoute } from "next";
import { pocxOrigin } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private surfaces: customer gates, the operator dashboard, the
        // ops console, auth pages, APIs and the gated demo app.
        disallow: [
          "/gate/",
          "/ja/gate/",
          "/dashboard",
          "/ja/dashboard",
          "/admin",
          "/api/",
          "/demo",
          "/ja/demo",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${pocxOrigin()}/sitemap.xml`,
  };
}
