import { ArrowUpRight, BookOpenCheck, FileSearch, History, MessagesSquare, ScanEye, Users } from "lucide-react";
import "@/styles/home-public-journey.css";

/** Public navigation only: no incident intake, case creation or background inference. */
export const WATCHDOG_JOURNEYS = [
  { title: "Inspect a public claim", body: "Find the statement, its source and the date it was recorded. Separate what an organisation says from what the evidence establishes.", href: "/dashboard?tab=watchdog", cta: "Explore public claims", icon: ScanEye },
  { title: "Read the supporting material", body: "Open the research library and follow the published references. Check the method and scope before reusing a finding.", href: "/watchdog/?view=library", cta: "Open the research library", icon: FileSearch },
  { title: "See what was corrected", body: "Follow dated corrections and superseding records. An older result remains part of the history, not a promise about today.", href: "/dashboard?tab=corrections", cta: "Read the corrections", icon: History },
] as const;

export const LEARNING_JOURNEYS = [
  { title: "Learn the foundations", body: "Explore the Academy's lessons on AI governance, evidence and measurement. Start with the concepts before interpreting a score.", href: "/dashboard?tab=academy", cta: "Explore the Academy", icon: BookOpenCheck },
  { title: "Practise with the evidence", body: "Use the learning arena to work through a question, play a challenge, explain your reasoning and prepare a proposed improvement.", href: "/dashboard?tab=learn", cta: "Enter the learning arena", icon: MessagesSquare },
  { title: "Understand the human decision", body: "Inspect the staff and human-review workflow: what is proposed, which evidence supports it and whether a person is authorised to decide.", href: "/dashboard?tab=staff", cta: "Inspect human review", icon: Users },
] as const;

export const PUBLIC_JOURNEY_FAQS = [
  { question: "What can I do here without an account?", answer: "Read the published GSPC results, inspect public claims and corrections, and use the record verifier. Some connected workspaces and actions have their own access requirements; opening a public page does not grant permission to execute them." },
  { question: "Does a daily report mean every AI model was tested again?", answer: "No. A report can summarise existing evidence. Check the measurement date, source revision and evidence status inside the record, not only the report's publication date. A missing or unchanged input is not a fresh measurement." },
  { question: "What does a verified signature establish?", answer: "A valid signature establishes that the checked record matches the signed bytes and the published signing key. It does not, by itself, establish that the underlying claim is true, that a model is safe or that a human approved an action." },
  { question: "Can payment change a result or buy a better grade?", answer: "No. Checking published records is free. Paid services have their own scope, terms and deliverables; payment does not change a measurement. Read the service terms before deciding whether to commission work." },
] as const;

function JourneyCards({ journeys }: { journeys: readonly { title: string; body: string; href: string; cta: string; icon: typeof ScanEye }[] }) {
  return <div className="hp-journey-grid">
    {journeys.map(({ title, body, href, cta, icon: Icon }) => <article className="hp-journey-card" key={href}>
      <Icon size={25} strokeWidth={1.5} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{body}</p>
      <a href={href} className="hp-text-link">{cta}<ArrowUpRight size={16} aria-hidden="true" /></a>
    </article>)}
  </div>;
}

export function HomeWatchdog() {
  return <section id="watchdog" className="hp-section hp-public-journey" aria-labelledby="home-watchdog-h" data-testid="home-public-watchdog">
    <div className="section-shell">
      <div className="hp-section-heading">
        <div><p className="hp-eyebrow">Public Watchdog</p><h2 id="home-watchdog-h">An AI claim deserves<br /><span>a closer look.</span></h2></div>
        <p className="hp-heading-aside">Choosing a provider, researching a concern or checking our own work? Follow the public claim to its evidence, history and corrections. You do not have to take a headline at face value.</p>
      </div>
      <JourneyCards journeys={WATCHDOG_JOURNEYS} />
      <details className="hp-journey-disclosure">
        <summary>What is available today?</summary>
        <p>This is a public evidence-reading journey, not a staffed incident-response service. A listing is not an allegation or a verdict. Source availability, independent verification and human review are different states; inspect the record for what has actually been established.</p>
        <p>Do not submit private incident details through public chat. This page does not collect reports, assign reviewers or promise a response time.</p>
        <a href="/watchdog/" className="hp-text-link">Inspect the public Watchdog page<ArrowUpRight size={16} aria-hidden="true" /></a>
      </details>
    </div>
  </section>;
}

export function HomeLearningJourney() {
  return <section id="learning" className="hp-section hp-public-journey hp-public-journey-soft" aria-labelledby="home-learning-journey-h" data-testid="home-learning-journey">
    <div className="section-shell">
      <div className="hp-section-heading">
        <div><p className="hp-eyebrow">Academy · practice · human review</p><h2 id="home-learning-journey-h">Better evidence.<br /><span>Better-informed people.</span></h2></div>
        <p className="hp-heading-aside">Council of AI — the Council for the Safety of Artificial Intelligence — connects measurement with learning. Understand a result, practise evaluating it and see where human judgement and permission belong.</p>
      </div>
      <JourneyCards journeys={LEARNING_JOURNEYS} />
      <details className="hp-journey-disclosure">
        <summary>What does completing a challenge change?</summary>
        <p>A practice result is not a professional qualification, a change to the public benchmark or permission to act. A proposed fix still needs the relevant review. Completing a lesson does not, by itself, train or improve a deployed AI model.</p>
        <a href="/dashboard?tab=him" className="hp-text-link">Explore H.I.M., the human-in-the-loop layer<ArrowUpRight size={16} aria-hidden="true" /></a>
      </details>
    </div>
  </section>;
}

export function HomeJourneyQuestions() {
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: PUBLIC_JOURNEY_FAQS.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };
  return <section id="getting-started" className="hp-section hp-public-journey" aria-labelledby="home-journey-questions-h" data-testid="home-journey-questions">
    <div className="section-shell">
      <div className="hp-section-heading"><div><p className="hp-eyebrow">Before you start</p><h2 id="home-journey-questions-h">Know what you are reading.</h2></div><p className="hp-heading-aside">A few distinctions make the whole workspace easier to use.</p></div>
      {PUBLIC_JOURNEY_FAQS.map(({ question, answer }) => <details className="hp-journey-disclosure" key={question}><summary>{question}</summary><p>{answer}</p></details>)}
      <div className="hp-resource-row" aria-label="Help and service terms"><a href="/faq/">More questions<ArrowUpRight size={14} aria-hidden="true" /></a><a href="/services/">Service scope and terms<ArrowUpRight size={14} aria-hidden="true" /></a><a href="/contact?arm=run">Discuss a measurement<ArrowUpRight size={14} aria-hidden="true" /></a></div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    </div>
  </section>;
}
