import type { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"
import { AuthRedirect } from "@/components/auth/AuthRedirect"
import { Shield } from "lucide-react"
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/magicui/grid-pattern";

export const metadata: Metadata = {
  title: "Login - Playdoo",
  description: "Login to your Playdoo account",
}

export default async function LoginPage() {
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
        <div className="relative hidden h-full flex-col bg-muted p-6 lg:p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-primary" />
          <div className="relative z-20 flex items-center text-base lg:text-lg font-medium">
            <Shield className="mr-2 h-5 w-5 lg:h-6 lg:w-6" />
            Playdoo
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-base lg:text-lg">
                "Playdoo has revolutionized how we book and manage sports facilities. The platform's ease of use and
                comprehensive features have made facility booking effortless."
              </p>
              <footer className="text-sm">Alex Johnson, Sports Manager</footer>
            </blockquote>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials below to access your account
              </p>
            </div>
            <LoginForm />
            <p className="px-4 sm:px-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthRedirect>
  )
}