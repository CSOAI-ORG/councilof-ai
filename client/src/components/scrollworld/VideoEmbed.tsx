import { useState } from "react";

/**
 * Click-to-play video embed. Mobile-safe by design: only the small poster image
 * loads on render; the video file is fetched only when the visitor taps play.
 * (No scroll-world page ever autoplays a multi-minute file — that would tank load + mobile.)
 */
export function VideoEmbed({
  src,
  poster,
  title,
  caption,
  className = "",
}: {
  src: string;
  poster: string;
  title: string;
  caption?: string;
  className?: string;
}) {
  const [play, setPlay] = useState(false);
  return (
    <figure className={`mx-auto w-full max-w-3xl ${className}`}>
      <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10">
        {play ? (
          <video
            src={src}
            poster={poster}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <button
            type="button"
            onClick={() => setPlay(true)}
            aria-label={`Play video: ${title}`}
            className="group relative block aspect-video w-full"
          >
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/95 shadow-lg transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
            <span className="absolute bottom-3 left-4 right-4 text-left text-sm font-semibold text-white drop-shadow-md">
              {title}
            </span>
          </button>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-gray-600">{caption}</figcaption>
      )}
    </figure>
  );
}
