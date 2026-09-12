import { describe, expect, it } from "vitest";
import {
  formatRawWithDecimals,
  readEthRlusdSupply,
  readXrplRlusdSupply,
  RLUSD_ETH_CONTRACT,
  RLUSD_XRPL_CURRENCY_HEX,
  RLUSD_XRPL_ISSUER,
} from "./rlusdReaders";
import snapshot from "../data/rlusd-snapshot.json";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const XRPL_OK = {
  result: {
    ledger_index: 106929485,
    obligations: { [RLUSD_XRPL_CURRENCY_HEX]: "1053014745.151137" },
  },
};

describe("readXrplRlusdSupply", () => {
  it("returns the obligations value with ledger ref on success", async () => {
    const fetchFn = () => Promise.resolve(jsonResponse(XRPL_OK));
    const reading = await readXrplRlusdSupply(fetchFn as typeof fetch, ["https://a.example"]);
    expect(reading).not.toBeNull();
    expect(reading!.chain).toBe("xrpl");
    expect(reading!.supply).toBe("1053014745.151137");
    expect(reading!.refKind).toBe("ledger");
    expect(reading!.refValue).toBe(106929485);
    expect(reading!.endpoint).toBe("https://a.example");
  });

  it("falls through the endpoint chain when the first fails", async () => {
    const calls: string[] = [];
    const fetchFn = (url: string) => {
      calls.push(String(url));
      if (calls.length === 1) return Promise.reject(new Error("network down"));
      return Promise.resolve(jsonResponse(XRPL_OK));
    };
    const reading = await readXrplRlusdSupply(fetchFn as typeof fetch, ["https://a.example", "https://b.example"]);
    expect(calls).toEqual(["https://a.example", "https://b.example"]);
    expect(reading!.endpoint).toBe("https://b.example");
  });

  it("treats a 200 without obligations for the currency as no answer, never a zero", async () => {
    const fetchFn = () =>
      Promise.resolve(jsonResponse({ result: { ledger_index: 1, obligations: { OTHER: "5" } } }));
    const reading = await readXrplRlusdSupply(fetchFn as typeof fetch, ["https://a.example"]);
    expect(reading).toBeNull();
  });

  it("returns null when every endpoint fails", async () => {
    const fetchFn = () => Promise.reject(new Error("down"));
    const reading = await readXrplRlusdSupply(fetchFn as typeof fetch, ["https://a.example", "https://b.example"]);
    expect(reading).toBeNull();
  });
});

describe("readEthRlusdSupply", () => {
  // Exact raw totalSupply for 1,369,732,627.8560317 RLUSD at 18 decimals,
  // built from the decimal string so no float ever touches it.
  const RAW = (() => {
    const [i, f] = "1369732627.8560317".split(".");
    return "0x" + (BigInt(i) * 10n ** 18n + BigInt(f.padEnd(18, "0"))).toString(16);
  })();

  it("decodes totalSupply hex at 18 decimals without floats", async () => {
    const fetchFn = (url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { method: string; params: unknown[] };
      if (body.method === "eth_call") {
        const call = body.params[0] as { to: string; data: string };
        expect(call.to).toBe(RLUSD_ETH_CONTRACT);
        expect(call.data).toBe("0x18160ddd");
        return Promise.resolve(jsonResponse({ result: RAW }));
      }
      return Promise.resolve(jsonResponse({ result: "0x18c1cd1" }));
    };
    const reading = await readEthRlusdSupply(fetchFn as typeof fetch, ["https://eth.example"]);
    expect(reading).not.toBeNull();
    expect(reading!.chain).toBe("ethereum");
    expect(reading!.supply).toBe("1369732627.8560317");
    expect(reading!.refKind).toBe("block");
    expect(reading!.refValue).toBe(25959633);
  });

  it("falls through to the next endpoint on RPC error responses", async () => {
    let n = 0;
    const fetchFn = () => {
      n += 1;
      if (n <= 1) return Promise.resolve(jsonResponse({ error: { code: -32603, message: "Internal error" } }));
      return Promise.resolve(jsonResponse({ result: n === 2 ? RAW : "0x18c1cd1" }));
    };
    const reading = await readEthRlusdSupply(fetchFn as typeof fetch, ["https://bad.example", "https://good.example"]);
    expect(reading).not.toBeNull();
    expect(reading!.endpoint).toBe("https://good.example");
  });

  it("returns null when every endpoint fails", async () => {
    const fetchFn = () => Promise.resolve(jsonResponse({ error: { code: -32046 } }, false, 500));
    const reading = await readEthRlusdSupply(fetchFn as typeof fetch, ["https://a.example"]);
    expect(reading).toBeNull();
  });
});

describe("formatRawWithDecimals", () => {
  it("formats with exact decimals and trims trailing zeros", () => {
    expect(formatRawWithDecimals(1053014745151137n, 6)).toBe("1053014745.151137");
    expect(formatRawWithDecimals(10n ** 18n, 18)).toBe("1");
    expect(formatRawWithDecimals(1500000000000000000n, 18)).toBe("1.5");
    expect(formatRawWithDecimals(0n, 18)).toBe("0");
  });
});

describe("rlusd-snapshot.json fallback data", () => {
  it("is labeled with as_of and carries both chains with refs", () => {
    expect(snapshot.as_of).toBe("2026-09-12");
    expect(snapshot.xrpl.issuer).toBe(RLUSD_XRPL_ISSUER);
    expect(snapshot.xrpl.currency_hex).toBe(RLUSD_XRPL_CURRENCY_HEX);
    expect(snapshot.xrpl.supply).toMatch(/^\d+\.\d+$/);
    expect(typeof snapshot.xrpl.ledger_index).toBe("number");
    expect(snapshot.ethereum.contract).toBe(RLUSD_ETH_CONTRACT);
    expect(snapshot.ethereum.supply).toMatch(/^\d+\.\d+$/);
    expect(typeof snapshot.ethereum.block).toBe("number");
  });
});
