/**
 * The reference implementation's own gate. The load-bearing test is the tamper one: a verifier
 * that accepts an altered artifact is not a verifier, and the failure mode this guards against
 * is the specific one the estate has already met — a digest that covers a payload sub-object
 * while the subject and the evidence URL sit outside it, so a record whose claim and whose
 * source link have BOTH been rewritten still verifies (spec 6.5).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STATES,
  SCHEMA,
  canonicalBytes,
  extractVisibleText,
  claimHash,
  artifactDigest,
  buildArtifact,
  verifyArtifact,
  captureFromUrl,
  sha256hex,
} from "./claim-capture.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_MD = readFileSync(
  join(ROOT, "public/spec/claim-maintenance/v0.1/claim-maintenance-v0.1.md"),
  "utf8",
);

const captured = () =>
  buildArtifact({
    claim_id: "EX-1",
    subject: { name: "Example Corp", identifier: "example.com", identifier_kind: "domain" },
    claim_verbatim: "market leader powering the majority of the sector",
    claim_type: "market-share",
    source_url: "https://example.com/",
    access_date: "2026-09-22T14:05:11Z",
    content_hash: "a".repeat(64),
    extracted_chars: 4211,
    state: "CLAIM_CAPTURED",
    measurement_plan: "majority = >50%; estimable from the public breakdown; capture weekly",
    next_read_utc: "2026-09-29T00:00:00Z",
  });

describe("canonicalisation and hashing (spec 6)", () => {
  it("sorts keys by code point and emits no insignificant whitespace", () => {
    expect(canonicalBytes({ b: 1, a: { d: 2, c: 3 } }).toString("utf8")).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("refuses floating-point numbers and non-finite values — a digest that varies by runtime is not a digest", () => {
    expect(() => canonicalBytes({ ratio: 0.5126 })).toThrow(/non-integer/);
    expect(() => canonicalBytes({ x: Infinity })).toThrow(/NaN\/Infinity/);
    expect(canonicalBytes({ ratio: "0.5126" }).toString("utf8")).toBe('{"ratio":"0.5126"}');
  });

  it("extracts visible text: script/style/comments out, whitespace collapsed", () => {
    const html = `<html><head><style>p{color:red}</style><script>var x="market leader"</script></head>
      <body><!-- hidden --><h1>Example   Corp</h1><p>market leader&nbsp;powering the majority</p></body></html>`;
    const text = extractVisibleText(html);
    expect(text).toBe("Example Corp market leader powering the majority");
    expect(text).not.toMatch(/var x|color:red|hidden/);
  });

  // Spec 6.3 step 2 takes the text of the remaining NODES: every character reference is decoded
  // exactly once, as a browser renders it. Reported 2026-09-24 by the hiring-platforms capture
  // (docs/measurement/HIRING-PLATFORMS-2026-09-24.md, capture note 2): `&#x27;` came through as
  // those six characters, so claims containing an apostrophe could not be captured verbatim.
  it("decodes hexadecimal character references, as a browser renders them", () => {
    expect(extractVisibleText("<p>it&#x27;s</p>")).toBe("it's");
    expect(extractVisibleText("<p>it&#X27;s</p>")).toBe("it's");
    expect(extractVisibleText("<p>&#x201C;quoted&#x201d;</p>")).toBe("\u201Cquoted\u201D");
  });

  it("decodes the named references pages commonly emit", () => {
    expect(extractVisibleText("<p>it&rsquo;s &ldquo;x&rdquo; &mdash; y&hellip;</p>")).toBe(
      "it\u2019s \u201Cx\u201D \u2014 y\u2026",
    );
    expect(extractVisibleText("<p>it&apos;s &copy; 2026</p>")).toBe("it's \u00A9 2026");
  });

  it("decodes a double-encoded reference ONCE: the reader sees the inner reference as text", () => {
    expect(extractVisibleText("<p>it&amp;#x27;s</p>")).toBe("it&#x27;s");
    expect(extractVisibleText("<p>it&amp;#39;s</p>")).toBe("it&#39;s");
    expect(extractVisibleText("<p>&amp;quot;hi&amp;quot;</p>")).toBe("&quot;hi&quot;");
    expect(extractVisibleText("<p>a &amp;lt;b&amp;gt;</p>")).toBe("a &lt;b&gt;");
    expect(extractVisibleText("<p>AT&amp;amp;T</p>")).toBe("AT&amp;T");
  });

  it("keeps single-encoded decimal and the five basic named references as before", () => {
    expect(extractVisibleText("<p>it&#39;s AT&amp;T &lt;b&gt; &quot;q&quot;&nbsp;end</p>")).toBe(
      'it\'s AT&T <b> "q" end',
    );
  });

  it("applies the browser's numeric rules: windows-1252 for 128-159, U+FFFD for the invalid, never a throw", () => {
    expect(extractVisibleText("<p>it&#146;s &#150; ok</p>")).toBe("it\u2019s \u2013 ok");
    expect(extractVisibleText("<p>a&#0;b&#xD800;c&#x110000;d</p>")).toBe("a\uFFFDb\uFFFDc\uFFFDd");
    expect(() => extractVisibleText("<p>&#99999999;</p>")).not.toThrow();
    expect(extractVisibleText("<p>&#99999999;</p>")).toBe("\uFFFD");
  });

  it("leaves a name outside its published table exactly as written", () => {
    expect(extractVisibleText("<p>&notarealentity; stays</p>")).toBe("&notarealentity; stays");
  });

  it("claim_hash covers the claim text alone, so the same sentence on two surfaces hashes alike", () => {
    const a = claimHash("market leader powering the majority of the sector");
    expect(a).toBe(sha256hex(Buffer.from("market leader powering the majority of the sector", "utf8")));
    expect(a).not.toBe(claimHash("market leader powering the majority of the sector."));
  });
});

describe("a conforming artifact", () => {
  it("verifies, and carries every field its state requires", () => {
    const a = captured();
    const { ok, errors } = verifyArtifact(a);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(a.schema).toBe(SCHEMA);
    expect(a.state).toBe("CLAIM_CAPTURED");
    expect(a.does_not_prove.length).toBeGreaterThan(0);
    expect(a.artifact_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("recomputes its own digest from the published bytes", () => {
    const a = captured();
    const roundTripped = JSON.parse(JSON.stringify(a));
    expect(artifactDigest(roundTripped)).toBe(a.artifact_sha256);
  });
});

describe("THE TAMPER TEST — the verifier must REJECT an altered artifact", () => {
  it("rejects a rewritten claim, naming both the claim_hash and the artifact digest", () => {
    const a = captured();
    a.claim_verbatim = "the only platform of its kind anywhere";
    const { ok, errors } = verifyArtifact(a);
    expect(ok).toBe(false);
    expect(errors.join("\n")).toMatch(/claim_hash mismatch/);
    expect(errors.join("\n")).toMatch(/artifact_sha256 MISMATCH/);
  });

  it("rejects a rewritten EVIDENCE URL — the field that sat outside the digest in the failure this guards against (spec 6.5)", () => {
    const a = captured();
    a.source_url = "https://evil.example/fake";
    const { ok, errors } = verifyArtifact(a);
    expect(ok).toBe(false);
    expect(errors.join("\n")).toMatch(/artifact_sha256 MISMATCH/);
  });

  it("rejects a rewritten SUBJECT — a maintenance record attached to the wrong organisation is the most serious defect available", () => {
    const a = captured();
    a.subject.name = "A Different Company";
    expect(verifyArtifact(a).ok).toBe(false);
  });

  it("rejects a silently upgraded STATE", () => {
    const a = captured();
    a.state = "CLAIM_MEASURED";
    const { ok, errors } = verifyArtifact(a);
    expect(ok).toBe(false);
    expect(errors.join("\n")).toMatch(/artifact_sha256 MISMATCH/);
    expect(errors.join("\n")).toMatch(/requires window/);
  });

  it("rejects an added field and a deleted field alike", () => {
    const added = captured();
    added.verdict = "overstated";
    expect(verifyArtifact(added).ok).toBe(false);
    const removed = captured();
    delete removed.measurement_plan;
    expect(verifyArtifact(removed).ok).toBe(false);
  });

  it("accepts the artifact again once the digest is honestly recomputed over the new bytes", () => {
    const a = captured();
    a.claim_verbatim = "institutional-grade infrastructure";
    a.claim_hash = claimHash(a.claim_verbatim);
    delete a.artifact_sha256;
    a.artifact_sha256 = artifactDigest(a);
    expect(verifyArtifact(a)).toEqual({ ok: true, errors: [] });
  });
});

describe("the state machine is enforced, not described (spec 4, 5.3)", () => {
  it("has exactly four states, in the implementation and in the specification", () => {
    expect(STATES).toEqual(["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"]);
    for (const s of STATES) expect(SPEC_MD).toContain(s);
    expect(SPEC_MD).toMatch(/There are four, there are only four/);
  });

  it("refuses a fifth state", () => {
    const a = captured();
    a.state = "CLAIM_DISPUTED";
    expect(verifyArtifact(a).errors.join("\n")).toMatch(/no fifth state/);
  });

  it("refuses CLAIM_MEASURED on a majority claim with no denominator", () => {
    const a = captured();
    Object.assign(a, {
      state: "CLAIM_MEASURED",
      measurement_plan: undefined,
      window: { from: "2026-09-01T00:00:00Z", to: "2026-09-22T00:00:00Z" },
      method: {
        description: "sector share from the published breakdown, summed over the window",
        evidence: [
          { url: "https://example.org/breakdown", access_date: "2026-09-22T14:00:00Z", content_hash: "b".repeat(64) },
        ],
      },
      result: { value: "0.41", n: 137 },
    });
    delete a.measurement_plan;
    a.artifact_sha256 = artifactDigest(a);
    expect(verifyArtifact(a).errors.join("\n")).toMatch(/denominator/);
  });

  it("refuses a measured result carried as a floating-point number", () => {
    const a = captured();
    Object.assign(a, {
      state: "CLAIM_MEASURED",
      window: { from: "2026-09-01T00:00:00Z", to: "2026-09-22T00:00:00Z" },
      denominator: { description: "named sector participants", n: 137 },
      method: {
        description: "sector share from the published breakdown",
        evidence: [
          { url: "https://example.org/breakdown", access_date: "2026-09-22T14:00:00Z", content_hash: "b".repeat(64) },
        ],
      },
      result: { value: 0.41, n: 137 },
    });
    delete a.measurement_plan;
    expect(verifyArtifact(a).errors.join("\n")).toMatch(/must be a string/);
  });

  it("refuses UNCHECKABLE with no reason, and CLAIM_CAPTURED with no plan", () => {
    const u = captured();
    u.state = "UNCHECKABLE";
    expect(verifyArtifact(u).errors.join("\n")).toMatch(/uncheckable_reason/);
    const c = captured();
    delete c.measurement_plan;
    expect(verifyArtifact(c).errors.join("\n")).toMatch(/measurement_plan/);
  });

  it("refuses an empty does_not_prove, and one that omits the not-false statement", () => {
    const a = captured();
    a.does_not_prove = [];
    expect(verifyArtifact(a).errors.join("\n")).toMatch(/does_not_prove/);
    const b = captured();
    b.does_not_prove = ["nothing in particular"];
    expect(verifyArtifact(b).errors.join("\n")).toMatch(/does not indicate the claim is false/);
  });
});

describe("an observed change is never an allegation (spec 4.9, 10.1)", () => {
  const withChange = (note) => {
    const a = captured();
    a.observed_changes = [
      {
        observed_utc: "2026-09-29T00:04:00Z",
        previous_hash: "a".repeat(64),
        current_hash: "c".repeat(64),
        note,
      },
    ];
    delete a.artifact_sha256;
    a.artifact_sha256 = artifactDigest(a);
    return a;
  };

  it("accepts a neutral record of two digests", () => {
    expect(verifyArtifact(withChange("visible text at the source URL differs from the previous read")).ok).toBe(true);
  });

  it("rejects words of motive or concealment", () => {
    for (const note of [
      "the claim was quietly removed",
      "they scrubbed the page",
      "the company walked back its figure",
      "the original number was misleading",
    ]) {
      const { ok, errors } = verifyArtifact(withChange(note));
      expect(ok).toBe(false);
      expect(errors.join("\n")).toMatch(/never an allegation/);
    }
  });

  it("rejects a verdict smuggled into the measurement plan", () => {
    const a = captured();
    a.measurement_plan = "the figure is exaggerated; measure it weekly";
    expect(verifyArtifact(a).errors.join("\n")).toMatch(/asserts no falsity/);
  });

  it("rejects an observed change whose two digests are identical", () => {
    const a = withChange("no change");
    a.observed_changes[0].current_hash = a.observed_changes[0].previous_hash;
    expect(verifyArtifact(a).errors.join("\n")).toMatch(/not a change/);
  });
});

describe("capture from a page, with no network", () => {
  const html = `<!doctype html><html><body><script>1</script><h1>Example  Corp</h1>
    <p>market leader powering the majority of the sector</p></body></html>`;
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => "text/html; charset=utf-8" },
    text: async () => html,
  });

  it("produces a conforming artifact whose content hash a stranger can recompute", async () => {
    const { artifact, claim_present_at_source } = await captureFromUrl({
      url: "https://example.com/",
      claim: "market leader powering the majority of the sector",
      claim_id: "EX-1",
      subject: { name: "Example Corp", identifier: "example.com", identifier_kind: "domain" },
      source_url: "https://example.com/",
      measurement_plan: "capture weekly",
      next_read_utc: "2026-09-29T00:00:00Z",
      fetchImpl,
    });
    expect(verifyArtifact(artifact)).toEqual({ ok: true, errors: [] });
    expect(claim_present_at_source).toBe(true);
    expect(artifact.source_content_hash.covers).toBe("visible-text");
    const expected = sha256hex(Buffer.from(extractVisibleText(html), "utf8"));
    expect(artifact.source_content_hash.value).toBe(expected);
    expect(artifact.source_content_hash.extracted_chars).toBe(extractVisibleText(html).length);
  });

  it("reports absence of the claim as an observation, not as a state change", async () => {
    const { artifact, claim_present_at_source } = await captureFromUrl({
      url: "https://example.com/",
      claim: "a sentence this page does not contain",
      claim_id: "EX-2",
      subject: { name: "Example Corp", identifier: "example.com", identifier_kind: "domain" },
      source_url: "https://example.com/",
      measurement_plan: "capture weekly",
      next_read_utc: "2026-09-29T00:00:00Z",
      fetchImpl,
    });
    expect(claim_present_at_source).toBe(false);
    expect(artifact.state).toBe("CLAIM_CAPTURED");
  });
});

describe("the specification says what this code does", () => {
  it("is CC0, names its canonical URL, and reserves 'anchored' for verified attestations", () => {
    expect(SPEC_MD).toContain("CC0 1.0 Universal");
    expect(SPEC_MD).toContain("https://councilof.ai/spec/claim-maintenance/v0.1/");
    expect(SPEC_MD).toMatch(/\*\*submitted\*\* is not \*\*anchored\*\*|`submitted` is not `anchored`|submitted.{0,40}not.{0,40}anchored/i);
  });

  it("uses the RFC 9162 construction and DISCLOSES that our separate public root does not", () => {
    expect(SPEC_MD).toContain("RFC 9162");
    expect(SPEC_MD).toMatch(/0x00/);
    expect(SPEC_MD).toMatch(/0x01/);
    expect(SPEC_MD).toMatch(/largest power of two/);
    expect(SPEC_MD).toMatch(/duplicat\w+ the odd final node/i);
    expect(SPEC_MD).toContain("CVE-2012-2459");
  });

  it("states the five things that are not claim maintenance", () => {
    for (const s of [
      "not fact-checking",
      "not certification",
      "not auditing",
      "not reputation scoring",
      "not adversarial journalism",
    ]) {
      expect(SPEC_MD.toLowerCase()).toContain(s);
    }
  });
});
