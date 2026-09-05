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

**`najdorf-black` ch4-bc4-and-h3, three alternatives at `11...Ne8`, all reported at
about 99.7.**
Line: `e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bc4 e6 Bb3 b5 O-O Be7 Qf3 Qc7 Qg3 O-O Bh6`,
where the course plays `11...Ne8`. The three alternatives beside it, `11...Nxe4`,
`11...b4` and `11...Bb7`, all lose by force to `12.Bxg7`: the pawn cannot be taken back,
because `Kxg7` would step onto the file White's queen is already on.

**The number is a mate score, not a pawn count, and no grade in the schema is above
`mistake`.** The bands run `playable` to 0.9, `inaccuracy` to 1.8, and `mistake` to 99,
so a forced mate is outside every one of them and the checker has nothing to match. All
three are graded `mistake`, which is the strongest word available, and each note says
plainly that the move loses on the spot.

Found and settled at phase 31. The position itself is fine for Black, +0.29 at 2500 ms
after the course's own move, so this is not an unsound line: it is three sharp
alternatives beside a sound one. **A fourth entry appearing at this position would be
new** and worth an hour; these three are not.

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

**The seventeen "floor holds" findings of the second pass, 2026-09-05.** The pass ran
`engine-pass.mjs` at 2500 ms over all eight courses (`docs/engine-runs/second-pass/`).
In each of these the course move leaves the student side level or better and the engine
merely prefers a bigger edge, which is the floor ruling of review gate 18 exactly. Each
line gives the chapter, the move, and the position after it from White's side at 2500 ms
(the number the floor is judged on), then what the engine wanted. Settled at phase 35;
a later pass reporting any of them at about these numbers reports nothing new.

- `colle-zukertort` ch2-bishop-out, `6.O-O` after `...Bxd3 Qxd3 e6`: +0.02 kept of +0.58.
- `colle-zukertort` ch2-bishop-out, `7.b3` a move later: 0.00 kept of +0.62. Both are the
  Zukertort structure choice, half a pawn given back into a level position.
- `colle-zukertort` ch5-everything-else, `2.e3` against `1...c5`: +0.16 kept of +0.78. The
  system move, played against everything.
- `london-white` ch2-c5-qb6, `5.Nb5` after `...Qxb2`: +1.19 kept of +3.50. A clear plus kept
  with the move a club player finds, against a bigger one that needs the tactic known.
- `london-white` ch2-c5-qb6, `6.Rb1` after `...Na6`: +0.15 kept of +0.65.
- `london-white` ch5-harassment, `5.Bg3` after `4...Nh5`: -0.16 kept of +0.47. The
  bishop keeps its diagonal, which is the system's answer to the harassment.
- `london-white` ch5-harassment, `6.Bd3` a move later: -0.09 kept of +0.43.
- `ruy-lopez-exchange` ch1-f6, `8.Nc3` after `...Bd7`: +0.30 kept of +0.82.
- `najdorf-black` ch3-classical-and-quiet, `10...Bb7` in the g3 line: +0.34 kept of -0.16.
- `scandinavian-black` ch5-everything-else, Tennison `3...Nf6` against Ng5: -0.28 kept of
  -0.89 (3...e5 is the engine's; it is a playable entry, phase 34).
- `scandinavian-black` ch5-everything-else, Tennison `8...b6`: +0.25 kept of -0.42.
- `scandinavian-black` ch5-everything-else, `3...c5` after 2.c4 d4 3.d3: -0.42 kept of
  -0.98 (3...e5 is the engine's; c5 holds d4 and is the theory move, recorded at phase 34).
- `scandinavian-black` ch5-everything-else, `2...dxe4` against 2.f3: -0.21 kept of -0.76.
- `slav-black` ch4-sidelines, `7...Be7` in the g3 line: +0.20 kept of -0.30.
- `slav-black` ch5-no-c4, `10...Be7` in the Qb3 line: -0.02 kept of -0.54.
- `vienna-gambit` ch4-nc6, `4.Bxf7+` against `3...Na5`: +0.81 kept of +2.34. The sacrifice
  is the course's point and stays clearly better.
- `vienna-gambit` ch6-tactics-and-plans, `9.Bd2` in the exercise: +3.11 kept of +3.81.

## What is deliberately NOT here

The "graded too harshly" side of `engine-mistakes.mjs`. It runs to a dozen or more
entries at any moment, it moves between runs, and it is a limitation of the band model
rather than a set of decisions: a move graded a mistake because it shuts a bishop in is
one the engine scores at nothing, and correctly. Read it as a pointer to notes worth
checking, which is what review gate 19 did, and not as a list to be silenced.
