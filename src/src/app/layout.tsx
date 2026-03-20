import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WAB 2025 Draft Command Center',
  description: 'Westminster Auction Baseball — Live Draft Tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
