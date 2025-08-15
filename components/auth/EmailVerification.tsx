import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, CheckCircle } from "lucide-react"

export function EmailVerificationForm() {

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Verification Email Sent
            </h3>
          </div>
          <p className="mt-2 text-sm text-green-700 dark:text-green-300">
            We've sent a verification link to your email address. The link will expire in 24 hours.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">What to do next:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Check your email inbox for a message from FraudShield AI</li>
            <li>Click the "Verify Email Address" button in the email</li>
            <li>You'll be redirected back to complete your account setup</li>
          </ol>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-sm font-medium mb-2">Didn't receive the email?</h3>

          <Button
            variant="outline"
            disabled
            className="w-full opacity-50 cursor-not-allowed"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Resend Verification Email
          </Button>
          
          <p className="text-xs text-muted-foreground mt-2">
            Please wait a moment before requesting another email
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>• Check your spam or junk folder</p>
          <p>• Make sure you entered the correct email address</p>
          <p>• Verification links expire after 24 hours</p>
        </div>
      </div>
    </div>
  )
}
