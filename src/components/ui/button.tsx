import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-body font-medium ring-offset-background transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:duration-instant [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-1 hover:bg-primary/90 hover:shadow-2",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-background hover:bg-secondary/60",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // `hover:bg-accent` here was shadcn's original template default,
        // written when --accent meant a neutral gray hover tint. §2.1's
        // token overhaul repurposed --accent/bg-accent to mean the gold
        // premium color (StatusBadge's `pro` tone, streak celebration) —
        // left as-is, EVERY ghost button app-wide (every back button
        // included) would hover/press gold, which is exactly the
        // "golden button" bug this fixes. Matches the sidebar's own
        // neutral hover treatment (sidebar-nav.tsx's collapse toggle:
        // hover:bg-secondary hover:text-foreground) rather than inventing
        // a new neutral.
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-body-sm",
        lg: "h-12 rounded-sm px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
