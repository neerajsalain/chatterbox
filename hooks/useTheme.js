'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'chatterbox-theme'

export function useTheme() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? 'dark'
    applyTheme(saved)
    setTheme(saved)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { theme, toggleTheme, isDark: theme === 'dark' }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}
