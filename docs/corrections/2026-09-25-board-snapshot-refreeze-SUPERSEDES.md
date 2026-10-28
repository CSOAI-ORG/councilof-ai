# Correction: the axis-count frame in this file is a dated observation, not the board's current count

**CSOAI — Council for Secure and Open AI. Correction dated 2026-10-28; published 2026-10-28.**

**Supersedes** the axis-count frame in *the board-snapshot refreeze note* (2026-09-25). That file is **not edited**. This note
stands beside it and names what it corrects; everything else in the 2026-09-25 file stands, and a
reader who saw the original bytes can still see them.

---

## What the 2026-09-25 file says

> **23 axes · 23 measured · 0 unmeasured**.

## What is wrong with it

Nothing in that frame was false on 2026-09-25. It is a **historical observation that has since been
outgrown**, and it is now dangerous for a different reason: a reader who finds this file today and
quotes its count will publish a number the board no longer carries.

The live board now states **33 axes · 23 measured**, of which 10 are
declared slots with no run behind them, and the count grammar says to quote both numbers or the
smaller one. The frame in this file quotes the *slot* count as if it were the board's size.

## What stands

- The 2026-09-25 file's bytes stand unchanged. It is evidence of what was published on 2026-09-25.
- The board's current count is read live from `https://councilof.ai/api/gspc` (`totals.axes` =
  33, `totals.measured_axes` = 23, `totals.unmeasured_axes` = 10).
- Do not quote this file's count as the board's current count. Quote the endpoint, with the date
  you read it.
