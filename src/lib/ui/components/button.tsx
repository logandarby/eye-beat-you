import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/ui/utils/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive btn-pill",
  {
    variants: {
      variant: {
        default:
          "bg-brand-orange-dark text-brand-cream shadow-lg hover:bg-brand-orange hover:scale-105 btn-bounce",
        destructive:
          "bg-destructive text-white shadow-lg hover:bg-destructive/90 hover:scale-105 btn-pulse focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-2 border-brand-orange-dark bg-brand-cream text-brand-orange-dark shadow-lg hover:bg-brand-orange-dark hover:text-brand-cream hover:scale-105 btn-pulse",
        secondary:
          "bg-brand-cream text-brand-orange-dark shadow-lg hover:bg-brand-orange hover:text-brand-cream hover:scale-105 btn-bounce",
        ghost:
          "text-brand-orange-dark hover:bg-brand-cream/80 hover:text-brand-orange-dark hover:scale-105 btn-bounce",
        link: "text-brand-orange-dark underline-offset-4 hover:underline hover:text-brand-orange btn-pulse",
      },
      size: {
        default: "h-11 px-6 py-3 has-[>svg]:px-5",
        sm: "h-9 gap-1.5 px-4 py-2 has-[>svg]:px-3",
        lg: "h-13 px-8 py-4 text-base has-[>svg]:px-6",
        icon: "size-11",
      },
      animation: {
        bounce: "btn-bounce",
        pulse: "btn-pulse",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "bounce",
    },
  },
);

function Button({
  className,
  variant,
  size,
  animation,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    animation?: "bounce" | "pulse" | "none";
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, animation, className }),
      )}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
