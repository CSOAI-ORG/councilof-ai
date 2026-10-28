import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AuthoritySignals, { AUTHORITY_GROUPS } from "./AuthoritySignals";

const html = renderToStaticMarkup(<AuthoritySignals />);
const shell = readFileSync(resolve(__dirname, "../../index.html"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(__dirname, "../../../public/interop/memberships.json"), "utf8"));
const organization = [...shell.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]))
  .find((node) => node["@id"] === "https://councilof.ai/#org");

describe("business standing and public-record signals", () => {
  it("keeps company standing, participation, listings and official sources in separate groups", () => {
    expect(AUTHORITY_GROUPS.map((group) => group.title)).toEqual([
      "Registered business",
      "Memberships & standards",
      "Independent & public listings",
      "Official records in our work",
    ]);
    for (const group of AUTHORITY_GROUPS) {
      for (const link of group.links) {
        expect(link.label).toBeTruthy();
        expect(link.relationship).toBeTruthy();
        expect(link.href).toBeTruthy();
        expect(link.title).toBeTruthy();
        expect(html).toContain(`href="${link.href.replace(/&/g, "&amp;")}"`);
      }
    }
  });

  it("names the SEC evidence precisely and does not promote the FDIC draft to a filing", () => {
    expect(html).toContain("SEC EDGAR");
    expect(html).toContain("official public filings mirrored");
    expect(html).toContain("sec-submissions-cik1786958.json.meta.json");
    expect(html).toContain("FDIC");
    expect(html).toContain("consultation research · no submission claimed");
    expect(html).toContain("remained drafts and were not submitted");
    expect(html).not.toMatch(/FDIC[- ]insured|SEC[- ]registered|FDIC member|SEC member/i);
  });

  it("says what regulator references and third-party participation do not mean", () => {
    expect(html).toContain("Participation is not endorsement");
    expect(html).toContain("a listing is not adoption");
    expect(html).toContain("do not mean that either regulator endorses, insures, registers or accredits");
  });
});

describe("Organization structured data", () => {
  it("declares only evidenced memberships, backed by the public participation manifest", () => {
    expect(organization.memberOf.map((org: { name: string }) => org.name)).toEqual([
      "C2PA",
      "Open Invention Network",
      "LOT Network",
    ]);
    for (const id of ["c2pa", "open-invention-network", "lot-network"]) {
      const row = manifest.rows.find((candidate: { id: string }) => candidate.id === id);
      expect(row.kind).toBe("member");
      expect(row.state).toBe("VERIFIED");
      expect(row.public_evidence).toBe(true);
    }
  });

  it("uses sameAs only for genuine identity profiles and never for regulators", () => {
    expect(organization.sameAs).toEqual(expect.arrayContaining([
      "https://find-and-update.company-information.service.gov.uk/company/16939677",
      "https://huggingface.co/csoai",
      "https://www.wikidata.org/wiki/Q141128616",
      "https://github.com/CSOAI-ORG",
      "https://linkedin.com/company/csoai",
    ]));
    expect(JSON.stringify(organization)).not.toMatch(/FDIC|SEC EDGAR|sec\.gov|fdic\.gov/i);
    expect(organization.legalName).toBe("CSOAI LTD");
  });
});
