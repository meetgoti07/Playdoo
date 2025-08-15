import { Loader } from "@/components/ui/loader"

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center justify-center space-y-6 p-8">
        {/* Main loader */}
        <Loader 
          variant="gradient" 
          size="xl" 
          className="drop-shadow-lg"
        />
        
        {/* Loading text */}
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-foreground animate-pulse">
            Loading...
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Please wait while we prepare your content
          </p>
        </div>
        
        {/* Additional decorative loaders */}
        <div className="flex items-center space-x-4 opacity-60">
          <Loader variant="dots" size="sm" />
          <div className="h-px w-8 bg-border" />
          <Loader variant="pulse" size="sm" />
          <div className="h-px w-8 bg-border" />
          <Loader variant="dots" size="sm" />
        </div>
      </div>
    </div>
  )
}
