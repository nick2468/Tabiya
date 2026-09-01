# Engine runs, phase 20 (2026-09-01)

The raw output of the two engine checkers, saved because phase 19 could not compare
against the previous run's numbers: that output was gone, so its comparison had to be
made against counts recorded in the plan, which is much weaker than a list.

`node scripts/engine-mistakes.mjs courses/<course> 2500` and
`node scripts/engine-pass.mjs courses/<course> 500`, over the four courses phase 20
changed prose in. One course at a time with nothing else on the machine, because movetime
is wall clock and anything else running takes nodes away without showing it in the output.
Started 09:11, finished 09:57.

The one finding that mattered is in `mistakes-ruy-lopez-exchange.txt`: `9.Qxd8+` graded
an inaccuracy and costing 1.90, in a course phase 19 passed at the same movetime with
nothing on that side. See PLAN.md phase 20, open items 13 and 14.

Whoever runs these again: compare against `../accepted.md` first, then against these
files, and save your own beside them. `accepted.md` lists the entries every pass reports
and the decision behind each, so a run only needs an hour spent on what is new. Do not
compare against a remembered count.
