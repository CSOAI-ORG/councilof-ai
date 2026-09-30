// GSPC Route caller preset "no-unmeasured". Rendered by functions/_lib/route/policy.ts.
@id("caller:preset:no-unmeasured")
forbid (principal, action == Action::"route", resource)
when { !resource.measured_on_axis };
