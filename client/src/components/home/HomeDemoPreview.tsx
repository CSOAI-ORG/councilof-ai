import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";

/** A real, user-initiated product walkthrough. The video is not fetched until Play is pressed. */
export default function HomeDemoPreview() {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <section className="hp-demo-band" aria-labelledby="home-demo-heading" data-testid="home-demo-preview">
      <div className="hp-demo-copy">
        <p className="hp-eyebrow">See the instrument</p>
        <h3 id="home-demo-heading">From a public result to a record you can verify.</h3>
        <p>
          Take a short guided look at the working evidence experience. Then open the live board
          and inspect the source records yourself.
        </p>
        <a href="/board/" className="hp-demo-link">
          Explore the live instrument <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        {failed ? <p className="hp-demo-error" role="status">The walkthrough could not be loaded. The live board remains available.</p> : null}
      </div>
      <div className="hp-demo-frame">
        {playing && !failed ? (
          <video
            controls
            autoPlay
            playsInline
            preload="none"
            poster="/videos/csoai-demo.jpg"
            aria-label="Council of AI product walkthrough"
            onError={() => setFailed(true)}
          >
            <source src="/videos/csoai-demo.mp4" type="video/mp4" />
            Your browser does not support this video.
          </video>
        ) : (
          <button
            type="button"
            className="hp-demo-trigger"
            onClick={() => { setFailed(false); setPlaying(true); }}
            aria-label="Play the Council of AI product walkthrough"
          >
            <img
              src="/videos/csoai-demo.jpg"
              alt="Preview of the Council of AI evidence workspace"
              loading="lazy"
              decoding="async"
            />
            <span className="hp-demo-play"><Play size={17} fill="currentColor" aria-hidden="true" /> Play the walkthrough</span>
            <span className="hp-demo-corner">COUNCIL OS · PRODUCT TOUR</span>
          </button>
        )}
      </div>
    </section>
  );
}
