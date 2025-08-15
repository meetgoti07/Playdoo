"use client"

import { useEffect } from "react"
import { Shield, RefreshCw, AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the global error according to coding guidelines
    try {
      globalThis?.logger?.error({
        err: error,
        meta: {
          requestId: crypto.randomUUID(),
          errorDigest: error.digest,
          errorName: error.name,
          errorMessage: error.message,
          errorType: 'global_error',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          timestamp: new Date().toISOString(),
        },
        message: 'Global error boundary triggered - critical application error',
      });
    } catch (loggingError) {
      // Fallback to console if logger fails
      console.error('Global error logging failed:', loggingError);
      console.error('Original global error:', error);
    }
  }, [error])

  const handleReset = () => {
    try {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          errorDigest: error.digest,
          action: 'global_error_reset',
          timestamp: new Date().toISOString(),
        },
        message: 'User triggered global error reset',
      });
      reset();
    } catch (resetError) {
      console.error('Global reset failed:', resetError);
      // Force page reload as fallback
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-destructive/10 via-background to-red-500/10">
        <div className="min-h-screen w-full flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Logo Section */}
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Shield className="h-8 w-8" />
              <span className="text-xl font-semibold">Playdoo</span>
            </div>

            {/* Error Visual */}
            <div className="relative">
              <div className="bg-destructive/20 rounded-full p-8 backdrop-blur-sm border border-destructive/30 inline-block">
                <AlertTriangle className="h-20 w-20 text-destructive" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Critical Error
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto text-lg">
                The application encountered a critical error. Please refresh the page or contact support if the problem persists.
              </p>
              
              {error.digest && (
                <div className="bg-muted/50 rounded-lg p-4 border border-muted-foreground/20">
                  <p className="text-sm text-muted-foreground font-mono">
                    Error ID: <span className="text-foreground font-semibold">{error.digest}</span>
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && (
                <details className="text-left bg-muted/30 rounded-lg p-4 border border-muted-foreground/20">
                  <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                    Debug Information (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
                    {error.name}: {error.message}
                    {error.stack && '\n' + error.stack}
                  </pre>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 px-6"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Try again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-10 px-6"
              >
                Go Home
              </button>
            </div>

            {/* Footer */}
            <div className="space-y-3 pt-6 border-t border-border/40">
              <p className="text-sm text-muted-foreground">
                If this error persists, please contact our support team at{' '}
                <a 
                  href="mailto:support@playdoo.com" 
                  className="text-primary hover:underline"
                >
                  support@playdoo.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
