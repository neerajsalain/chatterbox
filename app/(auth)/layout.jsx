export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'var(--color-surface-0)' }}>
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
               style={{ background: 'var(--color-primary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                    fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--color-text)' }}>
            ChatterBox
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl"
             style={{
               background: 'var(--color-surface-1)',
               border: '1px solid var(--color-border)',
             }}>
          {children}
        </div>
      </div>
    </div>
  )
}
