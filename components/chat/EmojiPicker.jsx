'use client'

import { useEffect, useRef } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from '@/hooks/useTheme'

export default function EmojiPickerPopup({ onSelect, onClose }) {
  const wrapperRef = useRef(null)
  const { isDark } = useTheme()

  // Close when clicking outside the picker
  useEffect(() => {
    function handlePointerDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose])

  return (
    <div
      ref={wrapperRef}
      className="absolute bottom-full left-0 mb-2 z-50"
      style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))' }}
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji) => {
          onSelect(emoji.native)
          onClose()
        }}
        theme={isDark ? 'dark' : 'light'}
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={2}
        perLine={8}
      />
    </div>
  )
}
