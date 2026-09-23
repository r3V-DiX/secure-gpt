'use client'
// src/components/error/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => this.setState({ hasError: false, error: null })

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>

      return (
        <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 p-8 text-center">
          <div
            className="size-12 rounded-md flex items-center justify-center"
            style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
            }}
          >
            <AlertTriangle size={22} />
          </div>

          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Something went wrong
            </h2>
            <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              This page encountered an unexpected error. Your other pages are unaffected.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre
              className="text-left text-xs rounded-xl p-4 max-w-lg w-full overflow-auto"
              style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border-2)',
              color: 'var(--text-primary)',
            }}
          >
            <RefreshCw size={13} />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}