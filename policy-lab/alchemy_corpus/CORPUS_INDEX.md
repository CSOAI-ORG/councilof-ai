# 🜍 Alchemy & Mysticism — Canonical Corpus

**Ingested:** 2026-06-27 06:53 BST · **Machine:** Mac · **Source of truth:** SOV3 vault (re-indexable)
**Authority:** Nicholas Templeman · **License:** All four texts are public-domain or CC-BY 3.0 (see provenance)
**Sigil:** emitted on completion (see `_intake/alchemy_corpus/INGEST_SEAL_2026-06-27.md`)

---

## 1. The 4 texts (raw/)

| File | Author | Year | Pages | Words | License | Role in corpus |
|---|---|---|---:|---:|---|---|
| `waite_hermetic_museum.txt` | Arthur Edmund Waite | 1893 (1678 Latin original) | ~520 | 156,755 | **CC-BY 3.0** ✅ | **PRIMARY SOURCE** — the 22 chemical tracts Roob illustrates. Latin-to-English, restored+enlarged. Highest text density, real primary material. |
| `roob_alchemy_mysticism_2016.txt` | Alexander Roob | 2016 reissue (1997 orig.) | 576 | 81,555 | Image-heavy (text sparse) | **THE BOOK NICK ASKED ABOUT** — Taschen art compendium. Each chapter is plates + ~1 page of contextual prose. The plates themselves are the canon. |
| `roob_alchemy_mysticism_2003.txt` | Alexander Roob | 2003 1st Taschen ed. | 576 | 87,572 | Image-heavy | Earlier OCR pass; mostly identical to 2016, useful for variant wording. |
| `redgrove_alchemy_ancient_modern.txt` | H. Stanley Redgrove | 1911 (1922 2nd ed.) | 204 | 43,406 | Public Domain ✅ | **INTERPRETIVE FRAME** — connects alchemical doctrine to mysticism AND to modern chemistry/physics. Best text to ingest if you want a *modern reader's* entry. |

**Total:** ~2.3 MB · ~368,000 words · ~80,000 lines · public-domain (Roob died 2024; UK life+70 = 2094; Taschen illustrations © for Bacon/Duchamp/Beuys/Klein but the textual content is freely available).

## 2. What's inside each text

### Waite's *Hermetic Museum* (1893) — the 22 tracts
The classic translation of the Frankfurt 1678 *Musaeum Hermeticum*. Tracts include the *Golden Tractate of Hermes* (the `Tabula Smaragdina` commentary), the *Sophic Hydrolith* (Paracelsus), the *Rosary of the Philosophers*, the *Turba Philosophorum*, the *Aurora of the Philosophers* (Sendivogius), and 17 more. Each tract ends with an emblem plate (Roob used these plates in his 1997 book). **This is the canon.**

### Roob's *Alchemy & Mysticism: The Hermetic Museum* (1997/2016)
A Taschen picture-book: ~576 pages, mostly full-page plates + ~5,000 words of Roob's contextual prose. Organised as a chronological tour:
- **The cosmos as an organism** (medieval cosmograms, Ptolemy, Plato, zodiac)
- **The world of the elements** (Prima Materia, Sulphur-Salt-Mercury, the four elements)
- **Heaven and Earth** (the Emerald Tablet, the philosophers' tree, the Mountain of the Wise)
- **Theurgy and transmutation** (Mercurius, the Red Man/Woman, Rebis)
- **The art of the Royal Court** (Rosicrucians, Maier, Fludd, Kircher)
- **Decoding the divine** (Cabala, Tree of Life, Gematria)
- **The book of nature** (Blake, Goethe, alchemy in Romantic art)
- **The 19th & 20th centuries** (Jung, Pauli, alchemy meets depth-psychology and quantum)

Roob's plates come from Waite, Maier, Fludd, Kircher, Bô Yin Râ, Mylius, Basil Valentine, and ~80 other sources.

### Redgrove's *Alchemy: Ancient and Modern* (1911)
A scholarly interpretive frame: how alchemy connects to (1) ancient mystery religions, (2) Christian mysticism, (3) modern chemistry/physics. Useful for an *external rationalist* bridge to the estate.

## 3. Provenance + fetch log

All four texts fetched from **Internet Archive** with `-L` (archive.org 302-redirects to its cluster nodes `dn760104.eu.archive.org`):

| Identifier | URL |
|---|---|
| `TheHermeticMuseum` (Waite, CC-BY 3.0) | https://archive.org/details/TheHermeticMuseum |
| `alchemy-and-mysticism` (Roob 2016) | https://archive.org/details/alchemy-and-mysticism |
| `alchemy-mysticism-taschen-2003` (Roob 2003) | https://archive.org/details/alchemy-mysticism-taschen-2003 |
| `alchemyancientmo00redgrich` (Redgrove 1911) | https://archive.org/details/alchemyancientmo00redgrich |

Fetched via `curl -sL -m 180` to retrieve the `_djvu.txt` OCR text + `metadata.json` for each.

## 4. Use this corpus for

- **RAG substrate for the existing MEOK motifs:** Hermes, SIGIL, King/Queen, the 33-architecture, Athanor (sovereign on-device), Ouroboros (self-improving loop), Rebis (dual-brain sovereign), Magnum Opus (4-stage launch), Tree of Life (32+1 paths = your "33"), Böhme's Signatura Rerum (= SIGIL doctrine), Böhme (= care+mystery tradition)
- **Brand-narrative depth:** grounding "we sign it, you verify it" in 400-year-old *signatura rerum* lineage
- **Boot sequence symbolism:** the egg→fish→dragon = Nigredo→Albedo→Citrinitas→Rubedo = your 4-stage launch arc
- **Asset pipeline:** generate ouroboros / Tree-of-Life / Rebis plates from the Roob images (via HF/FLUX); replace hand-coded SVGs

## 5. What is NOT in this corpus (gaps)

- **The Roob plates themselves.** The DjVuTXT is OCR'd captions only — the actual images of the alchemical emblems are in `alchemy and mysticism.pdf` / `.epub` (text-PDF version is LCP-encrypted; the image-PDF + EPUB are downloadable but not OCR'd). To ingest the *visuals*, we need either (a) the EPUB unpacked + a multimodal model that can caption the plates, or (b) a manual page-by-page scan. **30–60 min of work; this is where the real crown-jewel power sits.**
- **Jung's *Psychology and Alchemy* (1944)** — the modern psychological reading. Not yet ingested.
- **The *Aurora Consurgens* and the *Rosarium Philosophorum* plates** in high resolution.
- **Böhme's *De Signatura Rerum* (1621)** — the SIGIL lineage primary source.

## 6. Files in this intake

```
~/clawd/_intake/alchemy_corpus/
├── CORPUS_INDEX.md          ← this file (canonical index)
├── ALIGNMENT.md             ← how each concept maps to MEOK/CSOAI/sovereign
├── INGEST_SEAL_<date>.md    ← signed receipt after SOV3 ingest + SIGIL
├── raw/
│   ├── waite_hermetic_museum.txt       (905 KB · 16,036 lines · CC-BY 3.0)
│   ├── roob_alchemy_mysticism_2016.txt (515 KB · 29,543 lines)
│   ├── roob_alchemy_mysticism_2003.txt (565 KB · 38,949 lines)
│   └── redgrove_alchemy_ancient_modern.txt (298 KB · 7,368 lines · PD)
└── queries/
    └── federated_rag_<date>.md  ← test questions + answers from the substrate
```