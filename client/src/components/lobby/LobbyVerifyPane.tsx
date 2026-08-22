import RecordVerifyForm from "@/components/gspc/RecordVerifyForm";
import { SP, TYPE } from "./glass";

/** Native verify pane inside Council OS — no iframe. */
export default function LobbyVerifyPane() {
  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Verify a card</p>
      <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        Recompute in your browser
      </h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-700">
        Native in Council OS. Paste a record — hash and Ed25519 signature checked against{" "}
        <code className="font-mono text-[12px]">/.well-known/did.json</code>. Nothing leaves this device.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-900/10 bg-white/90 p-5">
        <RecordVerifyForm variant="light" />
      </div>
    </div>
  );
}
