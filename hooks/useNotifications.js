'use client'

import { useEffect, useCallback } from 'react'

export function useNotifications() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const notify = useCallback((title, body, icon) => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!document.hidden) return // Tab is active — no notification needed

    const n = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      tag: 'chatterbox',     // Replace previous notification with same tag
      renotify: true,
    })

    setTimeout(() => n.close(), 5000)
    n.onclick = () => { window.focus(); n.close() }
  }, [])

  return { notify }
}
