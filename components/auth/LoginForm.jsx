'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const inputStyle = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  borderRadius: '10px',
  padding: '10px 14px',
  width: '100%',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s',
}

export default function LoginForm() {
  const router = useRouter()
  const [fields, setFields] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', { ...fields, redirect: false })
      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        router.push('/chat')
        router.refresh()
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
        Welcome back
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Sign in to continue to ChatterBox
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium"
                 style={{ color: 'var(--color-text-muted)' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={fields.email}
            onChange={set('email')}
            placeholder="you@example.com"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium"
                 style={{ color: 'var(--color-text-muted)' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={fields.password}
            onChange={set('password')}
            placeholder="••••••••"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg"
             style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register"
              className="font-medium hover:underline"
              style={{ color: 'var(--color-primary)' }}>
          Create one
        </Link>
      </p>
    </>
  )
}
