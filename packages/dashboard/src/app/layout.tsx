import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SecureGPT — Enterprise DLP Dashboard',
  description: 'Monitor and manage data protection across your organisation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
