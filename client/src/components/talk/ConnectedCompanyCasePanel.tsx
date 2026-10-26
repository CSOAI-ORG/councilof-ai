import { forwardRef, useEffect, useState, type ComponentProps } from "react";
import {
  COUNCIL_SESSION_CHANGED_EVENT,
  COUNCIL_TOKEN_KEY,
  createCouncilSessionController,
} from "@/lib/councilSession";
import { createCompanyCaseClient } from "@/lib/companyCaseClient";
import CompanyCasePanel, { type CompanyCasePanelHandle } from "./CompanyCasePanel";
import type { CompanyCaseConnection } from "./companyCaseModel";

type Props = Omit<ComponentProps<typeof CompanyCasePanel>, "connection" | "ref">;

/**
 * AskHost is outside the dashboard AuthProvider. Reuse the session verifier without
 * adding another provider or identity store. The protected API still checks every
 * token and the actual server-side company binding on each request.
 */
const ConnectedCompanyCasePanel = forwardRef<CompanyCasePanelHandle, Props>(
  function ConnectedCompanyCasePanel(props, ref) {
    const [connection, setConnection] = useState<CompanyCaseConnection>({
      session: { status: "verifying" },
    });

    useEffect(() => {
      let active = true;
      let storage: Storage | null = null;
      try { storage = window.localStorage; } catch { /* No usable existing session. */ }
      let controller: ReturnType<typeof createCouncilSessionController> | undefined;
      let verifiedToken: string | null | undefined;
      let authenticated = false;
      const getToken = () => {
        try { return storage?.getItem(COUNCIL_TOKEN_KEY) ?? null; } catch { return null; }
      };

      const verify = (force = false) => {
        const token = getToken();
        // Focus must not discard a pending save for the same session. Auth changes
        // explicitly invalidate it; the client refuses a changed token's response.
        if (!force && authenticated && verifiedToken !== undefined && token === verifiedToken) return;
        verifiedToken = token;
        authenticated = false;
        controller?.dispose();
        let unavailable = false;
        controller = createCouncilSessionController({
          storage,
          fetcher: async (url, init) => {
            try {
              const timeout = AbortSignal.timeout(10000);
              const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
              const response = await fetch(url, { ...init, signal, credentials: "omit", redirect: "error" });
              if (!response.ok && response.status !== 401) unavailable = true;
              return response;
            } catch (error) {
              unavailable = true;
              throw error;
            }
          },
          publish: (session) => {
            if (!active) return;
            if (session.loading) {
              setConnection({ session: { status: "verifying" } });
              return;
            }
            const subject = session.user?.email;
            if (session.token && subject && subject.toLowerCase() !== "demo@csoai.com") {
              authenticated = true;
              setConnection({
                session: { status: "ready", subject },
                client: createCompanyCaseClient({ subject, token: session.token, getToken }),
              });
            } else {
              setConnection({ session: { status: unavailable ? "unavailable" : "signed_out" } });
            }
          },
        });
        void controller.restore();
      };
      const onAuthChange = () => verify(true);
      const onFocus = () => verify();
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === COUNCIL_TOKEN_KEY) verify();
      };
      window.addEventListener(COUNCIL_SESSION_CHANGED_EVENT, onAuthChange);
      window.addEventListener("storage", onStorage);
      window.addEventListener("focus", onFocus);
      verify();
      return () => {
        active = false;
        controller?.dispose();
        window.removeEventListener(COUNCIL_SESSION_CHANGED_EVENT, onAuthChange);
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("focus", onFocus);
      };
    }, []);

    return <CompanyCasePanel {...props} ref={ref} connection={connection} />;
  },
);

export default ConnectedCompanyCasePanel;
