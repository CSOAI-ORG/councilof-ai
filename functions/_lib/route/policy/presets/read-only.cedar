// GSPC Route caller preset "read-only". Rendered by functions/_lib/route/policy.ts.
@id("caller:preset:read-only")
forbid (principal, action == Action::"route", resource)
when { !resource.read_only };
