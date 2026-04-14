import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg px-3 py-2 text-sm",
          "border border-border bg-input text-foreground",
          "placeholder:text-muted-foreground",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "focus-visible:outline-none focus-visible:border-primary/60",
          "focus-visible:ring-2 focus-visible:ring-primary/20",
          "focus-visible:shadow-[0_0_12px_hsl(var(--primary)/0.15)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
