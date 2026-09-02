import { useState, type ReactNode } from 'react'
import { Prose } from './Prose'
import { HELP_DOCUMENT, HELP_LABEL, PANELS, type PanelId } from './help-text'
import './help.css'

/**
 * The Help screen: one document, always available.
 *
 * It goes through `Prose`, the same renderer the course notes use, so it
 * inherits the app's prose styling and needs no styling of its own. `Prose`
 * neutralises links, which is right here too: this is a window, not a browser,
 * and a section that wants to point at another one says its name.
 *
 * Help is a mode rather than a dialog because it is a document. Somebody who
 * is stuck wants to read it, scroll back, and then come out where they were,
 * and a panel that closes when they click the wrong thing does not allow that.
 */
export function Help() {
  return (
    <div className="help-doc">
      <h2>Help</h2>
      <p className="help-lead">
        What this app is, and what each screen wants from you. It is about the
        application. The chess is in the courses.
      </p>
      <Prose>{HELP_DOCUMENT}</Prose>
    </div>
  )
}

/**
 * The `?` beside a heading.
 *
 * A real button, not a hover tooltip. The panel it opens has to hold three
 * sentences, be reachable from the keyboard, and be readable by somebody who
 * never hovers, and a tooltip fails all three.
 *
 * Escape closes it from here, where the focus already is once the button has
 * been pressed.
 *
 * The button and the panel are separate because a fieldset's caption is its
 * `<legend>`, which must be the fieldset's first child: the button belongs
 * inside it and three sentences of prose do not, because a legend is read out
 * again for every radio under it.
 */
export function HelpAsk({
  panel,
  open,
  onToggle,
}: {
  panel: PanelId
  open: boolean
  onToggle: (open: boolean) => void
}) {
  return (
    <button
      type="button"
      className="help-ask"
      aria-expanded={open}
      aria-controls={`help-panel-${panel}`}
      aria-label={`${HELP_LABEL}: ${PANELS[panel].title}`}
      title={HELP_LABEL}
      onClick={() => onToggle(!open)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) onToggle(false)
      }}
    >
      ?
    </button>
  )
}

/**
 * What the `?` says, in the flow underneath it.
 *
 * In the flow rather than floating over the screen, so opening it moves what
 * is below it by the panel's own height and moves nothing else at all. The
 * text comes from `help.ts` and is a paragraph of the matching Help section
 * rather than a second copy of it.
 */
export function HelpSaid({ panel, open }: { panel: PanelId; open: boolean }) {
  if (!open) return null
  return (
    <p id={`help-panel-${panel}`} role="note" className="help-said">
      {PANELS[panel].text}
    </p>
  )
}

/**
 * A heading with a `?` beside it, and its panel under both.
 *
 * The convenience form, for the ordinary case where the thing being explained
 * is under a heading. Play's launch options are the other case and use the two
 * pieces directly.
 */
export function HelpPanel({ panel, children }: { panel: PanelId; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="help-head">
        {children}
        <HelpAsk panel={panel} open={open} onToggle={setOpen} />
      </div>
      <HelpSaid panel={panel} open={open} />
    </>
  )
}
