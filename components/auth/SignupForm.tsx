"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";
import { FaGoogle, FaMicrosoft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { OTPVerification } from "./OTPVerification";
import { role } from "better-auth/plugins";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
    }),
  confirmPassword: z.string(),
  role: z.enum(["user", "facility_owner"], { message: "Invalid role" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function SignupForm() {

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupData, setSignupData] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: "",
      email: "", 
      password: "",
      confirmPassword: "",
      role: "user" 
    },
  });

  const handleCredentialsSignup = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // First, create the account
      const { error: signupError } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (signupError) {
        toast("Registration Failed", { description: signupError.message });
        return;
      }

      // Send OTP for email verification
      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email: values.email,
        type: "email-verification",
      });

      if (otpError) {
        toast("Failed to Send Verification Code", { description: otpError.message });
        return;
      }

      // Store signup data and show OTP verification
      setSignupData({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      setSignupEmail(values.email);
      setShowOTP(true);

      toast("Verification Code Sent", { 
        description: "Please check your email for the verification code." 
      });
    } catch (error) {
      toast("Error", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {

      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/error",
        newUserCallbackURL: "/onboard",
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      toast("Error Signing Up With Google", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMicrosoftSignup = async () => {
    setMicrosoftLoading(true);
    try {
      
      const { error } = await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: "/",
        errorCallbackURL: "/error",
        newUserCallbackURL: "/onboard",
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      toast("Error Signing Up With Microsoft", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setMicrosoftLoading(false);
    }
  };

  const handleOTPSuccess = async () => {
    try {
      // If we have stored signup data with a role, update the user's role
      if (signupData?.role && signupData.role !== 'user') {
        const response = await fetch('/api/auth/update-role', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: signupData.role }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          globalThis?.logger?.error({
            err: new Error(`Role update failed: ${errorData.error}`),
            meta: {
              requestId: crypto.randomUUID(),
              email: signupData.email,
              role: signupData.role,
            },
            message: 'Failed to update user role after signup.',
          });
          toast("Warning", {
            description: "Account created but role update failed. Please contact support.",
          });
        } else {
          globalThis?.logger?.info({
            meta: {
              requestId: crypto.randomUUID(),
              email: signupData.email,
              role: signupData.role,
            },
            message: 'User role updated successfully after signup.',
          });
        }
      }

      toast("Account Created Successfully", {
        description: "Your email has been verified. You can now sign in.",
      });
      router.push("/login");
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        meta: {
          requestId: crypto.randomUUID(),
          email: signupData?.email,
        },
        message: 'Error during post-signup role update.',
      });
      toast("Account Created", {
        description: "Account created successfully. You can now sign in.",
      });
      router.push("/login");
    }
  };

  const handleBackToSignup = () => {
    setShowOTP(false);
    setSignupEmail("");
    setSignupData(null);
  };

  // Show OTP verification if needed
  if (showOTP && signupEmail) {
    return (
      <OTPVerification
        email={signupEmail}
        mode="signup"
        onBack={handleBackToSignup}
        onSuccess={handleOTPSuccess}
      />
    );
  }


  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleCredentialsSignup)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="name@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="••••••••" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="••••••••" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Player/Customer</span>
                          <span className="text-sm text-muted-foreground">Book and play at facilities</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="facility_owner">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Facility Owner</span>
                          <span className="text-sm text-muted-foreground">Manage your sports facilities</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

      <Separator />
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      <Button
        variant="outline"
        onClick={handleGoogleSignup}
        disabled={googleLoading}
        className="flex items-center gap-2"
      >
        {googleLoading ? (
          <>
            <Loader className="h-4 w-4" />
            Connecting...
          </>
        ) : (
          <>
            <FaGoogle />
            Google
          </>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={handleMicrosoftSignup}
        disabled={microsoftLoading}
        className="flex items-center gap-2"
      >
        {microsoftLoading ? (
          <>
            <Loader className="h-4 w-4" />
            Connecting...
          </>
        ) : (
          <>
            <FaMicrosoft />
            Microsoft
          </>
        )}
      </Button>
      </div>
    </div>
  );
}
