import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {Router} from "wouter";
import {describe,expect,it,vi} from "vitest";
import DashboardLearningPane from "./DashboardLearningPane";

describe("DashboardLearningPane + Evidence Foundations",()=>{
  it("renders the existing learning pane and the new course together",()=>{
    const fetchSpy=vi.fn(()=>{throw new Error("Unexpected fetch during SSR");});
    vi.stubGlobal("fetch",fetchSpy);
    const html=renderToStaticMarkup(
      <Router ssrPath="/dashboard?tab=learn"><DashboardLearningPane/></Router>,
    );
    expect(html).toContain('data-testid="dashboard-learning-pane"');
    expect(html).toContain('data-testid="evidence-foundations-course"');
    expect(html).toContain("Human-guided GSPC curriculum");
    expect(html).toContain("SovSpace Learning");
    expect(html).toContain("Evidence Foundations");
    expect(html).toContain("PRACTICE_ONLY");
    expect(html).toContain("UNMEASURED");
    expect(html.toLowerCase()).not.toContain("laputa");
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("keeps existing model-arena and games navigation alongside learning",()=>{
    const html=renderToStaticMarkup(
      <Router ssrPath="/dashboard?tab=learn"><DashboardLearningPane/></Router>,
    );
    expect(html).toContain('href="/dashboard?tab=space"');
    expect(html).toContain('href="/dashboard?tab=play"');
    expect(html).toContain('href="/dashboard?tab=tools"');
  });
});
