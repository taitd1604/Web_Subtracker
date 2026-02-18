import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-[4px_4px_8px_rgba(173,188,209,0.25),-3px_-3px_6px_rgba(255,255,255,0.9)] transition-colors",
  {
    variants: {
      variant: {
        default: "border-blue-200 bg-gradient-to-b from-blue-50 to-blue-100 text-blue-700",
        outline:
          "border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 text-foreground",
        destructive:
          "border-red-200 bg-gradient-to-b from-red-50 to-red-100 text-red-700",
        success:
          "border-emerald-200 bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-700",
        warning:
          "border-amber-200 bg-gradient-to-b from-amber-50 to-amber-100 text-amber-700"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
