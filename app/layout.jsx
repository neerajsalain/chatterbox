import './globals.css'
import Providers from '@/components/shared/Providers'

export const metadata = {
  title: 'ChatterBox — Real-Time Chat',
  description: 'Instant messaging with real-time presence, rooms, and private conversations.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
