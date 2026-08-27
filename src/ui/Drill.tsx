import { useCallback, useMemo, useState } from 'react'
import { Board } from './Board'
import { useProgress } from './progress-context'
import { chapters } from '../content'
import { buildCards, type Card } from '../model/cards'
import {
  judge,
  ratingFor,
  sanForMove,
  squaresForSan,
  verdictDetail,
  verdictHeadline,
  type Verdict,
} from '../model/grade'
import { legalDests } from '../model/position'
import { dueQueue } from '../model/queue'
import { describeInterval, newSchedule, review, type Rating } from '../scheduler'
import type { ProgressState } from '../storage/progress'
import type { Shape } from '../model/types'
import './drill.css'

/**
 * Drill: the daily loop. A position comes up, White to move, and the trainee
 * plays what the repertoire plays.
 *
 * The session takes a snapshot of the queue when it starts and walks it in
 * order. A card answered wrong goes to the back of that session rather than
 * straight back to the front, so a move that will not come to mind cannot lock
 * the session up.
 */
export function Drill() {
  const { state, answer } = useProgress()
  const [weakAreasFirst, setWeakAreasFirst] = useState(false)
  const [session, setSession] = useState<string[] | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [done, setDone] = useState(0)
  const [correct, setCorrect] = useState(0)

  const cards = useMemo(() => buildCards(chapters, state.learntLines).cards, [state.learntLines])
  const byKey = useMemo(() => new Map(cards.map((card) => [card.key, card])), [cards])

  // The live queue, for the counts shown before a session starts.
  const queue = useMemo(
    () => dueQueue(cards, state, { weakAreasFirst }),
    [cards, state, weakAreasFirst],
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

  if (cards.length === 0) {
    return (
      <div className="drill">
        <h2>Drill</h2>
        <p className="empty-state">
          Nothing to drill yet. Study a line, tick "I have learnt this line", and every
          White move in it becomes a card here.
        </p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="drill">
        <h2>Drill</h2>
        <p className="drill-summary">
          {queue.length === 0 ? (
            <>Nothing is due. {nextDueLine(cards, state)}</>
          ) : (
            <>
              <strong>{queue.length}</strong> {queue.length === 1 ? 'card' : 'cards'} ready, out of{' '}
              {cards.length} in your learnt lines.
            </>
          )}
        </p>
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
          turnColor="white"
          movableColor={verdict ? undefined : 'white'}
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
              <h3>White to move</h3>
              <p>Play the move the repertoire plays.</p>
              <p className="hint">
                From {card.chapterIds.map(chapterTitle).join(' and ')}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Feedback({
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

      <div className="feedback-actions">
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

function chapterTitle(id: string): string {
  return chapters.find((chapter) => chapter.id === id)?.title ?? id
}
