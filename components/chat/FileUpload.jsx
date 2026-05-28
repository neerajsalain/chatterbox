'use client'

import { useRef, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/utils/constants'

export default function FileUpload({ onUploaded, disabled }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Only images and PDFs are allowed')
      e.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File exceeds the 5 MB limit')
      e.target.value = ''
      return
    }

    setUploading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const { data } = await axios.post('/api/upload', form)
      onUploaded({
        url: data.url,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileName: file.name,
      })
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = '' // Allow re-selecting the same file
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={handleChange}
        className="hidden"
        aria-label="Upload file or image"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex-shrink-0 p-2 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
        style={{ color: 'var(--color-text-muted)' }}
        title={uploading ? 'Uploading…' : 'Attach image or file'}
        aria-label="Attach file"
      >
        {uploading ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeDasharray="56" strokeDashoffset="14" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </>
  )
}
