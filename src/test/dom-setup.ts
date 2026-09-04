import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * What every DOM test gets before it starts.
 *
 * `cleanup` unmounts between tests: jsdom keeps one document for the whole
 * file, so without it the second test in a file finds two copies of the app
 * and every query is ambiguous.
 *
 * `localStorage` is real here and also shared across a file, so it is emptied
 * too. The identity tests write records and read them back; one leaking into
 * the next would make them pass for the wrong reason, which is worse than
 * failing.
 *
 * No `jest-dom` matchers. `toBeDisabled` reads well and is one more dependency
 * to keep in step with React and vitest, and `expect(button.disabled).toBe(true)`
 * says the same thing about the same property.
 */
/**
 * jsdom has no layout, so it has no `scrollIntoView` either, and calling the
 * missing method throws. The move list calls it to keep the replayed move
 * visible, which is a question about layout and therefore has no answer here:
 * a no-op is the honest stand-in rather than a gap being papered over.
 */
Element.prototype.scrollIntoView = () => {}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
