  // ── docked (minimised) ───────────────────────────────────────────────────────
  if (!page && minimised) {
    return (
      <div
        role="dialog"
        aria-label="Council OS, minimised"
        className={`fixed bottom-5 left-1/2 z-[80] w-[min(30rem,calc(100vw-2.5rem))] -translate-x-1/2 ${SURFACE_LIFTED} ${SP.row} flex items-center gap-3 bg-white/95 backdrop-blur-xl`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white" aria-hidden="true">
          <ColiseumGlyph className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold leading-tight text-slate-900">
            Council OS — minimised
          </span>
          <span className={`block ${TYPE.fine}`}>
            {paneLabel} · {chat.turnCount} message{chat.turnCount === 1 ? "" : "s"} kept ·{" "}
            {chat.threads.length} thread{chat.threads.length === 1 ? "" : "s"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setMinimised(false)}
          aria-label="Restore Council OS"
          className={`ml-auto shrink-0 rounded-xl bg-emerald-700 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-emerald-800 motion-reduce:transition-none ${FOCUS}`}
        >
          Restore
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Council OS"
          className={`shrink-0 rounded-xl border border-slate-900/12 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
        >
          Close
        </button>
      </div>
    );
  }

  // ── the workspace ──────────────────────────────────
  return (
    <>
      {!page && <FocusSentinel onFocus={() => focusEdge("last")} />}
      <div
        ref={rootRef}
        tabIndex={-1}
        role={page ? "region" : "dialog"}
        aria-modal={page ? undefined : "true"}
        aria-labelledby={TITLE_ID}
        data-coai="Council Lobby"
        data-testid={page ? "os-workspace" : undefined}
        className={
          page
            ? `relative flex h-full min-h-0 flex-col ${SP.shell} outline-none`
            : `fixed z-[80] flex flex-col ${SP.shell} outline-none backdrop-blur-2xl ` +
              (size === "full" ? "inset-0" : "inset-2 rounded-3xl sm:inset-4")
        }
        style={{
          // The slider drives this; every panel inherits it.
          ["--lobby-alpha" as any]: String(alpha),
          ...(page ? undefined : scrimStyle(alpha)),
        }}
      >
        <LobbyHeader
          titleId={TITLE_ID}
          alpha={alpha}
          onAlpha={setAlpha}
          size={size}
          onToggleSize={() => setSize((s) => (s === "full" ? "comfortable" : "full"))}
          onMinimise={minimise}
          onClose={onClose}
          windowed={!page}
          leftOpen={leftOpen}
          onToggleLeft={() => setLeftOpen((v) => !v)}
          rightOpen={rightOpen}
          onToggleRight={() => setRightOpen((v) => !v)}
          showHeaderNav={narrow}
          tabId={tabId}
          onSelectTab={go}
          onOpenRoute={openRoute}
          activePath={panePath}
          navOverride={!!override}
        />

        {/* ── three rails; centre (pane + ask) is the dominant column ─────
            `relative` so the reports rail can lay itself over the centre below
            `lg`, where there is no room for a third column. */}
        <div className="relative flex min-h-0 flex-1 gap-3">
          {!narrow && leftOpen ? (
            <LobbyPaneRail
              tabId={tabId}
              onSelect={go}
              onMinimise={() => setLeftOpen(false)}
              override={!!override}
            />
          ) : (
            <RailRestore
              className="hidden sm:flex"
              label="Show the destinations pane"
              text="Panes"
              onClick={() => setLeftOpen(true)}
            />
          )}

          <main
            id={PANEL_ID}
            role="tabpanel"
            aria-labelledby={tabDomId(tabId)}
            className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/60 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-14px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/5"
            style={panelStyle}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-900/10 px-5 py-2.5">
              {/* Route-derived breadcrumbs. Every crumb comes from the live pane
                  state; a crumb is a link only when the OS can really open it
                  (breadcrumbs.ts). The last crumb is where you are — when the
                  surface has no name of its own it prints the path's final
                  segment, and the mono chip on the right still shows the full
                  path. */}
              <nav aria-label="You are here" className="flex min-w-0 items-center gap-1 text-[12.5px]">
                {crumbs.map((c, i) => (
                  <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                    {i > 0 && <span aria-hidden="true" className="text-slate-400">›</span>}
                    {c.current ? (
                      <span aria-current="page" className="truncate font-semibold text-slate-900">
                        {c.label}
                      </span>
                    ) : c.tab || c.route ? (
                      <button
                        type="button"
                        onClick={() => (c.tab ? go(c.tab) : openRoute(c.route!, c.label))}
                        className={`truncate rounded font-medium text-slate-600 transition hover:text-emerald-800 hover:underline motion-reduce:transition-none ${FOCUS}`}
                      >
                        {c.label}
                      </button>
                    ) : (
                      <span className="truncate font-medium text-slate-500">{c.label}</span>
                    )}
                  </span>
                ))}
              </nav>
              <span className={`hidden truncate md:inline ${TYPE.fine}`}>
                {override ? "Opened in this pane — navigation stays inside the OS." : tab.blurb}
              </span>
              {paneIsArchive && (
                <span
                  className="shrink-0 rounded-full border border-slate-900/15 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                  title="This page is kept as reference in the Library. Opened outside the OS it carries the same mark."
                >
                  reference · archive
                </span>
              )}
              {panePath && (
                <span
                  className="ml-auto shrink-0 rounded font-mono text-[11px] text-slate-500"
                  title="This page is open in the lobby pane — navigation stays here"
                >
                  {panePath}
                </span>
              )}
              {override && (
                <button
                  type="button"
                  onClick={() => { setOverride(null); if (tab.path) loadPane(tab.path); }}
                  className={`shrink-0 rounded-lg border border-slate-900/10 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
                >
                  Back to {tab.label}
                </button>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                className={
                  // The pane keeps the full centre column whether or not chat is open. It used to
                  // collapse to flex-[0_1_40%] because the thread was stacked BELOW it in this
                  // same column, so asking a question shrank the thing you were asking about to
                  // two fifths of its height. The thread now lives in its own right-hand column.
                  `relative min-h-0 flex-1 overflow-hidden`
                }
              >
                {localPane && tab.id === "home" ? (
                  <LobbyHome onSelect={go} onOpenRoute={openRoute} />
                ) : localPane ? (
                  <LobbyPlay onOpenRoute={openRoute} />
                ) : nativePane && tab.id === "board" ? (
                  <LobbyBoardPane />
                ) : nativePane && tab.id === "matrix" ? (
                  <LobbyMatrixPane onOpenSpace={(axis) => openRoute("/gspc-arena", "Council Space")} />
                ) : nativePane && tab.id === "verify" ? (
                  <LobbyVerifyPane />
                ) : nativePane && tab.id === "cards" ? (
                  <LobbyCardsPane onOpenRoute={openRoute} />
                ) : nativePane && tab.id === "state" ? (
                  <LobbyStatePane onOpenRoute={openRoute} />
                ) : nativePane && tab.id === "evidence" ? (
                  <LobbyEvidencePane onOpenRoute={openRoute} />
                ) : nativePane && tab.id === "embed" ? (
                  <LobbyEmbedPane onOpenRoute={openRoute} />
                ) : (
                  <>
                    {/* The pane was asked for a destination behind RequireAuth and the
                        frame has landed on /login. Say so, rather than leaving a
                        password box under a header that promised an analyst desk. */}
                    {bouncedToLogin && (
                      <div className="absolute inset-x-0 top-0 z-20 border-b border-amber-300/60 bg-amber-50/95 px-4 py-2.5 text-[12.5px] leading-relaxed text-amber-900">
                        <strong>{tab.label} needs an account.</strong> {tab.path} redirected this pane
                        to <code className="font-mono">/login</code>. Council OS did not send you here.
                        Everything the Council measures — the board, verification, the corrections
                        ledger — stays readable without one.
                      </div>
                    )}
                    {!frameLoaded && <FrameSkeleton />}
                    <iframe
                      ref={frameRef}
                      key={frameSrc}
                      src={frameSrc}
                      title={`${paneLabel} — ${panePath}`}
                      onLoad={onFrameLoad}
                      className="h-full w-full border-0 bg-white"
                    />
                  </>
                )}
              </div>

            </div>

            {/* The composer used to sit here permanently, a dock across the foot of the centre
                column carrying audience chips and suggested asks. Two bars competing for the
                same edge, and the OS surface shrank to make room for a thing most visits never
                used. It is now behind one control: press Ask, the rail opens on its conversation,
                and the composer appears there beside the thread rather than under the pane. */}
            {composerOpen ? (
              <LobbyComposer
                chat={chat}
                onNavigate={go}
                onOpenRoute={openRoute}
                paneLabel={paneLabel}
                panePath={panePath || "/"}
                seedPrompt={intent?.prompt}
                seedNonce={intent?.nonce}
                onClose={() => setComposerOpen(false)}
                inputId={page ? "os-chat" : undefined}
              />
            ) : (
              <div className="flex shrink-0 items-center justify-end gap-2 px-4 py-2">
                <button
                  type="button"
                  onClick={() => { setRightOpen(true); setComposerOpen(true); }}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-900/10 bg-white/90 px-4 py-2 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:bg-white ${FOCUS}`}
                  title="Ask the Council — opens the conversation in the right rail"
                >
                  Ask the Council
                  <span className="text-[11px] font-normal text-slate-500">the conversation opens on the right</span>
                </button>
              </div>
            )}
          </main>

          {/* ── the reports rail ─────────────────────────
              IT USED TO BE `hidden lg:block`, AND SO DID ITS RESTORE TAB. Below
              1024px Reports / Tasks / Chats did not exist — but the header's rail
              control stayed enabled and kept flipping its own label, so pressing
              "Show rail" set aria-expanded="true", relabelled itself "Hide rail",
              and put nothing on the screen. A control that reports a state it did
              not reach is the same defect as a stub that looks like a result.

              The left rail already had this answer: below `sm` it folds into the
              header nav. The right rail now folds into a DRAWER laid over the
              centre column, because there is no room for a third column on a
              phone but there is no reason to amputate the surface either. At `lg`
              and up it is the column it always was. Either way the header control
              means what it says. */}
          {rightOpen ? (
            <>
              {/* >= lg — the third column, at master's width (the rail carries the
                  chat thread now, so it is wider than it was). */}
              <div className="hidden w-[21rem] shrink-0 lg:block xl:w-[25rem]">
                <LobbySideRail chat={chat} threadEndRef={threadEndRef} onMinimise={() => setRightOpen(false)} onOpenRoute={openRoute} />
              </div>
              {/* < lg — the same rail as a drawer over the centre. The scrim dismisses it. */}
              <button
                type="button"
                aria-label="Close the reports rail"
                onClick={() => setRightOpen(false)}
                className="absolute inset-0 z-[1] cursor-default bg-slate-900/25 backdrop-blur-[2px] lg:hidden"
              />
              {/* No role/aria-label here: LobbySideRail already labels itself
                  "Reports, tasks and chats", and a second copy on the wrapper puts
                  two identically-named regions in the tree. */}
              <div data-coai-rail="drawer" className="absolute inset-y-0 right-0 z-[2] w-[min(22rem,92vw)] lg:hidden">
                <LobbySideRail chat={chat} threadEndRef={threadEndRef} onMinimise={() => setRightOpen(false)} onOpenRoute={openRoute} />
              </div>
            </>
          ) : (
            <RailRestore
              className="hidden lg:flex"
              label="Show the reports rail"
              text="Rail"
              onClick={() => setRightOpen(true)}
            />
          )}
        </div>
      </div>
      {!page && <FocusSentinel onFocus={() => focusEdge("first")} />}
    </>
  );
}

function RailRestore({
  className,
  label,
  text,
  onClick,
}: {
  className?: string;
  label: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        `${SURFACE} ${FOCUS} w-11 shrink-0 flex-col items-center justify-center gap-2 ` +
        `bg-white/80 text-[11px] font-semibold text-slate-700 transition hover:bg-white ` +
        `motion-reduce:transition-none ${className ?? ""}`
      }
      style={panelStyle}
    >
      <span aria-hidden="true" className="text-[16px] leading-none text-slate-500">+</span>
      <span className="[writing-mode:vertical-rl] rotate-180 tracking-wide">{text}</span>
    </button>
  );
}

function FrameSkeleton() {
  return (
    <div className="absolute inset-0 z-10 space-y-4 bg-white p-8 motion-safe:animate-pulse" aria-hidden="true">
      <div className="h-7 w-1/3 rounded bg-slate-900/10" />
      <div className="h-3.5 w-2/3 rounded bg-slate-900/10" />
      <div className="h-3.5 w-1/2 rounded bg-slate-900/10" />
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="h-28 rounded-xl bg-slate-900/10" />
        <div className="h-28 rounded-xl bg-slate-900/10" />
        <div className="h-28 rounded-xl bg-slate-900/10" />
        <div className="h-28 rounded-xl bg-slate-900/10" />
      </div>
    </div>
  );
}

export { ColiseumGlyph };
