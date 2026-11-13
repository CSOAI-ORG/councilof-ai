import governanceExample from "./fixtures/governance-e9bc92b7.json.txt?raw";
import { CARD_PARAM_MAX_BYTES, verifyCardHref } from "./cardParam";

export const GOVERNANCE_RETRIEVE =
  "/interop/mill-cards-signed/signed-governan-e9bc92b7b39b.json";

const PUBLIC_ORIGIN = "https://councilof.ai";
const SIGNED_CARD_PATH = /^\/signed\/cards\/[0-9a-f]{64}\.json$/;

/** origin is the current page's window.location.origin. */
export function publicCardExampleSource(
  reference: string,
  origin: string,
): { url: string; href: string } {
  // Match the authority separately so path checks stay case-sensitive.
  const absolute = reference.match(
    /^https:\/\/councilof\.ai(?::443)?(\/.*)$/i,
  );
  const path = absolute ? absolute[1] : reference;

  if (
    reference !== reference.trim() ||
    (!SIGNED_CARD_PATH.test(path) && path !== GOVERNANCE_RETRIEVE)
  ) {
    throw new Error("Not a supported public example reference");
  }

  const source = new URL(reference, origin);
  if (
    source.username ||
    source.password ||
    (absolute && source.origin !== PUBLIC_ORIGIN) ||
    (source.hostname === "councilof.ai" && source.origin !== PUBLIC_ORIGIN)
  ) {
    throw new Error("Not a supported public example origin");
  }

  return {
    url: source.href,
    href: verifyCardHref(source.href),
  };
}

export async function loadPublicCardExample(
  reference: string,
  origin: string,
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<{ raw: string; href: string; file: Blob }> {
  signal.throwIfAborted();
  const source = publicCardExampleSource(reference, origin);
  // This deliberately historical teaching specimen is shipped byte-for-byte.
  // The live publication may move to a mirror. Do not follow an arbitrary
  // redirect for user input, or present a saved specimen as a new observation.
  if (new URL(source.url).pathname === GOVERNANCE_RETRIEVE) {
    return { raw: governanceExample, href: source.href, file: new Blob([governanceExample], {type: "application/json"}) };
  }
  const response = await fetchImpl(source.url, {
    credentials: "omit",
    redirect: "error",
    signal,
  });
  signal.throwIfAborted();

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const declaredBytes = Number(response.headers.get("content-length"));
  if (declaredBytes > CARD_PARAM_MAX_BYTES) {
    throw new Error("Public example exceeds the byte limit");
  }

  const bytes = await response.arrayBuffer();
  signal.throwIfAborted();
  if (bytes.byteLength > CARD_PARAM_MAX_BYTES) {
    throw new Error("Public example exceeds the byte limit");
  }

  return {
    raw: new TextDecoder("utf-8", {fatal: true}).decode(bytes),
    file: new Blob([bytes], {type: "application/json"}),
    href: source.href,
  };
}
