// Runs before React so dark-mode users don't see a white flash on startup.
// Keep in sync with applyTheme in src/hooks/useTheme.ts. External file because the CSP blocks inline scripts.
;(() => {
  const saved = localStorage.getItem('theme')
  const isDark =
    saved === 'dark' ||
    (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const root = document.documentElement
  root.dataset.theme = isDark ? 'dark' : 'light'
  root.style.colorScheme = isDark ? 'dark' : 'light'
  root.classList.toggle('dark', isDark)
})()
