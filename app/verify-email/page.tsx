import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Mail, Lock } from "lucide-react"

import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/magicui/grid-pattern";

export const metadata: Metadata = {
  title: "Verify Your Email - FraudShield AI",
  description: "Verify your email address to complete your account setup",
}

export default async function VerifyEmailPage() {
  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Shield className="mr-2 h-6 w-6" />
          Playdoo
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Email verification is a crucial step in securing your account and ensuring you receive important updates about your fraud protection."
            </p>
            <footer className="text-sm">Security Team, Playdoo</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <GridPattern
            width={20}
            height={20}
            x={-1}
            y={-1}
            className={cn(
              "[mask-image:linear-gradient(to_top_right,white,transparent,transparent)] w-1/2 h-screen  ",
            )}
          />
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Check Your Email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Check your spam folder if you don't see the email</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Already verified?{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Sign in to your account
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Need help?{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
