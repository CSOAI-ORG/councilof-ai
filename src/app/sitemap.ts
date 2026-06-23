import type { MetadataRoute } from "next";
import { readdirSync, type Dirent } from "fs";
import { join } from "path";
import { frameworksdata } from "@/lib/frameworks-content";
import { sectorsdata } from "@/lib/sectors-content";
import { industriesdata } from "@/lib/industries-content";
import { blogdata } from "@/lib/blog-content";

const baseUrl = "https://councilof.ai";

// Walk src/app for static (non-dynamic, non-api) page routes at build time.
function staticRoutes(): string[] {
  const out: string[] = [];
  const root = join(process.cwd(), "src", "app");
  const walk = (dir: string, prefix: string) => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true }) as Dirent[];
    } catch {
      return;
    }
    if (entries.some((e) => e.isFile() && e.name === "page.tsx")) {
      out.push(prefix || "/");
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name === "api") continue;
      if (e.name.startsWith("[")) continue; // dynamic → added from data below
      // route groups "(...)" don't add a path segment
      const seg = e.name.startsWith("(") ? prefix : `${prefix}/${e.name}`;
      walk(join(dir, e.name), seg);
    }
  };
  walk(root, "");
  return out;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = new Set<string>();

  try {
    staticRoutes().forEach((p) => paths.add(p));
  } catch {
    ["/", "/pricing", "/catalogue", "/sovereign-town", "/certification"].forEach((p) =>
      paths.add(p),
    );
  }

  // Dynamic slug families (the bulk of the SEO surface).
  for (const e of frameworksdata) paths.add(`/frameworks/${e.slug}`);
  for (const e of sectorsdata) paths.add(`/sectors/${e.slug}`);
  for (const e of industriesdata) paths.add(`/industries/${e.slug}`);
  for (const e of blogdata) paths.add(`/blog/${e.slug}`);

  return Array.from(paths)
    .sort()
    .map((path) => ({
      url: `${baseUrl}${path === "/" ? "" : path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority:
        path === "/" ? 1 : path.split("/").filter(Boolean).length <= 1 ? 0.8 : 0.6,
    }));
}
