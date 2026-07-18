#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
};

const c = {
  ok: (s) => `${ANSI.green}✓${ANSI.reset} ${s}`,
  err: (s) => `${ANSI.red}✗${ANSI.reset} ${s}`,
  info: (s) => `${ANSI.cyan}→${ANSI.reset} ${s}`,
  warn: (s) => `${ANSI.yellow}⚠${ANSI.reset} ${s}`,
  dim: (s) => `${ANSI.dim}${s}${ANSI.reset}`,
  bold: (s) => `${ANSI.bold}${s}${ANSI.reset}`,
  cyan: (s) => `${ANSI.cyan}${s}${ANSI.reset}`,
  green: (s) => `${ANSI.green}${s}${ANSI.reset}`,
  red: (s) => `${ANSI.red}${s}${ANSI.reset}`,
  yellow: (s) => `${ANSI.yellow}${s}${ANSI.reset}`,
};

function loadPacks() {
  const packsPath = join(__dirname, "..", "packs.json");
  if (!existsSync(packsPath)) {
    console.log(c.err("packs.json not found. Reinstall meok-setup."));
    process.exit(1);
  }
  return JSON.parse(readFileSync(packsPath, "utf-8"));
}

const CLIENTS = {
  claude: {
    name: "Claude Desktop",
    configPath:
      platform() === "darwin"
        ? join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json")
        : platform() === "win32"
          ? join(process.env.APPDATA || "", "Claude", "claude_desktop_config.json")
          : join(homedir(), ".config", "Claude", "claude_desktop_config.json"),
    configKey: "mcpServers",
  },
  cursor: {
    name: "Cursor",
    configPath: join(homedir(), ".cursor", "mcp.json"),
    configKey: "mcpServers",
  },
  vscode: {
    name: "VS Code",
    configPath:
      platform() === "darwin"
        ? join(homedir(), "Library", "Application Support", "Code", "User", "settings.json")
        : platform() === "win32"
          ? join(process.env.APPDATA || "", "Code", "User", "settings.json")
          : join(homedir(), ".config", "Code", "User", "settings.json"),
    configKey: "mcp",
  },
  windsurf: {
    name: "Windsurf",
    configPath: join(homedir(), ".codeium", "windsurf", "mcp_config.json"),
    configKey: "mcpServers",
  },
};

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pack" || a === "-p") args.pack = argv[++i];
    else if (a === "--client" || a === "-c") args.client = argv[++i];
    else if (a === "--list" || a === "-l") args.list = true;
    else if (a === "--dry-run" || a === "-n") args.dryRun = true;
    else if (a === "--uninstall" || a === "-u") args.uninstall = true;
    else if (a === "--yes" || a === "-y") args.yes = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--version" || a === "-V") args.version = true;
    else if (!a.startsWith("-")) args._.push(a);
    else args._.push(a);
  }
  return args;
}

function showHelp() {
  console.log(`
${c.bold("meok-setup")} — Install MEOK AI compliance MCP servers

${c.bold("USAGE")}
  npx meok-setup [options]

${c.bold("OPTIONS")}
  -p, --pack <name>       Server pack to install (default: governance)
  -c, --client <name>     Target client: claude, cursor, vscode, windsurf (default: claude)
  -l, --list              List available packs and servers
  -n, --dry-run           Preview changes without writing files
  -u, --uninstall         Remove MCP servers from client config
  -y, --yes               Skip confirmation prompt
  -h, --help              Show this help
  -V, --version           Show version

${c.bold("EXAMPLES")}
  npx meok-setup                          Install governance pack for Claude Desktop
  npx meok-setup --pack healthcare        Install healthcare pack
  npx meok-setup --pack all --client cursor   Install all packs for Cursor
  npx meok-setup --list                   List all available packs
  npx meok-setup --uninstall --pack governance   Remove governance pack
  npx meok-setup --dry-run --pack security    Preview security pack install

${c.bold("PACKS")}
  governance   EU AI Act, GDPR, ISO 27001, NIS2, DORA
  healthcare   HIPAA, FHIR, SaMD, clinical AI governance
  finance      Basel, MiFID II, AML, MiCA
  security     OWASP, MITRE ATLAS, vulnerability scanning
  a2a          Agent-to-agent governance
  trade        UK trade verticals
  industry     Cross-industry compliance
  all          All MEOK compliance MCP servers

${c.dim("Docs: https://meok.ai · Support: hello@meok.ai")}
`);
}

function showVersion() {
  const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
  console.log(pkg.version);
}

function listPacks(packs) {
  console.log(`\n${c.bold("Available MCP Server Packs")}\n`);
  for (const [key, pack] of Object.entries(packs)) {
    const count = pack.servers[0] === "*" ? "218+" : pack.servers.length;
    console.log(`  ${c.cyan(key.padEnd(12))} ${c.dim(`(${count} servers)`)} ${pack.description}`);
    if (key !== "all") {
      for (const s of pack.servers) {
        console.log(`  ${c.dim("".padEnd(12))} ${c.dim("├─")} ${s}`);
      }
    }
    console.log();
  }
}

function detectClients() {
  const found = [];
  for (const [key, client] of Object.entries(CLIENTS)) {
    if (existsSync(client.configPath)) {
      found.push(key);
    }
  }
  return found;
}

function buildMcpEntry(serverName) {
  const moduleName = serverName.replace(/-/g, "_");
  return {
    command: "python",
    args: ["-m", moduleName],
    env: { MEOK_API_KEY: "${MEOK_API_KEY}" },
  };
}

