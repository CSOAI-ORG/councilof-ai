// SPDX-License-Identifier: Apache-2.0
/**
 * React wrapper. React is a peer dependency and is not in the 60 KB element bundle.
 *
 *   import { GspcEvidencePanelReact } from "@csoai/gspc-panel/react";
 *   <GspcEvidencePanelReact subject="https://example.com/mcp" config={{ assistantName: "Acme Assistant" }} onModel={m => …} onAction={e => …} />
 *
 * `a2ui` (JSONL string or message array) or `agui` (SSE text) draw from a description instead of
 * reading the live APIs.
 */
import { createElement, useEffect, useRef } from "react";
import { definePanel } from "./element.js";

export function GspcEvidencePanelReact({ subject, transport, origin, theme, config, a2ui, agui, onModel, onAction, className }) {
  const ref = useRef(null);
  useEffect(() => {
    definePanel();
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el || !onModel) return undefined;
    const h = (e) => onModel(e.detail);
    el.addEventListener("gspc-panel:model", h);
    return () => el.removeEventListener("gspc-panel:model", h);
  }, [onModel]);
  useEffect(() => {
    if (ref.current && config) ref.current.config = config; // rejected configs fall back to defaults and say so in the panel
  }, [config]);
  useEffect(() => {
    const el = ref.current;
    if (!el || !onAction) return undefined;
    const h = (e) => onAction(e.detail);
    el.addEventListener("gspc-panel:action", h);
    return () => el.removeEventListener("gspc-panel:action", h);
  }, [onAction]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (a2ui) el.renderA2ui(a2ui);
    else if (agui) el.renderAgui(agui);
  }, [a2ui, agui]);
  const props = { ref, class: className, style: theme ?? undefined };
  if (!a2ui && !agui) {
    props.subject = subject;
    if (transport) props.transport = transport;
    if (origin) props.origin = origin;
  }
  return createElement("gspc-evidence-panel", props);
}

export default GspcEvidencePanelReact;
