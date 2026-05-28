'use client'

import { useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import FileUpload from './FileUpload'
import { TYPING_DEBOUNCE_MS } from '@/utils/constants'

// Lazy-load the emoji picker bundle — it's ~500 KB and only needed on interaction
const EmojiPickerPopup = dynamic(() => import('./EmojiPicker'), { ssr: false })

export default function MessageInput({ onSend, onFileSend, onTyping }) {
  const [value, setValue] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const typingTimeout = useRef(null)
  const isTyping = useRef(false)
  const textareaRef = useRef(null)

  const clearTyping = useCallback(() => {
    clearTimeout(typingTimeout.current)
    if (isTyping.current) {
      isTyping.current = false
      onTyping?.(false)
    }
  }, [onTyping])

  function handleChange(e) {
    setValue(e.target.value)

    if (!isTyping.current) {
      isTyping.current = true
      onTyping?.(true)
    }
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false
      onTyping?.(false)
    }, TYPING_DEBOUNCE_MS)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
    // Close emoji picker on Escape
    if (e.key === 'Escape' && showEmoji) setShowEmoji(false)
  }

  function appendEmoji(native) {
    setValue((prev) => prev + native)
    textareaRef.current?.focus()
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
    clearTyping()
  }

  function handleFileSend(fileData) {
    onFileSend?.(fileData)
  }

  const canSend = value.trim().length > 0

  return (
    <div
      className="relative flex items-end gap-2 p-4 flex-shrink-0"
      style={{ borderTop: '1px solid var(--color-border)' }}
    >
      {/* Emoji picker popup — rendered above the input bar */}
      {showEmoji && (
        <EmojiPickerPopup
          onSelect={appendEmoji}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* Emoji toggle */}
      <button
        type="button"
        onClick={() => setShowEmoji((s) => !s)}
        className="flex-shrink-0 p-2 rounded-lg transition-opacity hover:opacity-70"
        style={{ color: showEmoji ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
        title="Emoji"
        aria-label="Toggle emoji picker"
        aria-expanded={showEmoji}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* File / image attach */}
      <FileUpload onUploaded={handleFileSend} disabled={false} />

      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Message… (Enter to send, Shift+Enter for newline)"
        rows={1}
        className="flex-1 resize-none text-sm rounded-xl px-4 py-2.5 outline-none scrollbar-thin"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          maxHeight: '140px',
          lineHeight: '1.6',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
      />

      {/* Send button */}
      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        className="flex-shrink-0 rounded-xl p-2.5 transition-opacity disabled:opacity-30"
        style={{ background: 'var(--color-primary)' }}
        aria-label="Send message"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
