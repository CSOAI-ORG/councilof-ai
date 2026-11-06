// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RegionalAnalytics from "./RegionalAnalytics";

type Read = {
  data?: unknown;
  isLoading: boolean;
  error?: unknown;
  refetch: () => unknown;
};
const mocks = vi.hoisted(() => ({
  reads: {} as Record<string, Read>,
  calls: {
    comparison: vi.fn(),
    enrollment: vi.fn(),
    certificates: vi.fn(),
    enrollmentList: vi.fn(),
    issuanceList: vi.fn(),
  },
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    regionalAnalytics: {
      getRegionalComparison: {
        useQuery: (...args: unknown[]) => {
          mocks.calls.comparison(...args);
          return mocks.reads.comparison;
        },
      },
      getEnrollmentStats: {
        useQuery: (...args: unknown[]) => {
          mocks.calls.enrollment(...args);
          return mocks.reads.enrollment;
        },
      },
      getCertificateStats: {
        useQuery: (...args: unknown[]) => {
          mocks.calls.certificates(...args);
          return mocks.reads.certificates;
        },
      },
      getCourseEnrollments: {
        useQuery: (...args: unknown[]) => {
          mocks.calls.enrollmentList(...args);
          return mocks.reads.enrollmentList;
        },
      },
      getCertificateIssuances: {
        useQuery: (...args: unknown[]) => {
          mocks.calls.issuanceList(...args);
          return mocks.reads.issuanceList;
        },
      },
    },
  },
}));
// Native controls expose the Select onValueChange contract without emulating Radix pointer APIs.
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <select
      aria-label="Region"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  BarChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown;
  }) => (
    <div data-testid="regional-chart" data-values={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));
let host: HTMLDivElement;
let root: Root | undefined;
const metricValues = () =>
  [...host.querySelectorAll('[data-testid^="regional-"]')]
    .filter((node) => node.getAttribute("data-testid") !== "regional-chart")
    .map((node) => node.textContent);
