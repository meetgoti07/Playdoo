"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, RefreshCw, Home, AlertTriangle, Bug } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error according to coding guidelines
    try {
      globalThis?.logger?.error({
        err: error,
        meta: {
          requestId: crypto.randomUUID(),
          errorDigest: error.digest,
          errorName: error.name,
          errorMessage: error.message,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          timestamp: new Date().toISOString(),
        },
        message: 'Client-side error occurred in error boundary',
      });
    } catch (loggingError) {
      // Fallback to console if logger fails
      console.error('Error logging failed:', loggingError);
      console.error('Original error:', error);
    }
  }, [error])

  const handleReset = () => {
    try {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          errorDigest: error.digest,
          action: 'user_triggered_reset',
          timestamp: new Date().toISOString(),
        },
        message: 'User triggered error reset',
      });
      reset();
    } catch (resetError) {
      console.error('Reset failed:', resetError);
      // Force page reload as fallback
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  const isClientError = error.message.includes('ChunkLoadError') || 
                       error.message.includes('Loading chunk') ||
                       error.message.includes('Loading CSS chunk');

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-destructive/5 via-background to-orange-500/5 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo Section */}
        <div className="flex items-center justify-center space-x-2 text-primary">
          <Shield className="h-8 w-8" />
          <span className="text-xl font-semibold">Playdoo</span>
        </div>

        {/* Error Visual */}
        <div className="relative">
          <div className="bg-destructive/10 rounded-full p-8 backdrop-blur-sm border border-destructive/20 inline-block">
            {isClientError ? (
              <Bug className="h-16 w-16 text-destructive" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-destructive" />
            )}
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {isClientError ? 'Loading Error' : 'Something went wrong!'}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-lg">
            {isClientError 
              ? 'There was a problem loading the application. This is usually temporary.'
              : 'We encountered an unexpected error. Our team has been notified.'
            }
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
          <Button onClick={handleReset} size="lg">
            <RefreshCw className="h-5 w-5 mr-2" />
            Try again
          </Button>
          
          <Button variant="outline" size="lg" asChild>
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Go Home</span>
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="space-y-3 pt-6 border-t border-border/40">
          <h3 className="text-lg font-medium text-foreground">Need help?</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <Link 
              href="/support" 
              className="text-primary hover:underline transition-colors"
            >
              Contact Support
            </Link>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <a 
              href="mailto:support@playdoo.com" 
              className="text-primary hover:underline transition-colors"
            >
              support@playdoo.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
