import { useState } from "react";
import { ArrowUpRight, Check, Copy, Terminal } from "lucide-react";

export const CONNECTIONS = [
  {
    id: "mcp",
    label: "MCP configuration",
    file: "mcp.json",
    code: JSON.stringify(
      {
        mcpServers: {
          "council-of-ai": { url: "https://councilof.ai/mcp/free" },
        },
      },
      null,
      2,
    ),
    note: "A Streamable HTTP MCP endpoint. Use your client’s connection guide to add it.",
  },
  {
    id: "http",
    label: "HTTP API",
    file: "terminal",
    code: "curl --fail --silent --show-error https://councilof.ai/api/gspc",
    note: "Read the published board as JSON. Each axis carries its own method, date and evidence state.",
  },
  {
    id: "skills",
    label: "Agent Skills",
    file: "discovery",
    code: "https://councilof.ai/.well-known/agent-skills/index.json",
    note: "Discover the published SKILL.md files and their SHA-256 digests. Discovery is separate from execution.",
  },
] as const;

export default function HomeDevelopers() {
  const [selected, setSelected] = useState(0);
  const [copyResult, setCopyResult] = useState<{
    code: string;
    state: "copied" | "failed";
  } | null>(null);
  const connection = CONNECTIONS[selected];
  const copyState =
    copyResult?.code === connection.code ? copyResult.state : "idle";
  async function copy() {
    const code = connection.code;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code);
      setCopyResult({ code, state: "copied" });
    } catch {
      setCopyResult({ code, state: "failed" });
    }
  }
  return (
    <section
      id="developers"
      className="hp-section hp-developers"
      aria-labelledby="home-developers-h"
      data-testid="home-developers"
    >
      <div className="section-shell hp-developer-grid">
        <div>
          <p className="hp-eyebrow">04 / For developers and agents</p>
          <h2 id="home-developers-h">
            The same evidence.
            <br />
            <span>Inside your own tools.</span>
          </h2>
          <p className="hp-developer-lede">
            Connect your assistant, call the API or inspect the portable Agent
            Skills. The free read-and-verify tools need no account or key.
          </p>
          <div className="hp-actions">
            <a
              href="/connect/"
              className="hp-button hp-button-primary"
              data-testid="hero-cta-connect"
            >
              Choose your connection{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <p className="hp-developer-boundary">
            Metered services have separate terms. Connecting this free endpoint
            does not place an order.
          </p>
          <div className="hp-dev-links">
            <a href="/connect/#agent-skills">
              Portable Agent Skills{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a href="/native-panel/">
              Embeddable evidence panel{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a href="/llms.txt">
              For AI agents <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="hp-code-window">
          <div className="hp-code-title">
            <span>
              <Terminal size={16} aria-hidden="true" /> councilof.ai /{" "}
              {connection.file}
            </span>
            <span className="hp-code-free">FREE READS</span>
          </div>
          <div className="hp-code-options" aria-label="Connection examples">
            {CONNECTIONS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={index === selected}
                aria-controls="home-connection-code"
                onClick={() => {
                  setSelected(index);
                  setCopyResult(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            className="hp-code-content"
            data-example={connection.id}
            id="home-connection-code"
          >
            <pre tabIndex={0} aria-label={`${connection.label} example`}>
              <code>{connection.code}</code>
            </pre>
            <button
              type="button"
              onClick={copy}
              className="hp-copy"
              aria-label="Copy connection example"
            >
              {copyState === "copied" ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Copy size={15} aria-hidden="true" />
              )}
              {copyState === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="hp-code-note">
            <p>{connection.note}</p>
            <p role="status">
              {copyState === "failed"
                ? "Copy is unavailable. Select and copy the example above."
                : copyState === "copied"
                  ? "Connection example copied."
                  : ""}
            </p>
          </div>
          <div className="hp-code-prompt">
            <span aria-hidden="true">→</span>
            <span>Try asking: “Show the live board and its sources.”</span>
          </div>
        </div>
      </div>
    </section>
  );
}
