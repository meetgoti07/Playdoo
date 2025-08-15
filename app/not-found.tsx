import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4 overflow-hidden">
      <div className="max-w-xl mx-auto text-center space-y-6">
        {/* Logo Section */}
        <div className="flex items-center justify-center space-x-2 text-primary">
          <Shield className="h-6 w-6" />
          <span className="text-lg font-semibold">Playdoo</span>
        </div>

        {/* 404 Visual */}
        <div className="relative">
          <div className="text-[120px] md:text-[140px] font-bold text-primary/10 leading-none select-none">
            404
          </div>

        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            The page you're looking for doesn't exist. Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <div className="text-sm text-muted-foreground pt-4">
          Need help? <Link href="/contact" className="text-primary hover:underline">Contact support</Link>
        </div>
      </div>
    </div>
  )
}
