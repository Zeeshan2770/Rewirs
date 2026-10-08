import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/course",
    "/about",
    "/faq",
    "/contact",
    "/enroll",
    "/terms",
    "/privacy",
    "/login",
    "/signup",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  return staticRoutes;
}
