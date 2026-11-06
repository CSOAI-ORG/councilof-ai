const PUBLISHED_ORIGIN = "https://councilof.ai";

/** Metadata retains its published origin; test requests use only the configured test origin. */
export function buyerTestOrigin(baseURL: string | undefined): string {
  const selected = new URL(baseURL ?? PUBLISHED_ORIGIN);
  if (
    !["http:", "https:"].includes(selected.protocol) ||
    selected.username ||
    selected.password
  ) {
    throw new Error(
      "Buyer checks require an HTTP(S) test origin without credentials",
    );
  }
  return selected.origin;
}

export function buyerRequestPath(publishedURL: string): string {
  const resource = new URL(publishedURL);
  if (
    resource.origin !== PUBLISHED_ORIGIN ||
    resource.username ||
    resource.password ||
    resource.hash ||
    resource.pathname.startsWith("//")
  ) {
    throw new Error("Buyer resource must name the published Council origin");
  }
  return resource.pathname + resource.search;
}
