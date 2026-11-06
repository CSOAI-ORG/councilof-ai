import fs from "node:fs";
import path from "node:path";

/** Only a whole unconditional literal handler is supported; never execute backend code. */
export function literalRetirementRedirect(source) {
  const body = source.match(
    /export function onRequest\(\)\s*\{([\s\S]*)\}\s*$/,
  )?.[1];
  const match = body?.match(
    /^\s*return new Response\(null,\s*\{\s*status:\s*(30[1278]),\s*headers:\s*\{\s*location:\s*["']([^"']+)["'],\s*["']cache-control["']:\s*["'][^"']*["'],?\s*\},?\s*\}\);\s*$/,
  );
  if (!match || !match[2].startsWith("/") || match[2].startsWith("//"))
    throw new Error(
      "Retirement redirect is not an unconditional same-origin literal",
    );
  return { status: Number(match[1]), location: match[2] };
}

export function builtRetirementRedirects(dist) {
  return new Map(
    [
      ["/advisory", "advisory.ts"],
      ["/advisory/", "advisory/index.ts"],
      ["/early-access", "early-access.ts"],
      ["/early-access/", "early-access/index.ts"],
    ].map(([url, file]) => [
      url,
      {
        ...literalRetirementRedirect(
          fs.readFileSync(path.join(dist, "functions", file), "utf8"),
        ),
        source: `functions/${file}`,
      },
    ]),
  );
}
