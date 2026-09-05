import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Shell } from '../ui/App'
import { CatalogProvider } from '../ui/catalog-context'
import { PlayProvider } from '../ui/play-context'
import { StudyProvider } from '../ui/study-context'
import { ProgressProvider } from '../ui/progress-context'
import { fakeEngine } from './fake-engine'
import { STORAGE_KEY, emptyProgress, type PlayRecord } from '../storage/progress'

/**
 * The app in jsdom, driven the way a person drives it.
 *
 * The real providers, so the code under test is the code that ships. The one
 * substitution is the engine: `PlayProvider` takes a `createEngine` and the
 * tests give it a fake, which is what keeps a Stockfish worker out of the
 * suite and what makes the provider reachable at all.
 *
 * `Shell` rather than `App` because `App` builds the providers itself with no
 * way in. Everything below the providers is identical.
 */
export function renderApp() {
  const user = userEvent.setup()
  render(
    <ProgressProvider>
      <CatalogProvider>
        <PlayProvider createEngine={() => fakeEngine()}>
          <StudyProvider>
            <Shell />
          </StudyProvider>
        </PlayProvider>
      </CatalogProvider>
    </ProgressProvider>,
  )
  return { user }
}

/** Puts a history in place before the app starts, as an upgrade would find it. */
export function seedHistory(games: PlayRecord[]): void {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...emptyProgress(), playGames: games }),
  )
}

/** Opens a screen from the nav, by the name on its button. */
export async function goTo(
  user: ReturnType<typeof userEvent.setup>,
  screenName: string,
): Promise<void> {
  await user.click(await screen.findByRole('button', { name: screenName }))
}

/** The moves in the Play screen's move list, in order. */
export function movesOnScreen(): string[] {
  const list = document.querySelector('.move-list')
  if (!list) return []
  return [...list.querySelectorAll('li')].flatMap((row) =>
    [...row.children]
      .slice(1)
      .map((cell) => cell.textContent?.trim() ?? '')
      .filter((text) => text !== '' && text !== '...'),
  )
}

/** What the board is showing, and what it is highlighting. */
export function board(): { fen: string; lastMove: string } {
  const node = screen.getByTestId('board')
  return {
    fen: node.getAttribute('data-fen') ?? '',
    lastMove: node.getAttribute('data-last-move') ?? '',
  }
}

/** The recorded games, read back from storage the way the app stores them. */
export function storedGames(): PlayRecord[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw).playGames as PlayRecord[]) : []
}

/** One row of the Play on table, found by something it says. */
export function playOnRow(text: string): HTMLElement {
  const table = document.querySelector('.play-on-table')
  if (!table) throw new Error('there is no Play on table on screen')
  const row = [...table.querySelectorAll('tbody tr')].find((tr) =>
    tr.textContent?.includes(text),
  )
  if (!row) throw new Error(`no Play on row mentions "${text}"`)
  return row as HTMLElement
}

/** A button inside a given row, by its name. */
export function buttonIn(row: HTMLElement, name: string): HTMLButtonElement {
  return within(row).getByRole('button', { name }) as HTMLButtonElement
}
