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
            "Explore the measurement board, verify a record or review measurement services.",
            "Read each result with its scope and status. A dash does not mean a zero score.",
            { kind: "usp", text: "Measurement is not certification. Payment does not determine a ranking." },
          ]}
        />
      </div>
    </div>
  );
}
