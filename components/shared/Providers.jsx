'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export default function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e2e',
            color: '#e2e8f0',
            border: '1px solid #3a3a5c',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1e1e2e' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e1e2e' } },
        }}
      />
    </SessionProvider>
  )
}
