"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import React from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { OTPVerification } from "./OTPVerification";

const createFormSchema = (useOTPLogin: boolean) => z.object({
  email: z.email({ message: "Please enter a valid email address." }),
  password: useOTPLogin 
    ? z.string().optional()
    : z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [useOTPLogin, setUseOTPLogin] = useState(false);
  
  // Create dynamic schema based on login type
  const formSchema = createFormSchema(useOTPLogin);
  type FormData = z.infer<typeof formSchema>;
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  // Re-create form when switching between OTP and password login
  useEffect(() => {
    const currentEmail = form.getValues('email');
    const currentPassword = form.getValues('password');
    
    form.reset({ 
      email: currentEmail, 
      password: useOTPLogin ? undefined : currentPassword 
    });
  }, [useOTPLogin, form]);

  const checkUserExists = async (email: string): Promise<{ exists: boolean; emailVerified: boolean }> => {
    try {
      const response = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to check user existence');
      }

      return await response.json();
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: 'Failed to check if user exists',
      });
      throw error;
    }
  };

  const handleCredentialsLogin = async (values: FormData) => {
    setIsLoading(true);
    try {
      if (useOTPLogin) {
        // First check if user exists in database
        const { exists, emailVerified } = await checkUserExists(values.email);
        
        if (!exists) {
          toast("User Not Found", { 
            description: "No account found with this email address. Please sign up first." 
          });
          return;
        }



        // Send OTP for sign-in
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: values.email,
          type: "sign-in",
        });

        if (error) {
          toast("Failed to Send OTP", { description: error.message });
          return;
        }

        setLoginEmail(values.email);
        setShowOTP(true);
        toast("OTP Sent", { 
          description: "Please check your email for the verification code." 
        });
      } else {
        // Regular password login
        if (!values.password) {
          toast("Error", { description: "Password is required for regular login." });
          return;
        }

        const { data: signInData, error } = await authClient.signIn.email(
          {
            email: values.email,
            password: values.password,
          },
          {
            onError: (ctx) => {
              // Handle the error
              if (ctx.error.status === 403) {
                router.push(`/verify-email`);
              }
            },
            onSuccess: (ctx) => {
              
              
              // Redirect based on user role
              const userRole = ctx.data.user?.role;
              let redirectUrl = returnUrl;
              
              if (userRole === 'admin') {
                redirectUrl = '/admin';
              } else if (userRole === 'facility_owner') {
                redirectUrl = '/owner';
              } else if (returnUrl === '/login' || returnUrl === '/') {
                redirectUrl = '/';
              }
              
              router.push(redirectUrl);
            }
          }
        );

        if (error) {
          toast("Login Failed", { description: error.message });
          return;
        }
      }
    } catch (error) {
      toast("Error", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: '/',
        errorCallbackURL: "/error",
        newUserCallbackURL: "/onboard",
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      toast("Error Logging With Google", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };
  
  const handleMicrosoftLogin = async () => {
    setMicrosoftLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: '/',
        errorCallbackURL: "/error",
        newUserCallbackURL: "/onboard",
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      toast("Error Logging With Microsoft", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setMicrosoftLoading(false);
    }
  };

  const handleOTPSuccess = () => {
    toast("Signed In Successfully", {
      description: "Welcome back!",
    });
    
    // Get user data to determine redirect
    authClient.getSession().then(({ data: session }) => {
      const userRole = session?.user?.role;
      let redirectUrl = returnUrl;
      
      if (userRole === 'admin') {
        redirectUrl = '/admin';
      } else if (userRole === 'facility_owner') {
        redirectUrl = '/owner';
      } else if (returnUrl === '/login' || returnUrl === '/') {
        redirectUrl = '/';
      }
      
      router.push(redirectUrl);
    }).catch(() => {
      router.push(returnUrl);
    });
  };

  const handleBackToLogin = () => {
    setShowOTP(false);
    setLoginEmail("");
  };

  // Show OTP verification if needed
  if (showOTP && loginEmail) {
    return (
      <OTPVerification
        email={loginEmail}
        mode="signin"
        onBack={handleBackToLogin}
        onSuccess={handleOTPSuccess}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleCredentialsLogin)}
          className="space-y-4"
        >
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
          {!useOTPLogin && (
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
          )}
          
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => setUseOTPLogin(!useOTPLogin)}
            >
              {useOTPLogin ? "Use password instead" : "Use email OTP instead"}
            </Button>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                {useOTPLogin ? "Sending OTP..." : "Signing in..."}
              </>
            ) : (
              useOTPLogin ? "Send OTP" : "Sign in"
            )}
          </Button>
        </form>
      </Form>

      <Separator />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={handleGoogleLogin}
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
          onClick={handleMicrosoftLogin}
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
