# `_operator/` — runbooks, not published surface

Files here are internal working notes. They are outside `public/` deliberately: nothing in this
directory is served, prerendered, or reachable by URL.

Moved here on 2026-09-04 after the price gate blocked a deploy on `public/grants/index.html`
carrying "Total potential: $280,000". The gate was matching a number, but the real problem was
larger: `public/grants/` was serving an operator runbook on the open web. It read

  "The operator only needs to paste + submit."
  "Sloan Foundation ($75K) -> paste body -> submit (10 min)"
  "Total time: ~55 minutes. Total potential: $280,000."

alongside a social-posting schedule. Any programme officer at Sloan, Ford, NLnet or NGI Zero who
searched for us would have found their own grant process described as a 55-minute paste exercise
worth $280,000. That is not a pricing problem; it is a page that could end four applications.

The grant application bodies themselves stay public. Publishing what we ask for, and on what
basis, before we submit it, is the right posture — a reader can hold the application against what
we later claim. The runbook for pasting them is not.
