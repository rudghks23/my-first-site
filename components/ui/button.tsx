"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "outline" | "ghost"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, size = "md", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-28 p-1.5 text-sm",
      md: "w-32 p-2 text-base",
      lg: "w-36 p-2.5 text-lg"
    }

    if (variant === "ghost") {
      return (
        <button
          ref={ref}
          className={cn(
            "cursor-pointer rounded-md bg-transparent text-center font-medium transition-all hover:bg-accent hover:text-accent-foreground",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {children}
        </button>
      )
    }

    if (variant === "outline") {
      return (
        <button
          ref={ref}
          className={cn(
            "relative cursor-pointer overflow-hidden rounded-full border-2 border-primary bg-background text-center font-semibold transition-all hover:text-primary-foreground",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <span className="relative z-10">{children}</span>
          <div className="absolute left-[50%] top-[50%] h-0 w-0 translate-x-[-50%] translate-y-[-50%] rounded-full bg-primary transition-all duration-300 hover:h-[200%] hover:w-[200%]"></div>
        </button>
      )
    }

    // Default variant with interactive hover effect
    return (
      <button
        ref={ref}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-full border bg-background text-center font-semibold",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span className="inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
        <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
          <span>{children}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="absolute left-[20%] top-[40%] h-2 w-2 scale-[0] rounded-lg bg-primary transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8] group-hover:bg-primary"></div>
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
