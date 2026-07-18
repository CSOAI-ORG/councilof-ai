# /fleet 500 Investigation (2026-06-13)

## Symptom
- `GET /fleet` returns **500** on the source (both ui-1s53t75fu AND ui-q1nq7zf8l)
- `GET /fleet/` returns **308 → /fleet** (Next.js auto-redirect)
- `GET https://www.meok.ai/fleet` returns **200** (CDN-cached)
- `GET https://www.meok.ai/fleet/` returns **308 → /fleet** (which then 500s but the 200 is cached)

## Suspected cause
The /fleet page in `app/fleet/page.tsx` is a dynamic route. The 500 suggests:
- A `dynamic = 'force-dynamic'` route doing a data fetch that fails
- OR a missing file/import in the build
- OR an env var empty (e.g. STRIPE_API_KEY, CLERK keys)

## Where to look
1. `meok-marketing/app/fleet/page.tsx` — the page component
2. `meok-marketing/app/fleet/[slug]/page.tsx` — if it exists, check the dynamic route
3. Vercel function logs for the /fleet invocation

## Fix pattern
For an SSG fleet hub, use `generateStaticParams()` + pre-built data:
```tsx
// app/fleet/page.tsx
export const dynamic = 'force-static';
export async function generateStaticParams() { return [{ slug: 'eu-ai-act' }, ...]; }
export default async function Page() {
  const packages = await getStaticPackageList();
  return <Fleet packages={packages} />;
}
```

## Triage
- This is **NOT** a re-alias blocker (pre_realias_check.sh treats it as soft warning)
- It IS a UX bug — anyone hitting /fleet via the deploy directly sees 500
- The CDN cache for www.meok.ai/fleet means most users still see 200

## Workaround for now
Users navigating from /fleet/index.html (my static build) get a 200 page.
The Next.js /fleet page is a separate route — could be removed entirely
and replaced with the static build's /fleet/index.html, since the static
version has cross-links + llms.txt + sectors and is more complete.

## Owner
Mavis to investigate on the next debug cycle (after gate-fire).
