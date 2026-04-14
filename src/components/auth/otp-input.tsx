"use client";

import { useRef, useCallback, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

export function OtpInput({ length = 6, value, onChange, disabled = false, hasError = false, className }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusInput = useCallback((index: number) => {
    const target = inputRefs.current[Math.max(0, Math.min(index, length - 1))];
    if (target) { target.focus(); target.select(); }
  }, [length]);

  const handleChange = useCallback((index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, "").charAt(0);
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(""));
    if (digit && index < length - 1) focusInput(index + 1);
  }, [digits, onChange, focusInput, length]);

  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        const nd = [...digits]; nd[index] = ""; onChange(nd.join(""));
      } else if (index > 0) {
        const nd = [...digits]; nd[index - 1] = ""; onChange(nd.join("")); focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft"  && index > 0)          { e.preventDefault(); focusInput(index - 1); }
      else if (e.key === "ArrowRight" && index < length - 1) { e.preventDefault(); focusInput(index + 1); }
      else if (e.key === "Delete") {
      e.preventDefault();
      const nd = [...digits]; nd[index] = ""; onChange(nd.join(""));
    }
  }, [digits, onChange, focusInput, length]);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (paste) {
      const nd = paste.split("").concat(Array(length).fill("")).slice(0, length);
      onChange(nd.join(""));
      focusInput(Math.min(paste.length, length - 1));
    }
  }, [onChange, focusInput, length]);

  const mid = Math.floor(length / 2);

  return (
    <div className={cn("flex gap-2.5 justify-center", className)}>
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <div key={index} className={cn("flex items-center", index === mid && "ml-3")}>
            <input
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digits[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              aria-label={`OTP digit ${index + 1}`}
              className={cn(
                "h-13 w-11 sm:h-14 sm:w-12 rounded-xl text-center text-xl font-bold",
                "transition-all duration-150 focus:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-40",
                !hasError && !isFilled && [
                  "border-2 border-border bg-input text-foreground",
                  "focus:border-primary focus:bg-accent/30",
                  "focus:shadow-[0_0_16px_hsl(var(--primary)/0.25)]",
                ].join(" "),
                !hasError && isFilled && [
                  "border-2 border-primary/60 bg-accent/50 text-primary",
                  "shadow-[0_0_8px_hsl(var(--primary)/0.2)]",
                  "focus:border-primary focus:shadow-[0_0_16px_hsl(var(--primary)/0.35)]",
                ].join(" "),
                hasError && [
                  "border-2 border-destructive/60 bg-destructive/5 text-destructive",
                  "focus:border-destructive focus:shadow-[0_0_12px_hsl(var(--destructive)/0.3)]",
                ].join(" ")
              )}
            />
            {index === mid - 1 && (
              <span className="ml-3 text-muted-foreground text-lg font-bold select-none">·</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
