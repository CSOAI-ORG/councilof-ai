/**
 * councilVoice — how the Council assistant sounds.
 *
 * The old path dumped a whole paragraph into speechSynthesis at rate 1.03.
 * Chrome's default "Google US English" then reads it as one breathless robot.
 *
 * This module:
 *   1. rewrites text so a TTS engine can say it (no markdown, no "npx …"),
 *   2. prefers a natural / neural system voice when the browser has one,
 *   3. speaks short clauses with a breath between them.
 *
 * Kokoro (advertised on /voice) is still the Layer 0 on-device plan. Until
 * that ships, this is the live voice — same API for dock, lobby, DemoOS.
 */

export type VoiceHooks = {
  rate?: number;
  pitch?: number;
  prefer?: RegExp;
  onstart?: () => void;
  onend?: () => void;
};

const PREMIUM =
  /natural|neural|premium|enhanced|online \(natural\)|aria|jenny|guy|libby|sonia|samantha|victoria|moira|tessa|serena|susan|hazel|zira|daniel(?!a)|alex(?!ander)|karen|fiona|kate|oliver|thomas/i;
const AVOID =
  /espeak|compact|android|robot|dummy|stub|novelty|zarvox|trinoids|boing|fred|junior|kathy|princess|bells|organ|cellos|albert|bubbles|bad news|good news|whisper/i;

let voices: SpeechSynthesisVoice[] = [];
let speakGen = 0;
let pauseTimer: ReturnType<typeof setTimeout> | null = null;

function loadVoices() {
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length) voices = list;
  } catch {
    /* jsdom / private mode */
  }
}

try {
  loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
} catch {
  /* non-browser */
}

/** Turn assistant prose into something a voice can say without stumbling. */
export function prepSpeech(raw: string): string {
  let t = String(raw || "");
  t = t.replace(/```[\s\S]*?```/g, " ");
  t = t.replace(/`([^`]+)`/g, "$1");
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/[_#]+/g, " ");
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  t = t.replace(/https?:\/\/\S+/g, " ");
  t = t.replace(/\bnpx\s+\S+/gi, "one install command");
  t = t.replace(/\bCSOAI\b/g, "Council of A I");
  t = t.replace(/\bEU AI Act\b/g, "E U A I Act");
  t = t.replace(/\bEd25519\b/g, "Ed 25519");
  t = t.replace(/\bSHA-?256\b/gi, "S H A 256");
  t = t.replace(/\bn_eff\b/g, "n effective");
  t = t.replace(/\bMCP\b/g, "M C P");
  t = t.replace(/\bNIST\b/g, "N I S T");
  t = t.replace(/\bNIS2\b/g, "N I S 2");
  t = t.replace(/\bDORA\b/g, "Dora");
  t = t.replace(/\bJSP\s*936\b/gi, "J S P 936");
  t = t.replace(/\bGPAI\b/g, "G P A I");
  t = t.replace(/[•·]/g, ". ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/** Split into speakable clauses. Long walls of text are what make TTS sound botty. */
export function chunkSpeech(text: string): string[] {
  const clean = prepSpeech(text);
  if (!clean) return [];
  const parts = clean
    .split(/(?<=[.!?])\s+|(?<=;)\s+|(?<=:)\s+|(?<=—)\s+|(?<=–)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
  const out: string[] = [];
  for (const p of parts) {
    if (p.length <= 140) out.push(p);
    else {
      const bits = p.split(/,\s+/);
      let buf = "";
      for (const b of bits) {
        if ((buf + ", " + b).length > 140 && buf) {
          out.push(buf);
          buf = b;
        } else {
          buf = buf ? buf + ", " + b : b;
        }
      }
      if (buf) out.push(buf);
    }
  }
  return out;
}

export function scoreVoice(name: string, lang: string, prefer?: RegExp): number {
  const hay = `${name} ${lang}`;
  if (AVOID.test(hay)) return -100;
  let n = 0;
  if (prefer && prefer.test(hay)) n += 50;
  if (PREMIUM.test(hay)) n += 40;
  if (/en[-_]GB/i.test(lang)) n += 8;
  if (/en[-_]US/i.test(lang)) n += 6;
  if (/^en\b/i.test(lang)) n += 4;
  if (/^Google US English$/i.test(name)) n -= 15;
  return n;
}

export function pickVoice(prefer?: RegExp): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices();
  if (!voices.length) return undefined;
  const ranked = [...voices].sort(
    (a, b) => scoreVoice(b.name, b.lang, prefer) - scoreVoice(a.name, a.lang, prefer),
  );
  return ranked[0];
}

export function stopVoice() {
  speakGen += 1;
  if (pauseTimer) {
    clearTimeout(pauseTimer);
    pauseTimer = null;
  }
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export function speakVoice(text: string, hooks: VoiceHooks = {}) {
  const chunks = chunkSpeech(text);
  if (!chunks.length) {
    hooks.onend?.();
    return;
  }
  const my = ++speakGen;
  const voice = pickVoice(hooks.prefer);
  const rate = hooks.rate ?? 0.94;
  const pitch = hooks.pitch ?? 1.02;
  let started = false;

  const play = (i: number) => {
    if (my !== speakGen) return;
    if (i >= chunks.length) {
      hooks.onend?.();
      return;
    }
    try {
      const u = new SpeechSynthesisUtterance(chunks[i]);
      u.rate = rate;
      u.pitch = pitch;
      u.volume = 1;
      if (voice) u.voice = voice;
      u.onstart = () => {
        if (!started) {
          started = true;
          hooks.onstart?.();
        }
      };
      u.onend = () => {
        if (my !== speakGen) return;
        if (i + 1 >= chunks.length) {
          hooks.onend?.();
          return;
        }
        pauseTimer = setTimeout(() => play(i + 1), 200);
      };
      u.onerror = () => {
        if (my === speakGen) hooks.onend?.();
      };
      window.speechSynthesis.speak(u);
    } catch {
      hooks.onend?.();
    }
  };

  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
  pauseTimer = setTimeout(() => play(0), 50);
}
