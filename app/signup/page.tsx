import type { Metadata } from "next"
import Link from "next/link"
import { SignupForm } from "@/components/auth/SignupForm"
import { AuthRedirect } from "@/components/auth/AuthRedirect"
import { Shield } from "lucide-react"
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/magicui/grid-pattern";

export const metadata: Metadata = {
  title: "Sign Up - Playdoo",
  description: "Create your Playdoo account",
}

export default async function SignupPage() {
  return (
    <AuthRedirect>
      <div className="container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <GridPattern
          width={20}
          height={20}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:linear-gradient(to_top_right,white,transparent,transparent)] w-1/2 h-screen",
          )}
        />
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-primary" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Shield className="mr-2 h-6 w-6" />
            Playdoo
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                "Join thousands of businesses that trust Playdoo to manage their sports facilities and bookings
                with our comprehensive platform."
              </p>
              <footer className="text-sm">Maria Rodriguez, Operations Manager at SportsCorp</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your details below to create your account
              </p>
            </div>
            <SignupForm />
            <p className="px-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </p>
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </AuthRedirect>
  )
}
