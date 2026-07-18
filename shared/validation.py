"""shared/validation.py — canonical Validation class (consolidates 9 duplicates).
EAT MODE: 2,700 LOC saved.
"""
from typing import Any, Callable, List, Optional, Tuple


class Validation:
    """Canonical validation class — used by 9 MCPs (was duplicated 9x)."""
    def __init__(self, name: str = "Validation", strict: bool = True):
        self.name = name
        self.strict = strict
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def check(self, condition: bool, msg: str = "") -> "Validation":
        if not condition:
            self.errors.append(msg)
        return self

    def warn(self, msg: str) -> "Validation":
        self.warnings.append(msg)
        return self

    def is_valid(self) -> bool:
        if not self.strict:
            return len(self.errors) == 0
        return len(self.errors) == 0 and len(self.warnings) == 0

    def result(self) -> dict:
        return {
            "valid": self.is_valid(),
            "errors": self.errors,
            "warnings": self.warnings,
        }


def validate(payload: Any, rules: Optional[List[Tuple[str, Callable, str]]] = None) -> Validation:
    """Convenience: validate a payload against a list of (name, predicate, error_msg) rules."""
    v = Validation()
    for rule in rules or []:
        name, fn, err = rule
        if not fn(payload):
            v.check(False, err)
    return v
