// SPDX-License-Identifier: Apache-2.0
// Isolated local browser fixture; does not authenticate or publish CouncilOS.
import { createRoot } from "react-dom/client";
import ReactionResearchReview from "../../../client/src/components/ReactionResearchReview";
const target=document.getElementById("root");
if(!target)throw Error("missing fixture root");
createRoot(target).render(<ReactionResearchReview/>);
