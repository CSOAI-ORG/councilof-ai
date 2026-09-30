/**
 * /dashboard — Council OS, the GSPC workspace.
 *
 * 30 Sep 2026 (lane gspc-product-ui): the legacy "Measurement control room" metrics page that sat in
 * an "Account overview" disclosure under the home surface is retired. It printed a second copy of the
 * board, card and corrections figures, a PDCA loop with no account data behind it and a
 * "Council runtime NOT LIVE" tile. Every one of those figures now has ONE place in the workspace
 * (components/gspc/GspcWorkspaceHome.tsx), read live beside its source. The shell, the sections and
 * the panes live in DashboardLayout / DashboardWorkspace / DashboardPane.
 */
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  return <DashboardLayout>{null}</DashboardLayout>;
}
