import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const loaderVariants = cva(
  "animate-spin inline-block",
  {
    variants: {
      variant: {
        default: "border-4 border-gray-200 border-t-primary rounded-full",
        dots: "flex space-x-1",
        pulse: "bg-primary rounded-full animate-pulse",
        bars: "flex space-x-1",
        ring: "border-4 border-transparent border-t-primary rounded-full",
        gradient: "bg-gradient-to-r from-primary to-secondary rounded-full",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6", 
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {
  text?: string
  fullScreen?: boolean
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, variant, size, text, fullScreen, ...props }, ref) => {
    const loaderContent = () => {
      switch (variant) {
        case "dots":
          return (
            <div className={cn("flex space-x-1", className)} ref={ref} {...props}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-primary rounded-full animate-bounce",
                    size === "sm" && "h-2 w-2",
                    size === "default" && "h-3 w-3",
                    size === "lg" && "h-4 w-4",
                    size === "xl" && "h-6 w-6"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          )
        
        case "bars":
          return (
            <div className={cn("flex space-x-1", className)} ref={ref} {...props}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-primary animate-pulse",
                    size === "sm" && "h-4 w-1",
                    size === "default" && "h-6 w-1.5",
                    size === "lg" && "h-8 w-2",
                    size === "xl" && "h-12 w-3"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "1.2s",
                  }}
                />
              ))}
            </div>
          )
        
        case "pulse":
          return (
            <div
              className={cn(loaderVariants({ variant, size }), className)}
              ref={ref}
              {...props}
            />
          )
        
        case "ring":
          return (
            <div className={cn("relative", className)} ref={ref} {...props}>
              <div className={cn(loaderVariants({ variant, size }))}>
                <div
                  className={cn(
                    "absolute inset-2 border-4 border-transparent border-b-primary/30 rounded-full animate-spin",
                    "animation-delay-150"
                  )}
                  style={{ animationDirection: "reverse", animationDuration: "1s" }}
                />
              </div>
            </div>
          )
        
        case "gradient":
          return (
            <div
              className={cn(
                "relative overflow-hidden",
                size === "sm" && "h-4 w-4",
                size === "default" && "h-6 w-6",
                size === "lg" && "h-8 w-8", 
                size === "xl" && "h-12 w-12",
                className
              )}
              ref={ref}
              {...props}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary animate-spin rounded-full" />
              <div className={cn(
                "absolute inset-1 bg-background rounded-full",
                "flex items-center justify-center"
              )}>
                <div className={cn(
                  "bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse",
                  size === "sm" && "h-1 w-1",
                  size === "default" && "h-1.5 w-1.5",
                  size === "lg" && "h-2 w-2",
                  size === "xl" && "h-3 w-3"
                )} />
              </div>
            </div>
          )
        
        default:
          return (
            <div
              className={cn(loaderVariants({ variant, size }), className)}
              ref={ref}
              {...props}
            />
          )
      }
    }

    const content = (
      <div className={cn("flex flex-col items-center justify-center gap-3", {
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50": fullScreen
      })}>
        {loaderContent()}
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            {text}
          </p>
        )}
      </div>
    )

    return fullScreen ? content : loaderContent()
  }
)

Loader.displayName = "Loader"

// Individual loader components for specific use cases
export const SpinLoader = React.forwardRef<HTMLDivElement, Omit<LoaderProps, "variant">>(
  (props, ref) => <Loader ref={ref} variant="default" {...props} />
)

export const DotsLoader = React.forwardRef<HTMLDivElement, Omit<LoaderProps, "variant">>(
  (props, ref) => <Loader ref={ref} variant="dots" {...props} />
)

export const BarsLoader = React.forwardRef<HTMLDivElement, Omit<LoaderProps, "variant">>(
  (props, ref) => <Loader ref={ref} variant="bars" {...props} />
)

export const PulseLoader = React.forwardRef<HTMLDivElement, Omit<LoaderProps, "variant">>(
  (props, ref) => <Loader ref={ref} variant="pulse" {...props} />
)

export const RingLoader = React.forwardRef<HTMLDivElement, Omit<LoaderProps, "variant">>(
  (props, ref) => <Loader ref={ref} variant="ring" {...props} />
)

export const GradientLoader = React.forwardRef<HTMLDivElement, Omit<LoaderProps, "variant">>(
  (props, ref) => <Loader ref={ref} variant="gradient" {...props} />
)

// Overlay loader for page-level loading states
export const LoadingOverlay = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ children, ...props }, ref) => (
    <div className="relative">
      {children}
      <Loader ref={ref} fullScreen {...props} />
    </div>
  )
)

LoadingOverlay.displayName = "LoadingOverlay"

export { Loader, loaderVariants }
