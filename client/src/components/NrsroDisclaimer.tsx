/**
 * Shared NRSRO / CRA disclaimer — measurement is not a credit rating.
 * NEXT_300 #238. Use on /products, /indices, and any RWA-adjacent surface.
 */
export function NrsroDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={
        className ||
        "text-xs leading-relaxed text-emerald-200/55 border-t border-emerald-500/10 pt-4"
      }
      role="note"
    >
      Council of AI (CSOAI Ltd) is an independent measurement body. Our outputs are{" "}
      <strong className="font-semibold text-emerald-100/70">measurement credentials</strong>, not
      credit ratings, NRSRO opinions, or CRA product. We are not registered as a Nationally
      Recognized Statistical Rating Organization. Do not treat GSPC grades, RWA attestation
      cards, or labour/economy index rows as credit ratings or investment advice. Scores are
      never sold.
    </p>
  );
}

export default NrsroDisclaimer;
