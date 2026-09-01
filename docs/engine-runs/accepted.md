# Findings the checkers will keep reporting, and the decision behind each

Every pass of `engine-pass.mjs` and `engine-mistakes.mjs` reports the same handful of
entries, because each is a deliberate choice that the band model or the half-pawn
threshold cannot express. The decisions exist; they were scattered across gate records,
so every pass has re-derived them from scratch and one of them has been re-argued twice.

**Compare a new run against this file first.** Anything here is settled. Anything not
here is new, and new is the only thing worth an hour.

Adding to this file is a deliberate act, not a way to quieten a checker: an entry needs
the number, the decision, and where the decision was taken.

## engine-mistakes.mjs

**`ruy-lopez-exchange` ch1-f6, `9.Qxd8+` graded an inaccuracy, about 1.9.**
Line: `e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O f6 d4 Bd6 dxe5 Bxe5 Nxe5 fxe5`, where the course
plays `9.Qh5+`. Measured three times at 2500 ms: the checker 1.90, phase 20's re-measure
1.88, review gate 20's 1.91, against an inaccuracy ceiling of 1.80. Decided at phase 20
under the band-edge ruling in SPEC section 8: the move trades into an ending White is
still much better in, about +1.5, rather than throwing the game away, so the grade is a
teaching call. **Note that this is not a straddle.** Every measurement agrees the number
is over the ceiling, so the checker will report it every time. It stays an inaccuracy
because the decision was argued, not because the number is unclear. Its note was wrong
when the entry was found and was fixed then: it had called the ending level.

## engine-pass.mjs

**`vienna-gambit` ch2-accepted, `7.Nxf3`, about 1.1 to 1.3.**
Line: `e4 e5 Nc3 Nf6 f4 exf4 e5 Nd5 Nxd5 Qh4+ Ke2 f3+`. The engine prefers `7.Ke3` by
about a pawn and both are winning for White. Ruled at review gate 18 and written into
SPEC section 8 as *the engine is a floor, not a chooser*: where two moves both leave the
student clearly better, the fork rule in section 3 governs and the threshold does not
overrule it. A course that teaches a king walk to e3 in the sharpest position in the
repertoire is teaching a line its reader will get wrong under pressure.

**`ruy-lopez-exchange` ch5-no-a6, `Bxc6` against `3...Nf6`, `3...Bc5`, `3...Nge7` and
`3...g6`, about 0.5 to 1.0 each.**
Taking on c6 before Black has asked the question costs a move of development, and the
engine prices it. The chapter's own intro states the choice and the reason: "Bxc6 in
every line here... One structure understood beats five structures half known, and that is
the whole argument for choosing the Exchange." Measured at review gate 12 (0.71, 0.50,
0.96) and again at phase 20 (0.79, 0.64, 0.50). Same reasoning as the Vienna entry above:
the threshold catches a move that is simply worse, not a repertoire that has chosen its
ground.

## What is deliberately NOT here

The "graded too harshly" side of `engine-mistakes.mjs`. It runs to a dozen or more
entries at any moment, it moves between runs, and it is a limitation of the band model
rather than a set of decisions: a move graded a mistake because it shuts a bishop in is
one the engine scores at nothing, and correctly. Read it as a pointer to notes worth
checking, which is what review gate 19 did, and not as a list to be silenced.
