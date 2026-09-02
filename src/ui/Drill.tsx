import { useCallback, useMemo, useState } from 'react'
import { Board } from './Board'
import { useProgress } from './progress-context'
import { useCatalog } from './catalog-context'
import { buildCardsAcross, type Card } from '../model/cards'
import {
  judge,
  ratingFor,
  sanForMove,
  squaresForSan,
  verdictDetail,
  verdictHeadline,
  type Verdict,
} from '../model/grade'
import { legalDests, sideToMove } from '../model/position'
import { dueQueue, earlyQueue } from '../model/queue'
import { describeInterval, newSchedule, review, type Rating } from '../scheduler'
import type { ProgressState } from '../storage/progress'
import type { DrillScope } from './prefs'
import { colourName, type LoadedCourse, type Shape } from '../model/types'
import './drill.css'

/**
 * Drill: the daily loop. A position comes up, the trainee is to move, and they
 * play what the repertoire plays.
 *
 * One queue across every course BY DEFAULT, which is the ruling in SPEC.md
 * section 10: due is due, whichever repertoire the card belongs to, and a
 * session that made you finish one course before starting another would leave
 * the second one rotting.
 *
 * Phase 22 made that a remembered choice rather than a rule, because it was
 * happening invisibly: the first card of a mixed queue looked like the app
 * silently picking a course. Drill mixed is still the default and still the
 * ruling; Drill selected narrows to the course the header names. The
 * preference is held in the shell, not here, because the shell greys the
 * switcher out while the queue is ignoring it.
 *
 * The session takes a snapshot of the queue when it starts and walks it in
 * order. A card answered wrong goes to the back of that session rather than
 * straight back to the front, so a move that will not come to mind cannot lock
 * the session up.
 */
