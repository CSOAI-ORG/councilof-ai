# MEOK AUTO-EXECUTE PROFILE
# =========================
# Nick's request: "is there a way i can put you in auto?"

# YES. The auto-mode.sh script runs every 5 minutes via LaunchAgent.
# Each cycle:
#   1. Checks SOV3 health
#   2. Watches shell history for "go" / "launch" / "fire" / "4jul"
#   3. Runs proactive_assess (catches new offers)
#   4. Fires the launch script on 4 Jul 09:00 BST
#   5. Runs the daily federation refresh at 03:00
#   6. Runs the daily OLM re-train at 03:30
#   7. Runs sovereign_ingest at 03:15
#   8. Reflects on history at 03:45
#   9. Bootstraps 33 districts at 06:00
#   10. Federates the launch command at 06:15
#   11. Reads the lapis at 06:30
#   12. Fires distribution at 10:00 daily

# To add a new trigger, edit auto-mode.sh and add a section.

# To run me on auto WITHOUT asking:
# - LaunchAgent (already set up): com.meok.auto-mode, PID persistent
# - Hermes profile: ~/.hermes/config.yaml has profile settings
# - Cron: every 5min, picks the next biggest unblock

# To ACTIVATE FULL AUTO (no prompts):
# Set in ~/.hermes/config.yaml:
#   auto_execute: true
#   auto_claim_board: true
#   no_confirm_for: [read, write, ship, patch, sigil_emit, federated_rag, bootstrap_agent]
#   confirm_required_for: [rm, kill, deploy_prod, stripe_env, financial_transactions]

# Current config: YOLO mode = default. No prompts for reads/writes.
# Already shipping.
