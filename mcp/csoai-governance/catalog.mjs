/** Map the published /api/tools search contract, keeping matches separate from inventory. */
export function catalogResult(response) {
  if (!response?.ok || !response.json) {
    throw new Error(`catalog gateway unreachable (status ${response?.status})`);
  }
  const j = response.json;
  if (typeof j !== "object" || Array.isArray(j) ||
      !Array.isArray(j.tools) || !Number.isSafeInteger(j.total) ||
      j.total < 0 || j.total !== j.tools.length ||
      j.tools.some((m) => !m || typeof m !== "object" || Array.isArray(m) ||
        typeof m.name !== "string" || !m.name.trim())) {
    throw new Error("catalog gateway returned malformed tools/total search result");
  }
  // /api/tools total counts matching server × tool rows, including a legitimate zero.
  // distinct_tools and catalogue_total describe the wider inventory, not this search.
  const matches = j.tools.slice(0, 25).map((m) => ({ name: m.name }));
  return { total: j.total, showing: matches.length, matches };
}
