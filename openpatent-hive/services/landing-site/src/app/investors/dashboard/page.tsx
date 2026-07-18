/**
 * Forwarder: /investors/dashboard → /invest
 */
import Link from "next/link";

export default function Forwarder() {
  return (
    <div style={{ padding: "100px 20px", textAlign: "center", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Investors dashboard moved</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        The investor dashboard is now at <Link href="/invest" style={{ color: "#4ecdc4" }}>/invest</Link>.
      </p>
      <Link href="/invest" style={{ display: "inline-block", background: "#0a0a0a", color: "#fff", padding: "12px 24px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
        Go to /invest →
      </Link>
    </div>
  );
}
