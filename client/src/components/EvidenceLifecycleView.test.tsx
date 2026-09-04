import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import EvidenceLifecycleView from "./EvidenceLifecycleView";

describe("evidence lifecycle view", () => {
  it("shows both intake lanes and every non-automatic admission boundary", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/dashboard" ssrSearch="tab=fabric">
        <EvidenceLifecycleView
          actionContract={{
            schema: "csoai.capability-action-contract/0.1",
            state: "DECLARED_DISABLED",
            mode: "FAIL_CLOSED",
            execution_enabled: false,
            action_count: 6,
            last_error: null,
          }}
        />
      </Router>,
    );

    expect(html).toContain("Game or quest");
    expect(html).toContain("OBSERVATION");
    expect(html).toContain("Incident report");
    expect(html).toContain("REPORTED");
    expect(html).toContain("CANDIDATE_FINDING");
    expect(html).toContain("/api/evidence-intake");
    expect(html).toContain("REVIEWED_WRITE");
    expect(html).toContain("REPRODUCED");
    expect(html).toContain("MEASURED");
    expect(html).toContain("SIGNED");
    expect(html).toContain("ROOT_INCLUDED");
    expect(html).toContain("NO AUTOMATIC PROMOTION");
    expect(html).toContain("EXECUTION DISABLED");
    expect(html).toContain("not proof that a measurement worker ran");
    expect(html).toContain("does not reproduce, measure, sign, or prove");
    expect(html).not.toContain("automatically added to GSPC");
  });

  it("fails visibly closed when the action contract cannot be checked", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/dashboard" ssrSearch="tab=fabric">
        <EvidenceLifecycleView
          actionContract={{
            schema: null,
            state: "UNCHECKABLE",
            mode: null,
            execution_enabled: false,
            action_count: 0,
            last_error: "action contract was absent",
          }}
        />
      </Router>,
    );
    expect(html).toContain("ACTION CONTRACT UNCHECKABLE");
    expect(html).toContain("action contract was absent");
    expect(html).toContain("EXECUTION DISABLED");
  });
});
