// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import snapshot from "../../../council-os/axis-specialists/board-2026-10-28.snapshot.json";
import { WORKING_GROUPS, workingGroup, workingGroupEnquiryHref } from "./workingGroups";
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
