"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-2xl text-sm font-semibold transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "border border-blue-300/70 bg-primary text-primary-foreground shadow-[6px_6px_14px_rgba(59,130,246,0.28),-4px_-4px_12px_rgba(255,255,255,0.85)] hover:brightness-95",
        outline:
          "border border-white/75 bg-slate-100/80 text-foreground shadow-[6px_6px_14px_rgba(148,163,184,0.24),-4px_-4px_10px_rgba(255,255,255,0.9)] hover:bg-slate-100",
        ghost:
          "border border-transparent bg-transparent text-foreground hover:bg-slate-100/70",
        destructive:
          "border border-red-300 bg-destructive text-destructive-foreground shadow-[6px_6px_14px_rgba(248,113,113,0.25),-4px_-4px_10px_rgba(255,255,255,0.85)] hover:brightness-95"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-10 px-3.5",
        lg: "h-11 px-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
