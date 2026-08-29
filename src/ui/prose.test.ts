import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Prose } from './Prose'

/**
 * Rendered to a string rather than to a DOM, because there is no DOM in this
 * suite and this needs none: what matters is whether an anchor comes out.
 */
const render = (markdown: string) => renderToStaticMarkup(createElement(Prose, null, markdown))

describe('course prose', () => {
  it('renders an inline link as its own text, with no anchor', () => {
    const html = render('Read [the study](https://example.com/study) first.')
    expect(html).not.toContain('<a')
    expect(html).not.toContain('example.com')
    expect(html).toContain('the study')
  })

  it('renders an autolink as text too', () => {
    const html = render('See <https://example.com/x>.')
    expect(html).not.toContain('<a')
    expect(html).toContain('https://example.com/x')
  })

  it('renders a reference link as text', () => {
    const html = render('Read [the study][s] first.\n\n[s]: https://example.com/study')
    expect(html).not.toContain('<a')
    expect(html).toContain('the study')
  })

  it('still renders the markdown a course actually uses', () => {
    const html = render('## A heading\n\nA paragraph with **bold** in it.')
    expect(html).toContain('<h2>A heading</h2>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('shows raw HTML from a bundle as text rather than rendering it', () => {
    const html = render('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })
})
