import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Enforce the doctrine: "Verification is free forever and needs no account."
  // Council OS is the loginless workspace.
  redirect('/os');
}
