import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,expect,it,vi} from "vitest";
import EvidenceFoundationsCourse,{buildEvidenceFoundationsExport} from "./EvidenceFoundationsCourse";

describe("EvidenceFoundationsCourse",()=>{
  it("renders as SovSpace Learning and never exposes the backend codename",()=>{
    const html=renderToStaticMarkup(<EvidenceFoundationsCourse/>);
    expect(html).toContain("SovSpace Learning");
    expect(html).toContain("Evidence Foundations");
    expect(html).toContain("PRACTICE_ONLY");
    expect(html).toContain("UNMEASURED");
    expect(html.toLowerCase()).not.toContain("laputa");
  });

  it("renders the first teaching exercise and separates assessment mode",()=>{
    const html=renderToStaticMarkup(<EvidenceFoundationsCourse/>);
    expect(html).toContain("Lesson 1 of 6");
    expect(html).toContain("A vendor page and a retained digest");
    expect(html).toContain("Learn &amp; practice");
    expect(html).toContain("Assessment");
    expect(html).not.toContain("A policy PDF is replaced");
  });

  it("keeps all high-authority claims explicitly absent",()=>{
    const html=renderToStaticMarkup(<EvidenceFoundationsCourse/>);
    expect(html).toContain("does not persist progress server-side");
    expect(html).toContain("train a model");
    expect(html).toContain("create a certificate");
    expect(html).toContain("determine compliance");
    expect(html).toContain("admit GSPC evidence");
  });

  it("exports only a local practice record",()=>{
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-28T04:30:00Z"));
    const value=buildEvidenceFoundationsExport(["source-identity"],{
      "source-identity":{
        lessonId:"source-identity",
        teachingChoiceId:"a",
        assessmentChoiceId:"b",
      },
    });
    expect(value).toMatchObject({
      schema:"csoai.s06-evidence-foundations-session-export/0.1",
      exported_at:"2026-09-28T04:30:00.000Z",
      public_product:"SovSpace Learning",
      practice_only:true,
      measurement_state:"UNMEASURED",
      certificate_created:false,
      compliance_determination:false,
      model_training_authorized:false,
      completed_lesson_ids:["source-identity"],
    });
    expect(JSON.stringify(value).toLowerCase()).not.toContain("laputa");
    vi.useRealTimers();
  });

  it("does not perform a fetch, storage write or provider call during server render",()=>{
    const fetchSpy=vi.fn();
    vi.stubGlobal("fetch",fetchSpy);
    renderToStaticMarkup(<EvidenceFoundationsCourse/>);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
