// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import snapshot from "../../../council-os/axis-specialists/board-2026-10-28.snapshot.json";
import { WORKING_GROUPS, REVOCATION_REVIEW_COMMIT, REVOCATION_REVIEW_PROTOCOL, workingGroup, workingGroupBrief, workingGroupEnquiryHref } from "./workingGroups";
import { enquiryPreset, prepareContactEmail, CONTACT_ENQUIRY_EMAIL } from "./pilotEnquiry";
import WorkingGroups from "../components/WorkingGroups";
import Watchdog from "../pages/Watchdog";

let root: Root | undefined;
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("Public Watchdog contribution path", () => {
  it("covers every axis in the dated board exactly once without inventing appointments", () => {
    const axes = WORKING_GROUPS.flatMap(g => g.axes);
    expect([...axes].sort()).toEqual(snapshot.axes.map(a => a.axis).sort());
    expect(new Set(axes).size).toBe(axes.length);
    expect(new Set(WORKING_GROUPS.map(g => g.id)).size).toBe(WORKING_GROUPS.length);
    for (const group of WORKING_GROUPS) {
      expect(group.status).toBe("forming");
      expect(group.chair).toBeNull();
      expect(group.acceptedMembers).toEqual([]);
    }
  });

  it("carries each selected group into a reviewable draft with a fixed recipient", () => {
    for (const group of WORKING_GROUPS) {
      const url = new URL(workingGroupEnquiryHref(group.id), "https://councilof.ai");
      const preset = enquiryPreset(url.search)!;
      expect(preset.subject).toContain(group.name);
      expect(preset.message).toContain(group.firstTask);
      expect(preset.message).toContain("require separate agreement");
      const draft = prepareContactEmail({ name: "Researcher", email: "researcher@example.org", ...preset });
      expect(draft.copyText).toContain("To: " + CONTACT_ENQUIRY_EMAIL);
    }
  });

  it.each(["__proto__", "constructor", "unknown", "<script>", "agent-control\r\nBcc:other@example.org"])("rejects unknown or injected group %s", id => {
    expect(workingGroup(id)).toBeNull();
    expect(workingGroupEnquiryHref(id)).toBe("/contact/");
    expect(enquiryPreset("?" + new URLSearchParams({arm: "working-group", group: id}))).toBeNull();
  });

  it.each(WORKING_GROUPS.map(group => group.id))("keeps the downloaded brief and return draft scoped to %s", id => {
    const group = workingGroup(id)!;
    const brief = workingGroupBrief(id)!;
    expect(decodeURIComponent(brief.href.split(",").slice(1).join(","))).toBe(brief.text);
    expect(brief.filename).toBe(`council-${id}-task-brief.md`);
    expect(brief.text).toContain(group.firstTask);
    for (const output of group.reviewOutputs) expect(brief.text).toContain(output);
    expect(brief.text).toContain("no appointment implied");
    expect(brief.text).toContain("no response time is promised");
    const url = new URL(workingGroupEnquiryHref(id, "review"), "https://councilof.ai");
    expect(brief.text).toContain(url.href);
    const preset = enquiryPreset(url.search)!;
    expect(preset.subject).toBe(`Working group contribution — ${group.name}`);
    expect(preset.message).toContain(group.firstTask);
    expect(preset.message).toContain("unknown effects");
    expect(preset.message).toContain("not an accepted appointment");
  });

  it("pins the runnable packet and keeps negative controls and scope visible", () => {
    const brief = workingGroupBrief("agent-control")!;
    expect(brief.text).toContain(REVOCATION_REVIEW_COMMIT);
    expect(brief.text).toContain(REVOCATION_REVIEW_PROTOCOL);
    expect(brief.text).toContain("non-cancellable FAIL");
    expect(brief.text).toContain("unknown-effect INCONCLUSIVE");
    expect(brief.text).toContain("Checking the full record exits 1");
    expect(brief.text).toContain("not production halt latency");
    expect(workingGroupBrief("unknown")).toBeNull();
    expect(workingGroupBrief("__proto__")).toBeNull();
  });

  it.each(["approved", "member", "send", "__proto__", "review\\r\\nBcc:x@example.org"])("rejects unsupported contribution stage %s", stage => {
    expect(enquiryPreset("?" + new URLSearchParams({arm: "working-group", group: "agent-control", stage}))).toBeNull();
  });

  it("keeps contribution return recipients fixed and ignores query-supplied evidence", () => {
    const preset = enquiryPreset("?arm=working-group&group=agent-control&stage=review&to=attacker@example.org&message=approved&subject=appointed")!;
    const draft = prepareContactEmail({name:"", email:"", ...preset});
    expect(draft.copyText).toContain("To: " + CONTACT_ENQUIRY_EMAIL);
    expect(draft.copyText).not.toContain("attacker@example.org");
    expect(draft.subject).not.toContain("appointed");
    expect(draft.body).toContain("Public evidence or reproducible result link:");
  });

  it("ignores query-supplied recipients and titles", () => {
    const preset = enquiryPreset("?arm=working-group&group=agent-control&to=attacker@example.org&name=Injected")!;
    const draft = prepareContactEmail({ name: "", email: "", ...preset });
    expect(draft.copyText).not.toContain("attacker@example.org");
    expect(draft.subject).not.toContain("Injected");
    expect(enquiryPreset("?arm=working-group")).toBeNull();
  });

  it("renders enquiry, axis, charter and challenge routes with honest forming state", () => {
    const html = renderToStaticMarkup(<WorkingGroups />);
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelectorAll("article")).toHaveLength(WORKING_GROUPS.length);
    expect(doc.querySelectorAll("a[download]")).toHaveLength(WORKING_GROUPS.length);
    expect(doc.querySelectorAll('a[href*="stage=review"]')).toHaveLength(WORKING_GROUPS.length);
    expect(doc.querySelector(`a[href="${REVOCATION_REVIEW_PROTOCOL}"]`)).not.toBeNull();
    expect(doc.querySelector("#contribution-steps")).not.toBeNull();
    expect(doc.querySelectorAll('a[href^="/gspc/"]')).toHaveLength(snapshot.axes.length);
    expect(doc.querySelector('a[href="/dispute/"]')).not.toBeNull();
    expect(doc.querySelector('a[href="/dashboard?tab=staff"]')).not.toBeNull();
    expect(doc.body.textContent).toContain("does not submit an application");
    expect(doc.body.textContent).toContain("not yet confirmed");
  });

  it("opens from a deep link and preserves groups through back navigation without fetching claims", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const fetch = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetch);
    window.history.replaceState(null, "", "/watchdog/?view=groups");
    const el = document.createElement("div");
    document.body.append(el);
    root = createRoot(el);
    await act(async () => root!.render(<Watchdog />));
    expect(el.querySelector("#working-groups-heading")).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    const buttons = () => [...el.querySelectorAll("button")];
    expect(buttons().find(b => b.textContent === "Claims")?.getAttribute("aria-pressed")).toBe("false");
    expect(buttons().find(b => b.textContent === "Working groups")?.getAttribute("aria-pressed")).toBe("true");
    await act(async () => buttons().find(b => b.textContent === "Claims")!.click());
    expect(window.location.search).toBe("");
    expect(el.querySelector("#working-groups-heading")).toBeNull();
    expect(fetch).toHaveBeenCalled();
    await act(async () => {
      window.history.replaceState(null, "", "/watchdog/?view=groups");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(el.querySelector("#working-groups-heading")).not.toBeNull();
  });
});
