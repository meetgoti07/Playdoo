"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Loader } from "@/components/ui/loader";
import { Mail, ArrowLeft } from "lucide-react";

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

interface OTPVerificationProps {
  email: string;
  mode: "signup" | "signin";
  onBack: () => void;
  onSuccess: () => void;
}

export function OTPVerification({ email, mode, onBack, onSuccess }: OTPVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOTPVerification = async (values: z.infer<typeof otpSchema>) => {
    setIsVerifying(true);
    try {
      if (mode === "signup") {
        const { error } = await authClient.emailOtp.verifyEmail({
          email,
          otp: values.otp,
        });

        if (error) {
          toast("Verification Failed", { description: error.message });
          return;
        }

        toast("Email Verified Successfully", {
          description: "Your account has been activated. You can now sign in.",
        });
      } else {
        const { error } = await authClient.signIn.emailOtp({
          email,
          otp: values.otp,
        });

        if (error) {
          toast("Sign In Failed", { description: error.message });
          return;
        }

        toast("Signed In Successfully", {
          description: "Welcome back!",
        });
      }

      onSuccess();
    } catch (error) {
      toast("Error", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: mode === "signup" ? "email-verification" : "sign-in",
      });

      if (error) {
        toast("Failed to Resend OTP", { description: error.message });
        return;
      }

      toast("OTP Sent", {
        description: "A new verification code has been sent to your email.",
      });
      
      setResendTimer(60);
      setCanResend(false);
    } catch (error) {
      toast("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to resend verification code.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Enter Verification Code
        </h2>
        <p className="text-sm text-muted-foreground">
          We've sent a 6-digit verification code to{" "}
          <span className="font-medium">{email}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleOTPVerification)} className="space-y-6">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-center block">Verification Code</FormLabel>
                <FormControl>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Verifying...
              </>
            ) : (
              `Verify ${mode === "signup" ? "Email" : "& Sign In"}`
            )}
          </Button>
        </form>
      </Form>

      <div className="space-y-4 text-center">
        <div className="text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          {canResend ? (
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={handleResendOTP}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader className="mr-1 h-3 w-3" />
                  Sending...
                </>
              ) : (
                "Resend code"
              )}
            </Button>
          ) : (
            <span>Resend in {resendTimer}s</span>
          )}
        </div>

        <Button variant="ghost" onClick={onBack} className="text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {mode === "signup" ? "sign up" : "sign in"}
        </Button>
      </div>
    </div>
  );
}
