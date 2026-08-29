import Markdown from 'react-markdown'

/**
 * Course prose, which may have come from a file somebody else wrote.
 *
 * `react-markdown` has no raw-HTML plugin here, so a bundle cannot inject HTML
 * or script. The gap SPEC.md section 11 closes is the markdown LINK: this app
 * is a window, not a browser, and clicking a link in it navigates the app
 * itself. An opening note has no need of a hyperlink, and an app that opens
 * arbitrary addresses out of a shared file is a phishing vector with a chess
 * board on it.
 *
 * So links render as their own text. Every kind of link markdown has - inline,
 * reference, autolink - arrives here as the same node, which is why this is an
 * override on the renderer rather than an attempt to rewrite the source.
 */
export function Prose({ children }: { children: string }) {
  return (
    <Markdown
      components={{
        a: ({ children: text }) => <>{text}</>,
      }}
    >
      {children}
    </Markdown>
  )
}
