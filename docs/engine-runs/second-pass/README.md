# The second pass: engine-pass.mjs at 2500 ms over every course

Run 2026-09-05 by the orchestrator in a window Nick declared idle: CPU load 12-21% across
16 logical processors, no build, no test run, no dev server, one engine process, the eight
courses one after another. About 2,600 positions in 1 hour 48 minutes. One file per course
beside this one.

## Why it was run

Every course's repertoire moves had been signed off on 500 ms samplers with 2500 ms
re-checks of what the samplers reported. Phases 19, 20 and 31 each showed a sampler
missing something a slow run found. This is the slow run over the moves the trainee is
told to play, the same standard the mistakes pass has had since phase 19.

## What it reported, and the triage

25 moves across the eight courses cost 0.5 or more against the engine's own choice at the
same movetime. Read against `accepted.md` and the "engine is a floor, not a chooser"
ruling (SPEC section 8), they fall into four groups.

**Already accepted (4).** Ruy `Bxc6` against 3...Nge7, 3...Bc5 and 3...g6 (the course's
whole idea, at a known cost); Vienna `7.Nxf3` in the accepted line.

**The floor holds: a smaller edge kept, not a worse position (17).** The course move
leaves the student side level or better and the engine merely prefers a bigger edge. Colle
`b3` and `O-O` in ch2 and `e3` against 1...c5 (0.6 given back into level positions, which
is the Zukertort structure choice); London `Nb5` after Qxb2 (+1.19 kept of +3.50), `Bg3`
and `Bd3` against the Nh5 harassment (-0.16 and -0.09), `Rb1` (+0.15); Ruy ch1 `Nc3`
(+0.30); Najdorf ch3 `10...Bb7` (+0.34); Scandinavian `6...b6` in the Tennison (+0.25),
`2...Nf6` against Ng5 (-0.28), `3...c5` after 2.c4 d4 3.d3 (-0.42, the theory move,
recorded at phase 34), `2...dxe4` against 2.f3 (-0.21); Slav ch5 `...Be7` (-0.02) and
ch4 `...Be7` (+0.20); Vienna `4.Bxf7+` against 3...Na5 (+0.81 kept of +2.34) and ch6
`Bd2` (+3.11 kept of +3.81).

**Worth a note or a listed alternative, no move change (3).**
- Caro-Kann ch1, `5...Bxe4` after 5.Bd3: the engine takes `5...Qxd4` at -0.21 against
  +0.16 for the course move. The grab is sound but the queen is chased; the course keeps
  the simple recapture. Add `5...Qxd4` as a playable alternative with that note.
- Najdorf ch1, `8...Qc7` after 8.Qe2: `8...b5` is -0.27 against +0.26. Both are theory
  in this sideline; +0.26 is inside the band. Record; a note may mention b5.
- Slav ch5, `4...Nc6` after 4.c3: +0.49 against +0.01 for `4...e6`. At the edge of the
  band; the move is the natural one in the structure. Record.

**A real fault, needs Nick's ruling because fixing it changes a line id (1).**
- Scandinavian ch2, the 4.Nge2 line: after `9.O-O` the course castles (`9...O-O`, +0.83
  for White) where `9...Qxd4` takes the pawn White left hanging (+0.31). The line either
  takes the pawn or White's ninth move changes so nothing hangs; both change the line's
  identity. The course shipped today at 1.8.0, so the cost is at most one learnt line.
