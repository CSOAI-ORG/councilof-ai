// GSPC Route caller preset "eu-only". Rendered by functions/_lib/route/policy.ts.
@id("caller:preset:eu-only")
forbid (principal, action == Action::"route", resource)
when { !(resource.region like "eu*") };
