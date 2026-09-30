// GSPC Route floor policy. Fixed, published, forbid-only. Rendered by functions/_lib/route/policy.ts.
@id("floor:effect-binding-divergent")
forbid (principal, action == Action::"route", resource)
when { resource.census_effect_binding == "DIVERGENT" };

@id("floor:destructive-needs-confirm")
forbid (principal, action == Action::"route", resource)
when { resource.destructive && !context.confirm };

@id("floor:paid-needs-caller-wallet")
forbid (principal, action == Action::"route", resource)
when { resource.paid && !context.caller_wallet };

@id("floor:data-class-not-declared")
forbid (principal, action == Action::"route", resource)
when { context.data_class != "public" && !resource.data_class_allowed.contains(context.data_class) };
