import { ArrowUpRight } from "lucide-react";
import ExternalUseEvidence from "@/components/ExternalUseEvidence";

const STEPS = [
  {
    title: "Read the method",
    body: "Inspect the published procedure, grading rule and scope. Check which version was used for the run.",
    href: "/methodology/",
    link: "Explore the methodology",
  },
  {
    title: "Inspect the record",
    body: "Follow the subject, sample, observation date and evidence state. Signed and unsigned work stay distinguishable.",
    href: "/board/",
    link: "Read published results",
  },
  {
    title: "Verify it yourself",
    body: "Recompute a supported record’s ID and check its signature against the published keys in your browser.",
    href: "/gspc-verify",
    link: "Open the free verifier",
  },
  {
    title: "Keep the history",
    body: "Read dated corrections and superseding records. Check what changed before reusing earlier evidence.",
    href: "/corrections/",
    link: "Follow the corrections",
  },
] as const;

export default function HomeEvidence() {
  return (
    <>
      <section
        id="how-it-works"
        className="hp-section hp-method"
        aria-labelledby="home-method-h"
        data-testid="home-method"
      >
        <div className="section-shell hp-method-grid">
          <div className="hp-method-intro">
            <p className="hp-eyebrow">03 / Built to be checked</p>
            <h2 id="home-method-h">
              A result is the start.
              <br />
              <span>Follow the evidence.</span>
            </h2>
            <p>
              We publish measurements and the information needed to inspect
              them. You can check a record without taking our word for it.
            </p>
            <figure>
              <img
                src="/images/home/evidence-card-800.webp"
                alt="Illustration of a measurement record held up for inspection"
                width={800}
                height={450}
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                Illustration. A signature binds a record to its signer. It does
                not prove the measurement is right.
              </figcaption>
            </figure>
          </div>
          <ol className="hp-method-steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="hp-step-number">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <a href={step.href} className="hp-text-link">
                    {step.link}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </div>
              </li>
            ))}
          </ol>
          <div
            id="human-review"
            className="hp-human-note"
            data-testid="home-human-review"
          >
            <div>
              <p className="hp-eyebrow">Human authority stays separate</p>
              <h3>
                A measurement records an observation.
                <br />A person’s authority is a separate requirement.
              </h3>
            </div>
            <div>
              <p>
                Council OS includes a human-review workflow. Configuration alone
                does not establish a reviewer’s identity, competence, acceptance
                or permission to act.
              </p>
              <a href="/dashboard?tab=staff" className="hp-text-link">
                Inspect staff and human review{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
      <div className="hp-section hp-external">
        <div className="section-shell">
          <p className="hp-eyebrow">In the public record</p>
          <ExternalUseEvidence compact id="home-external-use" />
        </div>
      </div>
    </>
  );
}
