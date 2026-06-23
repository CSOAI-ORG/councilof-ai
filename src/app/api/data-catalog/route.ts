import { NextRequest, NextResponse } from "next/server";
import catalog from "@/data/data-catalog.json";

export const runtime = "edge";

function toCsv(entries: typeof catalog.entries) {
  const headers = ["name", "url", "format", "license", "apiKey", "keyData", "region", "datasets", "category"];
  const rows = entries.map((e) =>
    headers
      .map((h) => {
        const val = (e[h as keyof typeof e] || "").toString().replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const format = searchParams.get("format");

  const entries = category
    ? catalog.entries.filter((e) => e.category.toLowerCase().includes(category.toLowerCase()))
    : catalog.entries;

  if (format === "csv") {
    return new NextResponse(toCsv(entries), {
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    });
  }

  return NextResponse.json({
    generatedAt: catalog.generatedAt,
    source: catalog.source,
    count: entries.length,
    categories: catalog.categories,
    entries,
  });
}