function readConfig(configPath) {
  if (!existsSync(configPath)) return null;
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}

function writeConfig(configPath, config, dryRun) {
  if (dryRun) {
    console.log(c.dim(`  [dry-run] Would write ${configPath}`));
    return;
  }
  mkdirSync(dirname(configPath), { recursive: true });
  if (existsSync(configPath)) {
    writeFileSync(`${configPath}.bak`, readFileSync(configPath));
    console.log(c.dim(`  Backed up to ${configPath}.bak`));
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getConfigSection(config, clientKey) {
  const client = CLIENTS[clientKey];
  if (clientKey === "vscode") {
    config["mcp"] = config["mcp"] || {};
    config["mcp"]["servers"] = config["mcp"]["servers"] || {};
    return config["mcp"]["servers"];
  }
  config[client.configKey] = config[client.configKey] || {};
  return config[client.configKey];
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const packs = loadPacks();

  if (args.version) {
    showVersion();
    process.exit(0);
  }

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.list) {
    listPacks(packs);
    process.exit(0);
  }

  const packKey = args.pack || "governance";
  const clientKey = args.client || "claude";

  if (!packs[packKey]) {
    console.log(c.err(`Unknown pack '${packKey}'. Use --list to see available packs.`));
    process.exit(1);
  }

  if (!CLIENTS[clientKey]) {
    console.log(c.err(`Unknown client '${clientKey}'. Available: ${Object.keys(CLIENTS).join(", ")}`));
    process.exit(1);
  }

  const pack = packs[packKey];
  const client = CLIENTS[clientKey];
  const isDryRun = args.dryRun;
  const isUninstall = args.uninstall;

  const servers = pack.servers[0] === "*"
    ? Object.values(packs).flatMap((p) => p.servers).filter((s) => s !== "*")
    : [...new Set(pack.servers)];

  const action = isUninstall ? "Uninstall" : "Install";
  const actionLower = isUninstall ? "uninstall" : "install";

  console.log(`
${c.bold("🛡  MEOK AI Labs — Compliance MCP Setup")}
${c.dim("────────────────────────────────────────")}

  ${c.bold("Action:")}  ${action} ${c.cyan(packKey)} pack ${c.dim(`(${servers.length} servers)`)}
  ${c.bold("Client:")}  ${client.name}
  ${c.bold("Config:")}  ${c.dim(client.configPath)}
  ${isDryRun ? c.yellow("  Mode:    DRY RUN — no files will be written\n") : ""}
`);

  const detected = detectClients();
  if (detected.length > 0) {
    console.log(c.ok(`Detected clients: ${detected.map((k) => CLIENTS[k].name).join(", ")}`));
  } else {
    console.log(c.warn("No MCP client configs detected. A new config will be created."));
  }

  console.log(`\n${c.bold(`Servers to ${actionLower} (${servers.length}):`)}`);
  for (const s of servers) {
    console.log(`  ${isUninstall ? c.red("−") : c.green("+")} ${s}`);
  }

  if (!args.yes && !isDryRun) {
    const answer = await prompt(`\n${c.bold(`Proceed with ${actionLower}?`)} [Y/n] `);
    if (answer.toLowerCase() === "n") {
      console.log(c.info("Cancelled."));
      process.exit(0);
    }
  }

  console.log(`\n${c.bold(`${action}ing servers...`)}`);

  let config = readConfig(client.configPath) || {};
  const configSection = getConfigSection(config, clientKey);

  let successCount = 0;
  let skipCount = 0;

  for (const serverName of servers) {
    if (isUninstall) {
      if (configSection[serverName]) {
        delete configSection[serverName];
        console.log(c.ok(`Removed ${serverName}`));
        successCount++;
      } else {
        console.log(c.dim(`  Skipped ${serverName} (not installed)`));
        skipCount++;
      }
    } else {
      if (configSection[serverName]) {
        console.log(c.dim(`  Skipped ${serverName} (already installed)`));
        skipCount++;
      } else {
        configSection[serverName] = buildMcpEntry(serverName);
        console.log(c.ok(`Added ${serverName}`));
        successCount++;
      }
    }
  }

  if (successCount > 0 || isDryRun) {
    writeConfig(client.configPath, config, isDryRun);
  }

  console.log(`
${c.bold(`${c.green("✓")} Done!`)}
  ${action === "Install" ? "Added" : "Removed"}: ${c.cyan(successCount.toString())} servers
  ${skipCount > 0 ? `Skipped: ${c.dim(skipCount.toString())} servers` : ""}
`);

  if (!isUninstall) {
    console.log(`${c.bold("Next steps:")}`);
    console.log(`  1. Restart ${client.name} to load the new servers.`);
    console.log(`  2. Set ${c.cyan("MEOK_API_KEY")} for Pro tier features:`);
    console.log(`     ${c.dim("export MEOK_API_KEY=...")}`);
    console.log(`     ${c.dim("Subscribe: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K")} ${c.dim("(£79/mo)")}`);
    console.log(`\n  ${c.dim("Free tier: 10 calls/day, no key required.")}`);
    console.log(`  ${c.dim("Docs: https://meok.ai")}`);
    console.log(`  ${c.dim("Support: hello@meok.ai")}`);
  }

  console.log();
}

main().catch((e) => {
  console.log(c.err(e.message));
  process.exit(1);
});
