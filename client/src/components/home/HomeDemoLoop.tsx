/**
 * Tiny silent loop for the desk — loads the 2 MB demo, not a 30 MB film.
 */
import HomeUnderstand from "./HomeUnderstand";

export default function HomeDemoLoop() {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_36px_-28px_rgba(4,18,12,.5)]">
      <div className="overflow-hidden bg-black">
        <video
          src="/videos/csoai-demo.mp4"
          poster="/videos/csoai-demo.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="aspect-video w-full object-cover"
          aria-label="Council of AI — a 20-second look at the instrument"
        />
      </div>
      <div className="px-4 py-4">
        <HomeUnderstand
          title="Twenty seconds on the instrument"
          items={[
            "The board, the verifier and get-measured — the three doors a stranger actually uses.",
            "A filled cell is a measurement. A dash is honest emptiness.",
            { kind: "usp", text: "Nothing in the loop is a certificate or a badge you can buy. A rank is never sold." },
          ]}
        />
      </div>
    </div>
  );
}
