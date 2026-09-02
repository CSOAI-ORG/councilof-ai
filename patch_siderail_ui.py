import sys

with open("client/src/components/lobby/LobbySideRail.tsx", "r") as f:
    content = f.read()

# Add Lucide icons
content = content.replace("import type { LobbyChat } from \"./useLobbyChat\";", "import type { LobbyChat } from \"./useLobbyChat\";\nimport { Terminal, Activity, FileText, Settings, Sparkles } from \"lucide-react\";")

# Rename "Ask" to "Agent Console"
content = content.replace('label: "Ask"', 'label: "Console", icon: Terminal')
content = content.replace('label: "Reports"', 'label: "Artifacts", icon: FileText')
content = content.replace('label: "Tasks"', 'label: "Swarm", icon: Activity')
content = content.replace('label: "Chats"', 'label: "Memory", icon: Settings')

content = content.replace('const SECTIONS: { id: SectionId; label: string; hint: string }[] = [', 'const SECTIONS: { id: SectionId; label: string; hint: string; icon?: any }[] = [')

# Update the header
header_replacement = """
      <div className="mb-4 flex shrink-0 items-center justify-between gap-2 border-b border-slate-900/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold tracking-tight text-slate-900">Antigravity OS</h2>
            <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">Agent Controller</p>
          </div>
        </div>
        {onMinimise && (
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Hide the agent controller"
            className={`${CONTROL} ${SP.chip} text-[11px] font-semibold bg-white/50 hover:bg-slate-100 border-0`}
          >
            Hide
          </button>
        )}
      </div>
"""
content = content.replace("""      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className={TYPE.section}>Side rail</h2>
        {onMinimise && (
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Hide the reports rail"
            className={`${CONTROL} ${SP.chip} text-[11px] font-semibold`}
          >
            Hide
          </button>
        )}
      </div>""", header_replacement)

# Update the tabs
tab_replacement = """              className={
                `flex-1 flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition ` +
                `motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ` +
                (on ? "bg-white text-emerald-800 shadow-[0_2px_8px_-4px_rgba(16,185,129,0.4)] border border-emerald-100" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent")
              }
            >
              {s.icon && <s.icon className={`h-4 w-4 ${on ? "text-emerald-600" : "text-slate-400"}`} />}
              {s.label}"""
content = content.replace("""              className={
                `flex-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ` +
                `motion-reduce:transition-none ${FOCUS} ` +
                (on ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")
              }
            >
              {s.label}""", tab_replacement)

content = content.replace("""className="mb-4 flex gap-1 rounded-xl bg-slate-900/5 p-1\"""", """className="mb-5 flex gap-1.5 rounded-2xl bg-slate-100/80 p-1.5 shadow-inner\"""")

# Change the empty state text
content = content.replace("""Nothing asked yet in this session. Use the composer below the pane and the
                conversation appears here, beside what you are asking about.""", """Antigravity Agent is standing by. Give me a command using the composer below to control Council OS, navigate the site, or evaluate evidence.""")

with open("client/src/components/lobby/LobbySideRail.tsx", "w") as f:
    f.write(content)
