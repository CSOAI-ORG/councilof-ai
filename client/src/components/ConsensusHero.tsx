// ConsensusHero — the one-glance story of CSOAI: many frameworks reach signed consensus,
// producing one offline-verifiable proof. Pure animated SVG/CSS (no photos, no deps).
// Animation: flow lines draw in, the 23/33 council arc fills, the signed receipt stamps in.
// Fully static under prefers-reduced-motion.

const EM = "#10b981", TE = "#2dd4bf";
const FRAMEWORKS = ["EU", "US", "ISO", "UK", "SG", "KR", "CN"];

export default function ConsensusHero({ className = "" }: { className?: string }) {
  const cx = 470, cy = 190; // council hub
  return (
    <svg viewBox="0 0 820 380" className={className} role="img"
      aria-label="Seven AI-governance frameworks reach a 23-of-33 council consensus, producing one Ed25519-signed, offline-verifiable proof"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ch-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f172a" /><stop offset="1" stopColor="#042f2e" />
        </linearGradient>
        <linearGradient id="ch-em" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={EM} /><stop offset="1" stopColor={TE} />
        </linearGradient>
        <radialGradient id="ch-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={EM} stopOpacity="0.35" /><stop offset="1" stopColor={EM} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="820" height="380" rx="20" fill="url(#ch-bg)" />
      <circle cx={cx} cy={cy} r="150" fill="url(#ch-glow)" />

      {/* framework chips + flow lines into the hub */}
      <g fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="12" fontWeight="700" textAnchor="middle">
        {FRAMEWORKS.map((f, i) => {
          const y = 40 + i * 50;
          return (
            <g key={f}>
              <path d={`M120 ${y} C 250 ${y}, 330 ${cy}, ${cx - 60} ${cy}`} stroke={TE} strokeWidth="1.5"
                fill="none" opacity="0.45" className="ch-flow" style={{ animationDelay: `${i * 0.12}s` }} />
              <rect x="46" y={y - 15} width="66" height="30" rx="8" fill="#03110b" stroke="url(#ch-em)" strokeWidth="1.5" />
              <text x="79" y={y + 4} fill="#d1fae5">{f}</text>
            </g>
          );
        })}
      </g>

      {/* council hub: 23/33 arc ring + shield + check */}
      <g>
        <circle cx={cx} cy={cy} r="52" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="7" />
        {/* arc = 23/33 of the circle */}
        <circle cx={cx} cy={cy} r="52" fill="none" stroke="url(#ch-em)" strokeWidth="7" strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} pathLength={33} strokeDasharray="23 33" className="ch-arc" />
        <circle cx={cx} cy={cy} r="38" fill="#03110b" />
        <path d={`M${cx - 15} ${cy} l10 11 20 -22`} fill="none" stroke="url(#ch-em)" strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" className="ch-check" />
        <text x={cx} y={cy + 74} fontFamily="ui-monospace,monospace" fontSize="11" fontWeight="700"
          textAnchor="middle" fill={TE}>23 / 33 quorum</text>
      </g>

      {/* signed receipt card, stamped out on the right */}
      <g className="ch-receipt">
        <path d={`M${cx + 60} ${cy} H 640`} stroke={EM} strokeWidth="1.5" opacity="0.5" fill="none" />
        <rect x="642" y="132" width="150" height="116" rx="12" fill="#03110b" stroke="url(#ch-em)" strokeWidth="1.5" />
        <text x="717" y="158" fontFamily="ui-sans-serif,system-ui" fontSize="11" fontWeight="800" textAnchor="middle" fill="#d1fae5">SIGNED PROOF</text>
        <g fontFamily="ui-monospace,monospace" fontSize="9" fill="#6ee7b7">
          <text x="658" y="180">ed25519 · verified</text>
          <text x="658" y="196">sha256 a3f9…c1</text>
          <text x="658" y="212">offline-checkable</text>
        </g>
        <circle cx="717" cy="230" r="11" fill="none" stroke={EM} strokeWidth="2" />
        <path d="M711 230 l4 5 8 -9" fill="none" stroke={EM} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <style>{`
        .ch-flow{stroke-dasharray:320;stroke-dashoffset:320;animation:chDraw 1s ease forwards}
        .ch-arc{stroke-dashoffset:0;animation:chArc 1.1s ease .5s both}
        .ch-check{stroke-dasharray:48;stroke-dashoffset:48;animation:chDraw .5s ease 1.5s forwards}
        .ch-receipt{opacity:0;transform:translateX(10px);animation:chIn .6s ease 1.7s forwards}
        @keyframes chDraw{to{stroke-dashoffset:0}}
        @keyframes chArc{from{stroke-dasharray:0 33}to{stroke-dasharray:23 33}}
        @keyframes chIn{to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){
          .ch-flow,.ch-check{stroke-dashoffset:0;animation:none}
          .ch-arc{animation:none}
          .ch-receipt{opacity:1;transform:none;animation:none}
        }
      `}</style>
    </svg>
  );
}
