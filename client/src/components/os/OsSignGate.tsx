/**
 * Paid sign stays hidden until the owner's root ceremony performs the planned 2-of-3 key split
 * (not performed; see correction C-2026-0925-01).
 * Site-attestation SIGNED is not that ceremony. This pane does not call the signer.
 */
export default function OsSignGate() {
  return (
    <p data-testid="os-sign-hidden" className="text-[11px] text-slate-600">
      Paid sign is hidden while the stamp is UNCHECKABLE. A 2-of-3 key split is planned for the root ceremony and has not been performed.
      We will not sign from this pane.
    </p>
  );
}