export function Drill({
  courseId,
  scope,
  onScope,
}: {
  courseId: string | null
  scope: DrillScope
  onScope: (scope: DrillScope) => void
}) {
  const { state, answer } = useProgress()
  const { courses } = useCatalog()
  const [weakAreasFirst, setWeakAreasFirst] = useState(false)
  // Deliberately not remembered. It is a decision for one sitting: a box that
  // stayed ticked would make "due" mean nothing from then on.
  const [includeEarly, setIncludeEarly] = useState(false)
  const [session, setSession] = useState<string[] | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [done, setDone] = useState(0)
  const [correct, setCorrect] = useState(0)

  const everyCard = useMemo(
    () => buildCardsAcross(courses, state.learntLines).cards,
    [courses, state.learntLines],
  )
  // Derived from the preference and the course the header names, rather than
  // held here: two places holding the same choice is how they come apart.
  const only = scope === 'selected' ? courseId : null
  const cards = useMemo(
    () => (only ? everyCard.filter((card) => card.courseId === only) : everyCard),
    [everyCard, only],
  )
  const byKey = useMemo(() => new Map(everyCard.map((card) => [card.key, card])), [everyCard])

  // The live queue, for the counts shown before a session starts.
  const ready = useMemo(
    () => dueQueue(cards, state, { weakAreasFirst }),
    [cards, state, weakAreasFirst],
  )
  const queue = useMemo(
    () => (includeEarly ? earlyQueue(cards, state, { weakAreasFirst }) : ready),
    [cards, includeEarly, ready, state, weakAreasFirst],
  )

  // What each radio is worth, so the choice can be read before it is made.
  // This is the information the old per-course filter row carried.
  const selected = courses.find((course) => course.id === courseId)
  const dueMixed = useMemo(() => dueQueue(everyCard, state).length, [everyCard, state])
  const dueSelected = useMemo(
    () => dueQueue(everyCard.filter((card) => card.courseId === courseId), state).length,
    [courseId, everyCard, state],
  )

  const card = session ? byKey.get(session[0]) : undefined

  const start = useCallback(() => {
    setSession(queue.map((entry) => entry.key))
    setVerdict(null)
    setDone(0)
    setCorrect(0)
  }, [queue])

  const stop = useCallback(() => {
    setSession(null)
    setVerdict(null)
  }, [])

  const onMove = useCallback(
    (from: string, to: string) => {
      if (!card || verdict) return
      const san = sanForMove(card.fen, from, to)
      if (!san) return
      setVerdict(judge(card, san))
    },
    [card, verdict],
  )

  const next = useCallback(
    (rating?: Rating) => {
      if (!card || !verdict || !session) return
      answer(card, verdict, rating)
      setDone((count) => count + 1)
      if (verdict.kind === 'exact') setCorrect((count) => count + 1)
      const applied = rating ?? ratingFor(verdict)
      const rest = session.slice(1)
      setSession(applied === 'again' ? [...rest, card.key] : rest)
      setVerdict(null)
    },
    [answer, card, session, verdict],
  )

  if (everyCard.length === 0) {
    return (
      <div className="drill">
        <h2>Drill</h2>
        <p className="empty-state">
          Nothing to drill yet. Open a course, find a line in the table on the Study
          screen, tick it as learnt, and every move of yours in it becomes a card here.
        </p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="drill">
        <h2>Drill</h2>
        <p className="drill-lead">
          Drill shows you positions out of the lines you have marked learnt, and asks you
          for the repertoire move. It brings each one back on its own schedule.
        </p>
        {/* The count never silently changes meaning. With the early box
            ticked it says how many of the cards it is offering are actually
            due, so a bigger number cannot be read as more work arriving. */}
        <p className="drill-summary">
          {queue.length === 0 ? (
            <>Nothing is due. {nextDueLine(cards, state)}</>
          ) : ready.length < queue.length ? (
            <>
              <strong>{queue.length}</strong> {queue.length === 1 ? 'card' : 'cards'},{' '}
              {ready.length} of them due now, out of {cards.length} in your learnt lines.
            </>
          ) : (
            <>
              <strong>{queue.length}</strong> {queue.length === 1 ? 'card' : 'cards'} ready, out of{' '}
              {cards.length} in your learnt lines.
            </>
          )}
        </p>

        {/* A radio pair rather than the old row of one button per course. The
            row was a second course selector beside the header's, which is the
            confusion this phase exists to remove. The counts it carried are on
            the labels, after a colon, so nothing readable was lost. */}
        {courses.length > 1 ? (
          <fieldset className="drill-scope">
            <legend>What to drill</legend>
            <label>
              <input
                type="radio"
                checked={scope === 'mixed'}
                onChange={() => onScope('mixed')}
              />
              Drill mixed: <span className="scope-detail">every course, {dueMixed} due</span>
            </label>
            <label>
              <input
                type="radio"
                checked={scope === 'selected'}
                onChange={() => onScope('selected')}
              />
              Drill selected:{' '}
              <span className="scope-detail">
                {selected ? selected.title : 'no course'}, {dueSelected} due
              </span>
            </label>
          </fieldset>
        ) : null}

        <label className="weak-toggle">
          <input
            type="checkbox"
            checked={weakAreasFirst}
            onChange={(event) => setWeakAreasFirst(event.target.checked)}
          />
          Drill my weak areas first
        </label>
        <p className="hint">
          This puts the concepts you have been getting wrong at the front of the queue,
          judged on your last twenty answers for each one.
        </p>
        <label className="weak-toggle">
          <input
            type="checkbox"
            checked={includeEarly}
            onChange={(event) => setIncludeEarly(event.target.checked)}
          />
          Include cards that are not due yet
        </label>
        <p className="hint">
          Everything due comes first, then the cards nearest coming back. An early answer
          is an ordinary answer: it is scheduled from when you gave it, so the gap it
          earns is a little shorter than it would have been on the day.
        </p>
        <button type="button" className="primary" onClick={start} disabled={queue.length === 0}>
          Start drilling
        </button>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="drill">
        <h2>Drill</h2>
        <p className="drill-summary">
          Session finished. {done} {done === 1 ? 'answer' : 'answers'}, {correct} of them the
          repertoire move.
        </p>
        <button type="button" className="primary" onClick={stop}>
          Back to the start
        </button>
      </div>
    )
  }

  return (
    <div className="drill">
      <header className="drill-head">
        <h2>Drill</h2>
        <p className="drill-count">
          {session.length} to go, {done} answered
        </p>
        <button type="button" className="link" onClick={stop}>
          End the session
        </button>
      </header>

      <div className="drill-body">
        <Board
          fen={card.fen}
          orientation={sideToMove(card.fen)}
          turnColor={sideToMove(card.fen)}
          movableColor={verdict ? undefined : sideToMove(card.fen)}
          dests={verdict ? undefined : legalDests(card.fen)}
          shapes={verdict ? answerShapes(card, verdict) : []}
          onMove={onMove}
          size={420}
        />

        <div className="drill-side">
          {verdict ? (
            <Feedback card={card} verdict={verdict} state={state} onNext={next} />
          ) : (
            <div className="prompt">
              <h3>{colourName(sideToMove(card.fen))} to move</h3>
              <p>Play the move the repertoire plays.</p>
              <p className="hint">{whereFrom(card, courses)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * What the app says once a move has been played, and the question it asks
 * about how well the move was known.
 *
 * Exported for its test: the grade question is one of the strings the help
 * names, and a drill session cannot be reached from a test that renders to a
 * string.
 */
export function Feedback({
  card,
  verdict,
  state,
  onNext,
}: {
  card: Card
  verdict: Verdict
  state: ProgressState
  onNext: (rating?: Rating) => void
}) {
  const now = new Date()
  const current = state.cards[card.key] ?? newSchedule(now)
  const preview = (rating: Rating) => describeInterval(review(current, rating, now), now)

  return (
    <div className={`feedback ${verdict.kind}`}>
      <h3>{verdictHeadline(verdict)}</h3>
      <p className="played">
        You played <strong>{verdict.san}</strong>
        {verdict.kind === 'exact' ? '.' : `. The line plays ${card.san}.`}
      </p>
      <p>{verdictDetail(card, verdict)}</p>

      {verdict.kind === 'exact' && card.plan ? (
        <>
          <h4>Your plan from here</h4>
          <p>{card.plan}</p>
        </>
      ) : null}
      {verdict.kind !== 'exact' && card.note ? (
        <>
          <h4>Why {card.san}</h4>
          <p>{card.note}</p>
        </>
      ) : null}

      {/* The buttons already said when the card comes back. What was missing
          is that a question was being asked at all, so the row gets the
          question rather than the buttons getting new wording.

          It appears only where there is a choice to make. After a wrong move
          the row is one Continue button, and asking how well you knew a move
          you did not know would be a question with no answer. */}
      {verdict.kind === 'exact' ? (
        <h4 id="grade-question" className="grade-question">
          How well did you know it?
        </h4>
      ) : null}
      <div
        className="feedback-actions"
        role="group"
        aria-labelledby={verdict.kind === 'exact' ? 'grade-question' : undefined}
      >
        {verdict.kind === 'exact' ? (
          <>
            <button type="button" className="primary" onClick={() => onNext()}>
              Got it, back {preview('good')}
            </button>
            <button type="button" onClick={() => onNext('easy')}>
              That was easy, back {preview('easy')}
            </button>
          </>
        ) : (
          <button type="button" className="primary" onClick={() => onNext()}>
            Continue, back {preview(ratingFor(verdict))}
          </button>
        )}
      </div>
    </div>
  )
}

/** Green for the repertoire move, red for the wrong move that was played. */
function answerShapes(card: Card, verdict: Verdict): Shape[] {
  const expected: Shape = { orig: card.from, dest: card.to, brush: 'green' }
  if (verdict.kind === 'exact') return [expected]
  const played = squaresForSan(card.fen, verdict.san)
  if (!played) return [expected]
  return [{ orig: played.from, dest: played.to, brush: 'red' }, expected]
}

/** When the next card comes back, in words. */
function nextDueLine(cards: Card[], state: ProgressState): string {
  const upcoming = cards
    .map((card) => state.cards[card.key])
    .filter((schedule) => Boolean(schedule))
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0]
  return upcoming ? `The next card comes back ${describeInterval(upcoming)}.` : ''
}

/**
 * Where the card came from, in one line: the course, then its chapters.
 *
 * The course is named on every card because the queue mixes them. Without it a
 * position out of a Black repertoire arriving between two London ones is just
 * confusing.
 */
function whereFrom(card: Card, courses: LoadedCourse[]): string {
  const course = courses.find((entry) => entry.id === card.courseId)
  const titles = card.chapterIds.map((id) => {
    const chapter = course?.chapters.find((entry) => entry.id === id)
    return chapter?.title ?? id
  })
  return `${course?.title ?? card.courseId}: ${titles.join(' and ')}.`
}