async function render() {
  root ??= createRoot(host);
  await act(async () => {
    root!.render(<RegionalAnalytics />);
  });
}
async function tab(name: string) {
  const target = [
    ...host.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ].find((node) => node.textContent === name)!;
  await act(async () => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
  });
}
async function select(value: string) {
  const field = host.querySelector<HTMLSelectElement>(
    'select[aria-label="Region"]',
  )!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )!.set!.call(field, value);
    field.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks();
  for (const key of Object.keys(mocks.calls))
    mocks.reads[key] = {
      data: key === "enrollment" || key === "certificates" ? {} : [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(async () => {
  if (root)
    await act(async () => {
      root!.unmount();
    });
  root = undefined;
  host.remove();
  vi.restoreAllMocks();
});

describe("regional analytics source states", () => {
  it("normalizes All Regions to undefined after choosing a region, never NaN", async () => {
    await render();
    expect(host.querySelector<HTMLSelectElement>("select")!.value).toBe("all");
    await select("2");
    for (const key of [
      "enrollment",
      "certificates",
      "enrollmentList",
      "issuanceList",
    ] as const)
      expect(mocks.calls[key].mock.lastCall![0]).toMatchObject({ regionId: 2 });
    await select("all");
    for (const key of [
      "enrollment",
      "certificates",
      "enrollmentList",
      "issuanceList",
    ] as const) {
      expect(mocks.calls[key].mock.lastCall![0].regionId).toBeUndefined();
      expect(Number.isNaN(mocks.calls[key].mock.lastCall![0].regionId)).toBe(
        false,
      );
    }
    expect(host.querySelector<HTMLSelectElement>("select")!.value).toBe("all");
  });

  it("shows loading rather than zero totals or a false empty history", async () => {
    for (const value of Object.values(mocks.reads)) {
      value.data = undefined;
      value.isLoading = true;
    }
    await render();
    expect(metricValues()).toEqual([
      "Loading…",
      "Loading…",
      "Loading…",
      "Loading…",
    ]);
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      "Reading Regional comparison",
    );
    await tab("Enrollments");
    expect(host.textContent).toContain("Reading Recent enrollments");
    expect(host.textContent).not.toContain("No enrollments found");
    await tab("Certificates");
    expect(host.textContent).toContain("Reading Recent certificate issuances");
    expect(host.textContent).not.toContain("No certificates found");
  });

  it("withholds cached totals and chart values after errors, with a real query retry action", async () => {
    mocks.reads.enrollment.data = {
      totalEnrollments: 999,
      completedEnrollments: 999,
    };
    mocks.reads.certificates.data = { totalIssued: 999, totalDownloads: 999 };
    mocks.reads.comparison.data = [
      { regionId: 1, totalEnrollments: 999, completionRate: 100 },
    ];
    for (const value of Object.values(mocks.reads))
      value.error = new Error("backend unavailable");
    await render();
    expect(metricValues()).toEqual([
      "Unavailable",
      "Unavailable",
      "Unavailable",
      "Unavailable",
    ]);
    expect(host.textContent).not.toContain("999");
    expect(host.querySelector('[data-testid="regional-chart"]')).toBeNull();
    const retry = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (node) => node.textContent === "Retry Enrollment metrics",
    )!;
    await act(async () => {
      retry.click();
    });
    expect(mocks.reads.enrollment.refetch).toHaveBeenCalledTimes(1);
    await tab("Enrollments");
    expect(host.textContent).toContain(
      "Recent enrollments could not be loaded",
    );
    expect(host.textContent).not.toContain("No enrollments found");
    await tab("Certificates");
    expect(host.textContent).toContain(
      "Recent certificate issuances could not be loaded",
    );
    expect(host.textContent).not.toContain("No certificates found");
  });

  it("keeps missing metrics distinct from confirmed zeros and confirmed empty lists", async () => {
    await render();
    expect(metricValues()).toEqual([
      "Not reported",
      "Not reported",
      "Not reported",
      "Not reported",
    ]);
    expect(host.textContent).toContain("No enrollment metrics were reported");
    expect(host.textContent).not.toContain("backend is unreachable");
    await tab("Enrollments");
    expect(host.textContent).toContain(
      "No enrollments found for this selection",
    );
    await tab("Certificates");
    expect(host.textContent).toContain(
      "No certificates found for this selection",
    );
  });

  it("renders explicitly reported zero metrics and numeric strings without replacing missing fields", async () => {
    mocks.reads.enrollment.data = {
      totalEnrollments: 0,
      activeEnrollments: "0",
      completedEnrollments: 0,
      averageProgress: 0,
    };
    mocks.reads.certificates.data = {
      totalIssued: "0",
      totalDownloads: 0,
      totalVerifications: 0,
      averageScore: 0,
    };
    await render();
    expect(metricValues()).toEqual(["0", "0", "0", "0"]);
    expect(host.textContent).toContain("Average progress: 0.0%");
    expect(host.textContent).toContain("Average score: 0.0%");
  });

  it("does not convert null, blank or non-finite reported values into zero or usable chart points", async () => {
    mocks.reads.enrollment.data = {
      totalEnrollments: null,
      completedEnrollments: "",
      averageProgress: NaN,
    };
    mocks.reads.certificates.data = {
      totalIssued: Infinity,
      totalDownloads: "not a number",
    };
    mocks.reads.comparison.data = [
      {
        regionId: 1,
        totalEnrollments: null,
        totalCompletions: "",
        totalCertificates: NaN,
        completionRate: 200,
      },
    ];
    await render();
    expect(metricValues()).toEqual([
      "Not reported",
      "Not reported",
      "Not reported",
      "Not reported",
    ]);
    expect(host.querySelector('[data-testid="regional-chart"]')).toBeNull();
    expect(host.textContent).not.toMatch(/NaN|Infinity/);
  });

  it("passes only reported finite chart values, keeping missing counts null", async () => {
    mocks.reads.comparison.data = [
      {
        regionId: 1,
        totalEnrollments: "12",
        totalCompletions: null,
        totalCertificates: 0,
        completionRate: "50",
      },
    ];
    await render();
    const charts = [
      ...host.querySelectorAll<HTMLElement>('[data-testid="regional-chart"]'),
    ];
    expect(charts).toHaveLength(2);
    const points = JSON.parse(charts[0].dataset.values!);
    expect(points).toEqual([
      {
        name: "EU AI Act",
        enrollments: 12,
        completions: null,
        certificates: 0,
        completionRate: 50,
      },
    ]);
  });
});
