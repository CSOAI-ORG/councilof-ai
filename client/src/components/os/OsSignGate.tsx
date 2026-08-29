/**
 * Paid sign stays hidden until TUI 1 finishes the 2-of-3 key ceremony.
 * Site-attestation SIGNED is not that ceremony. This pane does not call the signer.
 */
export default function OsSignGate() {
  return (
    <p data-testid="os-sign-hidden" className="text-[11px] text-slate-600">
      Paid sign is hidden. KEY is 2-of-3. Stamp stays UNCHECKABLE until that ceremony.
      We will not sign from this pane.
    </p>
  );
}
