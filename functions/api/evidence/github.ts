/**
 * GET /api/evidence/github?owner=X&repo=Y — proxy to GitHub API for repo evidence.
 * Returns: { evidence: [{sha, date, message, author}], error?, rateLimit? }
 *
 * Uses GITHUB_TOKEN env if set (raises rate limit). Falls back to unauthenticated
 * (60 req/h per IP) when unset.
 */

interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; date: string };
    message: string;
  };
}

export const onRequestGet: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");

  if (!owner || !repo) {
    return Response.json({ error: "owner and repo are required" }, { status: 400 });
  }

  const token = (ctx.env as any).GITHUB_TOKEN || "";
  const headers: Record<string, string> = {
    "User-Agent": "csoai-pages-function/1.0",
    Accept: "application/vnd.github+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const r = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=20`,
      { headers }
    );
    if (!r.ok) {
      return Response.json(
        { error: `github ${r.status}`, evidence: [] },
        { status: r.status === 403 ? 429 : 502 }
      );
    }
    const commits = (await r.json()) as GitHubCommit[];
    return Response.json({
      evidence: commits.map((c) => ({
        sha: c.sha.slice(0, 12),
        date: c.commit.author.date,
        message: c.commit.message.split("\n")[0].slice(0, 200),
        author: c.commit.author.name,
      })),
      rateLimit: {
        remaining: r.headers.get("x-ratelimit-remaining"),
        limit: r.headers.get("x-ratelimit-limit"),
      },
    });
  } catch (e: any) {
    return Response.json(
      { error: "github unreachable", detail: e?.message ?? "unknown" },
      { status: 502 }
    );
  }
};
