/** Exact reviewed-blog exception to the archived /blog/:slug family.
 * Both an explicit publication decision and the existing derived record are
 * required. This does not publish the index, arbitrary slugs or missing records.
 */
import published from "../data/blog-published.json";
import index from "../data/blog-index.json";
const allowed = new Set(published.published.map(row => row.slug));
export function reviewedBlogRecord(path: string) {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, "");
  const match = /^\/blog\/([^/]+)$/.exec(clean);
  if (!match || !allowed.has(match[1])) return undefined;
  return index.posts.find(post => post.slug === match[1]);
}
