export type ReactionOperatingView = {
  schema: "csoai.reaction-operating-view/0.1";
  view_only: true;
  source_authentication_established: false;
  execute_authorized: false;
  independent_receiver_acceptance_established: false;
  actual_buyer_acceptance_established: false;
  total_cases: number;
  simulated_cases: number;
  observed_cases: number;
  reported_complete_chains: number;
  independently_qualified_chains: null;
  highest_gate: {stage: string; role: string; owner_acknowledged: false};
  cases: Array<{experiment_id: string; case_id: string; realm: string; status: string; missing: string[]; failed: string[]}>;
};
export declare function summarizeReactionCases(cases: unknown): ReactionOperatingView;
export declare function renderOperatingView(view: ReactionOperatingView): string;
