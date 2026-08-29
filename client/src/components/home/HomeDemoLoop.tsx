/**
 * Tiny silent loop for the desk — loads the 2 MB demo, not a 30 MB film.
 */
export default function HomeDemoLoop() {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-black">
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
  );
}
