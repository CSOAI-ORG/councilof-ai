import ContentPage from "./ContentPage";
import { blogdata } from "@/data/blog-content";

/**
 * /blog/:slug — data-driven from blog-content.ts.
 * Receives `params` from wouter <Route component={...} /> (no useRoute null).
 */
export default function BlogSlug({ params }: { params: { slug: string } }) {
  return <ContentPage dataset={blogdata} slug={params.slug} />;
}
