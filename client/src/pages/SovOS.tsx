// Public /sov-os door is Council OS. Not a second dockview OS.
import { Redirect } from "wouter";

export default function SovOS() {
  return <Redirect to="/?lobby=home" />;
}
