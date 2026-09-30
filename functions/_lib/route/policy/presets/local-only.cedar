// GSPC Route caller preset "local-only". Rendered by functions/_lib/route/policy.ts.
@id("caller:preset:local-only")
forbid (principal, action == Action::"route", resource)
when { !resource.local };
