import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

/**
 * HeroSlides — the cinematic slide band for page tops.
 *
 * The live homepage hero. Green canvas scenes (cells / council / glyphs) stay
 * the measured-not-modelled voice. Between them, the old Ken-Burns arena stills
 * — clay coliseum plates — so the band is not a wall of emerald. Each image
 * slide has its own title. Honors prefers-reduced-motion (static frame, no
 * auto-advance, no zoom).
 *
 * Discipline: no invented scores, no certification language, no frozen board
 * counts. Living totals live on GET /api/gspc.
 */

type CanvasScene = "cells" | "council" | "glyphs";

type Slide = {
  kicker: string;
  headline: [string, string];
  sub: string;
  cta: { label: string; href: string };
  scene?: CanvasScene;
  image?: { src: string; alt: string };
};

const SLIDES: Slide[] = [
  {
    kicker: "THE INSTRUMENTS",
    headline: ["Measured,", "not modelled."],
    sub: "Living GET /api/gspc. Every verdict is a predicate an auditor can recompute. Empty cells stay empty.",
    cta: { label: "See the board", href: "/gspc-scoreboard" },
    scene: "cells",
  },
  {
    kicker: "THE PROVING GROUND",
    headline: ["The arena is open.", "Not a badge."],
    sub: "Frozen tests. A signed card you can hold. Anyone re-checks it without asking us. Measurement, not certification.",
    cta: { label: "See the board", href: "/gspc-scoreboard" },
    image: {
      src: "/images/coliseum_hero_arena.jpg",
      alt: "Clay figures and green verification seals gathered in a marble arena",
    },
  },
  {
    kicker: "THE COUNCIL OS",
    headline: ["Every seat signed.", "Every vote an artefact."],
    sub: "A council architecture where every seat is signed and every vote is an artefact — shown, not claimed.",
    cta: { label: "Open Council OS", href: "/os" },
    scene: "council",
  },
  {
    kicker: "COUNCIL SPACE",
    headline: ["AI versus AI.", "A rule, not a jury."],
    sub: "The same frozen tests, head to head. The verdict is a fixed rule — never one model grading another. Ties stay ties.",
    cta: { label: "Watch Council Space", href: "/gspc-arena" },
    image: {
      src: "/images/coliseum_swarm_clash.jpg",
      alt: "A swarm of green shards meeting clay scientists raising shields",
    },
  },
  {
    kicker: "THE REFUTATION LEDGER",
    headline: ["We publish", "our failures."],
    sub: "9 killed bets, on the live site, with the artefacts. Trust through falsifiability — not adjectives.",
    cta: { label: "Read the ledger", href: "/refutation-ledger" },
    scene: "glyphs",
  },
  {
    kicker: "YOU VERSUS THE SYSTEM",
    headline: ["Probe it yourself.", "Practice stays practice."],
    sub: "Step in and stress the instrument. Signed runs count. Practice runs stay practice and are never quoted.",
    cta: { label: "Enter the arena", href: "/gspc-arena" },
    image: {
      src: "/images/coliseum_logic_duel.jpg",
      alt: "A human and an AI facing each other across a chessboard in the arena",
    },
  },
  {
    kicker: "HUMAN OVERSIGHT",
    headline: ["Humans stay", "in the loop."],
    sub: "People set the tests, read the results, and can challenge any card. The system is steered, not hidden.",
    cta: { label: "See how it is judged", href: "/gspc-scoreboard" },
    image: {
      src: "/images/coliseum_humans_vs_humanoids.jpg",
      alt: "Humans directing AI figures with beams of light, keeping oversight",
    },
  },
];
