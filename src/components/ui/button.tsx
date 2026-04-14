import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg",
    "text-sm font-semibold tracking-wide",
    "transition-all duration-150 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:scale-[0.97]",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — filled cyan
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[0_0_12px_hsl(var(--primary)/0.25)]",
          "hover:bg-primary/85 hover:shadow-[0_0_20px_hsl(var(--primary)/0.45)]",
        ].join(" "),

        // Secondary — ghost cyan border
        secondary: [
          "border border-primary/40 text-primary bg-transparent",
          "hover:bg-primary/10 hover:border-primary/70",
        ].join(" "),

        // Outline — muted border
        outline: [
          "border border-border text-muted-foreground bg-transparent",
          "hover:bg-muted hover:text-foreground hover:border-primary/30",
        ].join(" "),

        // Ghost
        ghost: [
          "text-muted-foreground bg-transparent",
          "hover:bg-muted hover:text-foreground",
        ].join(" "),

        // Destructive
        destructive: [
          "border border-destructive/40 text-destructive bg-transparent",
          "hover:bg-destructive/10 hover:border-destructive/70",
        ].join(" "),

        // Link
        link: "text-primary underline-offset-4 hover:underline bg-transparent p-0 h-auto",
      },
      size: {
        default:   "h-10 px-5 py-2.5",
        sm:        "h-8 px-3 py-1.5 text-xs",
        lg:        "h-12 px-7 py-3 text-base",
        icon:      "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
