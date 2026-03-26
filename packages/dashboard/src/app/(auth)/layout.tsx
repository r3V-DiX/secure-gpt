import { headers } from 'next/headers'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-invoke-path') || 'unknown'
  console.log('[AuthLayout] Rendering auth layout for path:', pathname)
  return <>{children}</>
}
