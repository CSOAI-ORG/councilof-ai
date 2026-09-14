import { useRoute } from "wouter";
import ContentPage from "./ContentPage";
import { blogdata } from "@/data/blog-content";

/** /blog/:slug — data-driven from blog-content.ts */
export default function BlogSlug() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  return <ContentPage dataset={blogdata} slug={slug} />;
}
