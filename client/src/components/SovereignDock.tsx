import { useEffect, useRef, useState } from "react";
import { LAYER0_DISAMBIGUATION } from "../data/anchoringClaim";
import { useLocation } from "wouter";
import AISystemNotice from "./AISystemNotice";
import { chargeSovereign } from "../lib/sovCharge";
import { askSovereign } from "../lib/sovAsk";
import { fetchHealth } from "../lib/sovHealth";
import { subscribeBus, busHealth, fetchAnchors, fetchLedgerStats, fetchFlywheelSnapshot, fetchHiveCoverage } from "../lib/sovDataBus";
import { useGeolibre, GEO_REGION_OPTIONS } from "../lib/geolibre";
import { PERSONAS, type SovPersonaId, getPersonaId, setPersonaId, personaOf, personaSpeak, stopVoice, DOCTRINE_RE, DOCTRINE_REFUSAL } from "../lib/sovPersona";

// SovereignDock - the persistent right-hand AI OS sidebar. Speak or type and it
// acts: routes you to the right surface, answers from the framework knowledge
// base, and now answers any question with live world data via the measurement API.

type Msg = { role: "you" | "sov"; text: string };

const ROUTES: { re: RegExp; href: string; label: string }[] = [
  { re: /governance graph|knowledge graph|\bgraph\b/i, href: "/os?lobby=home", label: "the Governance Graph" },
  { re: /regulation|legislation|\blaw\b|jurisdiction|comply|compliance/i, href: "/os?lobby=home", label: "the Governance Graph" },
  { re: /framework|crosswalk|\biso\b|\bnist\b|tc260|eu ai act/i, href: "/crosswalks", label: "Framework crosswalks" },
  { re: /sov ?space|simulate|simulation|experiment|run a (sim|scenario)/i, href: "/gspc-arena", label: "Council Space" },
  { re: /sovereign town|\btown\b|incident/i, href: "/gspc-arena?view=towns", label: "the Towns layer of Council Space" },
  { re: /arena|benchmark|head.?to.?head|model compar/i, href: "/gspc-arena?view=arena", label: "the Arena layer of Council Space" },
  { re: /distribution|\bmcp\b|pypi|npm|glama|mcpize|registry/i, href: "/distribution", label: "Distribution & Layer 0 coverage" },
  { re: /jsp ?936|defence assurance|defense assurance|system card|mod evidence|evidence pack|dependable ai/i, href: "/system-card", label: "the Signed System Card — JSP 936 assurance" },
  { re: /evidence|connect|integrat|webhook/i, href: "/evidence-rail", label: "Evidence Hub" },
  { re: /certif|attest|train|academy|course|learn/i, href: "/academy", label: "Council Academy (training, not conformity)" },
  { re: /policy/i, href: "/policy-generator", label: "Policy Generator" },
  { re: /risk|heatmap/i, href: "/risk-heatmap", label: "Risk Heatmap" },
  { re: /oscal|fedramp/i, href: "/oscal", label: "OSCAL Studio" },
  { re: /model|bias|fairness/i, href: "/models", label: "Model Registry" },
  { re: /price|pricing|plan|cost/i, href: "/os?lobby=measured&task=pricing-overview", label: "How the free rail works" },
  { re: /media|image|photo|creative commons/i, href: "/commons", label: "Open Commons media" },
  { re: /status|health|uptime/i, href: "/status", label: "System Status" },
  { re: /watchdog|heat.?map|incident|signal|report a/i, href: "/watchdog-map", label: "the Global AI Watchdog" },
  { re: /humanoid|\bpoc\b|proof of concept|one os|rogue|swarm|bad actor/i, href: "/poc", label: "the ONE OS proof of concept" },
  { re: /globe|earth|world map|3d/i, href: "/gspc-arena?view=globe", label: "the Globe layer of Council Space" },
  { re: /council network|ecosystem|signed agents|agent card|our (agents|domains|companies)/i, href: "/network", label: "the Council network" },
  { re: /layer ?0|protocol|trust control/i, href: "/trust-center", label: "Layer 0" },
  { re: /command|dashboard|overview/i, href: "/command-center", label: "Command Center" },
  { re: /\bos\b|launch|grid|everything/i, href: "/os?lobby=home", label: "the OS launcher" },
];
