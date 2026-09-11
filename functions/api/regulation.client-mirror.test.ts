import { describe, expect, it } from "vitest";
import { REGULATION_FEED } from "./regulation";
import clientFeed from "../../client/src/data/regulation.json";

/**
 * The client register (client/src/data/regulation.json) mirrors this signed
 * server register — same schema, same dates, byte-identical entries where the
 * two overlap; the register wins on any disagreement. Anything the client
 * carries beyond this feed must be marked client_addition so the difference is
 * stated, never silent.
 *
 * Lives beside the server module (not under client/src) so the site tsconfig,
 * which only includes client/src and shared, does not pull the Pages function
 * into the browser program.
 */

type Entry = {
  date: string;
  instrument: string;
  what: string;
  basis: string;
  status: string;
  penalty_exposure: string;
  client_addition?: boolean;
};

const serverEntries = REGULATION_FEED.deadlines as readonly Entry[];
const clientEntries = clientFeed.deadlines as Entry[];

const keyOf = (e: Entry) => `${e.date}|${e.instrument}`;

describe("client regulation.json — mirror of the server register", () => {
  it("carries the same schema and register-level fields as the server feed", () => {
    expect(clientFeed.schema).toBe(REGULATION_FEED.schema);
    expect(clientFeed.verified_as_of).toBe(REGULATION_FEED.verified_as_of);
    expect(clientFeed.corrections_policy).toBe(REGULATION_FEED.corrections_policy);
    expect(clientFeed.scope_note).toBe(REGULATION_FEED.scope_note);
    expect(clientFeed.headline_correction).toBe(REGULATION_FEED.headline_correction);
  });

  it("reproduces every server deadline byte-identically (the register wins)", () => {
    const clientByKey = new Map(clientEntries.map((e) => [keyOf(e), e]));
    for (const server of serverEntries) {
      const client = clientByKey.get(keyOf(server));
      expect(client, `missing server entry ${keyOf(server)}`).toBeDefined();
      for (const field of ["date", "instrument", "what", "basis", "status", "penalty_exposure"] as const) {
        expect(client![field], `${keyOf(server)} field ${field}`).toBe(server[field]);
      }
    }
  });

  it("marks every client-only entry as client_addition and cites a basis", () => {
    const serverKeys = new Set(serverEntries.map(keyOf));
    const additions = clientEntries.filter((e) => !serverKeys.has(keyOf(e)));
    for (const addition of additions) {
      expect(addition.client_addition, `${keyOf(addition)} must be marked`).toBe(true);
      expect(addition.basis.length).toBeGreaterThan(0);
      expect(addition.penalty_exposure.length).toBeGreaterThan(0);
    }
  });

  it("every deadline carries date, instrument, what, basis, status and penalty exposure", () => {
    for (const e of clientEntries) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.instrument.length).toBeGreaterThan(0);
      expect(e.what.length).toBeGreaterThan(0);
      expect(e.basis.length).toBeGreaterThan(0);
      expect(["IN_FORCE", "UPCOMING"]).toContain(e.status);
      expect(e.penalty_exposure.length).toBeGreaterThan(0);
    }
  });
});
