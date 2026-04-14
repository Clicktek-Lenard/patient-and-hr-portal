"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OtpInput } from "@/components/auth/otp-input";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const purpose = (searchParams.get("purpose") as "REGISTER" | "LOGIN" | "RESET") ?? "REGISTER";

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.replace("/login");
    }
  }, [userId, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (otpValue: string) => {
    if (otpValue.length < 6) return;
    setIsVerifying(true);
    setHasError(false);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otpValue, purpose }),
      });

      const json = await response.json();

      if (!response.ok) {
        setHasError(true);
        toast.error(json.error || "Invalid or expired OTP");
        setOtp("");
        return;
      }

      toast.success("Verification successful!");

      if (purpose === "RESET") {
        router.push(`/reset-password?userId=${userId}&token=${json.data?.token}`);
      } else {
        // Auto sign-in after registration/login verification
        router.push("/login?verified=1");
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, purpose }),
      });

      const json = await response.json();

      if (!response.ok) {
        toast.error(json.error || "Failed to resend OTP");
        return;
      }

      toast.success("New OTP sent! Check your email.");
      setResendCooldown(60);
      setOtp("");
      setHasError(false);
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const purposeText = {
    REGISTER: {
      title: "Verify your email",
      description: "We sent a 6-digit code to your registered email address. Please enter it below to activate your account.",
    },
    LOGIN: {
      title: "Two-factor authentication",
      description: "Enter the 6-digit code sent to your email or mobile number to continue.",
    },
    RESET: {
      title: "Reset password",
      description: "Enter the 6-digit code we sent to your email to reset your password.",
    },
  };

  const texts = purposeText[purpose] ?? purposeText.REGISTER;

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <OtpInput
          value={otp}
          onChange={(val) => {
            setOtp(val);
            setHasError(false);
            if (val.length === 6) {
              handleVerify(val);
            }
          }}
          disabled={isVerifying}
          hasError={hasError}
        />

        {hasError && (
          <p className="text-center text-sm text-destructive">
            The OTP entered is incorrect or has expired.
          </p>
        )}

        <Button
          className="w-full"
          onClick={() => handleVerify(otp)}
          disabled={otp.length < 6 || isVerifying}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the code?
          </p>
          {resendCooldown > 0 ? (
            <p className="text-sm text-muted-foreground mt-1">
              Resend in{" "}
              <span className="font-medium text-foreground">
                {resendCooldown}s
              </span>
            </p>
          ) : (
            <Button
              variant="link"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
              className="mt-1 p-0 h-auto"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend code"
              )}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          Back to login
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <Card className="shadow-lg">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
