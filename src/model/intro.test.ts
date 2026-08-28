import { describe, expect, it } from 'vitest'
import { splitIntro } from './intro'

describe('splitIntro', () => {
  it('drops the title and splits at the first section heading', () => {
    const parts = splitIntro('# Title\n\nThe lead paragraph.\n\n## First section\n\nBody.')
    expect(parts.lead).toBe('The lead paragraph.')
    expect(parts.rest).toBe('## First section\n\nBody.')
  })

  it('returns everything as the lead when there are no sections', () => {
    const parts = splitIntro('# Title\n\nJust prose.')
    expect(parts).toEqual({ lead: 'Just prose.', rest: '' })
  })

  it('keeps every later section together in the rest', () => {
    const parts = splitIntro('# T\n\nLead.\n\n## A\n\none\n\n## B\n\ntwo')
    expect(parts.lead).toBe('Lead.')
    expect(parts.rest).toContain('## A')
    expect(parts.rest).toContain('## B')
  })
})
