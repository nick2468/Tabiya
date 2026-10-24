import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThirdPartyNotices } from './About'
import { loadNotices, NOTICES_PATH, NOTICES_TITLE, type NoticesLoad } from './notices'

/**
 * The third-party notices are fetched when they are opened, and only then.
 *
 * They are a few hundred kilobytes, and the whole reason they are a separate
 * file rather than an import is that nobody should download them to start the
 * app. So the first assertion of every test here is that nothing has been
 * fetched yet.
 */

const NOTICES = `${NOTICES_TITLE}\nfor Tabiya 1.0.0\n\nreact 19.2.8. Licence: MIT.\n\nCopyright (c) Meta Platforms, Inc. and affiliates.`

function setUp(answer: NoticesLoad) {
  const load = vi.fn(async () => answer)
  render(<ThirdPartyNotices load={load} />)
  return { load, user: userEvent.setup(), open: () => screen.getByRole('button', { name: 'Third-party notices' }) }
}

describe('the third-party notices on the About screen', () => {
  it('fetches nothing until they are opened, then shows them', async () => {
    const { load, user, open } = setUp({ kind: 'loaded', text: NOTICES })
    expect(load).not.toHaveBeenCalled()
    expect(open().getAttribute('aria-expanded')).toBe('false')

    await user.click(open())

    expect(load).toHaveBeenCalledTimes(1)
    expect(open().getAttribute('aria-expanded')).toBe('true')
    expect(await screen.findByText(/Copyright \(c\) Meta Platforms, Inc\. and affiliates\./)).toBeTruthy()
  })

  it('fetches once, however often it is opened and closed', async () => {
    const { load, user, open } = setUp({ kind: 'loaded', text: NOTICES })
    await user.click(open())
    await user.click(open())
    await user.click(open())
    expect(load).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/Meta Platforms/)).toBeTruthy()
  })

  it('says, in development, that they come with a release build', async () => {
    const { user, open } = setUp({ kind: 'missing' })
    await user.click(open())
    // The test runner is a development build, which is the case being shown.
    expect((await screen.findByRole('note')).textContent).toContain('generated when the app is built for release')
  })

  it('says so when they could not be loaded, rather than showing nothing', async () => {
    const { user, open } = setUp({ kind: 'failed', why: 'the network is down' })
    await user.click(open())
    expect((await screen.findByRole('alert')).textContent).toContain('the network is down')
  })
})

describe('fetching the notices', () => {
  const answering = (status: number, body: string) =>
    vi.fn(async () => new Response(body, { status })) as unknown as typeof fetch

  it('asks for the file beside the app', async () => {
    const fetcher = answering(200, NOTICES)
    await loadNotices(fetcher)
    expect(fetcher).toHaveBeenCalledWith(`/${NOTICES_PATH}`)
  })

  it('takes the file only when it opens with the title', async () => {
    expect(await loadNotices(answering(200, NOTICES))).toEqual({ kind: 'loaded', text: NOTICES })
    // A development server answers with the app's own page instead.
    expect(await loadNotices(answering(200, '<!doctype html><html></html>'))).toEqual({ kind: 'missing' })
    expect(await loadNotices(answering(404, 'Not found'))).toEqual({ kind: 'missing' })
  })

  it('reports a fetch that fails outright, and does not throw', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch
    expect(await loadNotices(fetcher)).toEqual({ kind: 'failed', why: 'offline' })
  })
})
