"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border text-sm font-semibold transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:translate-y-px after:pointer-events-none after:absolute after:inset-x-1 after:top-1 after:h-1/2 after:rounded-xl after:bg-white/25 after:content-['']",
  {
    variants: {
      variant: {
        default:
          "border-blue-300/85 bg-gradient-to-b from-[#56A8FF] to-[#2F78E8] text-white shadow-[0_14px_22px_rgba(66,133,244,0.36),0_1px_0_rgba(255,255,255,0.42)_inset,0_-2px_0_rgba(30,92,178,0.45)_inset] hover:brightness-[1.03]",
        outline:
          "border-white/80 bg-gradient-to-br from-slate-50 to-slate-200 text-slate-700 shadow-[8px_8px_14px_rgba(164,179,199,0.3),-5px_-5px_10px_rgba(255,255,255,0.94),1px_1px_0_rgba(255,255,255,0.72)_inset] hover:brightness-[1.02]",
        ghost:
          "border-transparent bg-transparent text-foreground after:hidden hover:bg-slate-100/70",
        destructive:
          "border-red-300/85 bg-gradient-to-b from-[#FF7A74] to-[#EE5652] text-white shadow-[0_14px_22px_rgba(241,106,102,0.34),0_1px_0_rgba(255,225,224,0.5)_inset,0_-2px_0_rgba(176,53,49,0.45)_inset] hover:brightness-[1.03]"
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-10 px-4",
        lg: "h-12 px-8"
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
