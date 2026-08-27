import { useCallback, useEffect, useState } from 'react'

/**
 * Dark or light, remembered between sessions.
 *
 * The choice is a display preference rather than progress, so it is kept apart
 * from the progress file: it belongs to this screen, not to what the trainee
 * has learnt. Losing it costs one click.
 */

export type Theme = 'dark' | 'light'

const KEY = 'london-trainer.theme'

function saved(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    // Private windows and locked-down profiles can refuse storage entirely.
    return 'dark'
  }
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(saved)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // Not worth telling anyone about: the theme just will not be remembered.
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
