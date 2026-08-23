// Public /sov-os door is Council OS. The dockview workspace is not a second OS.
import { Redirect } from "wouter";

export default function SovOS() {
  return <Redirect to="/?lobby=home" />;
}
