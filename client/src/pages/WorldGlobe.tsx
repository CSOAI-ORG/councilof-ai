import { useEffect, useRef, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import { askSovereign } from "../lib/sovAsk";
import { sovActions, describeActions } from "../lib/sovAgent";
import { flyAndConvene, drive } from "../lib/globeDrive";
import { REGIONS } from "../lib/locale";
import { Link } from "wouter";
import CouncilNav from "../components/CouncilNav";
import AISystemNotice from "../components/AISystemNotice";
import { LAYER0_NODES, PERSONA_TOURS, STATUS_COLOR, COUNTS, type Persona } from "../data/layer0Nodes";

// FULL FILE CONTINUES - see local /tmp/councilof-ai/client/src/pages/WorldGlobe.tsx
