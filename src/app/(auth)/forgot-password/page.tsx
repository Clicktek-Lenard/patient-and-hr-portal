"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OtpInput } from "@/components/auth/otp-input";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import type { ForgotPasswordInput } from "@/lib/validations/auth";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [userId, setUserId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleEmailSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.toLowerCase() }),
      });

      const json = await response.json();

      if (!response.ok) {
        toast.error(json.error || "Failed to send reset code");
        return;
      }

      setUserId(json.data?.userId);
      setMaskedEmail(json.data?.maskedEmail ?? data.email);
      setStep("otp");
      toast.success("Reset code sent to your email");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (otpValue: string) => {
    if (otpValue.length < 6) return;
    setIsLoading(true);
    setOtpError(false);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otpValue, purpose: "RESET" }),
      });

      const json = await response.json();

      if (!response.ok) {
        setOtpError(true);
        toast.error(json.error || "Invalid or expired code");
        setOtp("");
        return;
      }

      setStep("password");
      toast.success("Code verified! Set your new password.");
    } catch {
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otp, password: newPassword, confirmPassword }),
      });

      const json = await response.json();

      if (!response.ok) {
        toast.error(json.error || "Failed to reset password");
        return;
      }

      toast.success("Password reset successfully! Please log in.");
      router.push("/login");
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      {step === "email" && (
        <>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send a reset code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  disabled={isLoading}
                  {...emailForm.register("email")}
                  className={emailForm.formState.errors.email ? "border-destructive" : ""}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Mail className="mr-2 h-4 w-4" />Send reset code</>
                )}
              </Button>
            </form>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </CardContent>
        </>
      )}

      {step === "otp" && (
        <>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Enter reset code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{maskedEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setOtpError(false);
                if (val.length === 6) handleOtpVerify(val);
              }}
              disabled={isLoading}
              hasError={otpError}
            />
            {otpError && (
              <p className="text-center text-sm text-destructive">
                Invalid or expired code. Please try again.
              </p>
            )}
            <Button
              className="w-full"
              onClick={() => handleOtpVerify(otp)}
              disabled={otp.length < 6 || isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
              ) : "Verify Code"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("email")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Use different email
            </Button>
          </CardContent>
        </>
      )}

      {step === "password" && (
        <>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
            <CardDescription>
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              className="w-full"
              onClick={handlePasswordReset}
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</>
              ) : "Reset Password"}
            </Button>
          </CardContent>
        </>
      )}
    </Card>
  );
}
