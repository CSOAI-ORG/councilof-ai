"""meok-sovereign-training-mcp."""
from .sovereign_training import (
    VERSION, TOOLS,
    training_list_tracks, training_get_track, training_enroll, training_progress,
    training_issue_cert, training_verify, training_list_user_certs,
    training_partner_enroll, training_partner_aggregate, training_metrics_global,
)

__version__ = VERSION
__all__ = TOOLS + ["VERSION", "main"]

def main():
    print(f"meok-sovereign-training-mcp v{VERSION}")
    print(f"Tools: {TOOLS}")

if __name__ == "__main__":
    main()
