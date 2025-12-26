import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToggleButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'> {
  value: boolean | undefined
  onValueChange: (value: boolean | undefined) => void
  labels?: {
    all?: string
    active?: string
    inactive?: string
  }
}

const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ className, value, onValueChange, labels, ...props }, ref) => {
    const handleClick = () => {
      if (value === undefined) {
        onValueChange(true)
      } else if (value === true) {
        onValueChange(false)
      } else {
        onValueChange(undefined)
      }
    }

    const getLabel = () => {
      if (value === undefined) {
        return labels?.all || "All"
      } else if (value === true) {
        return labels?.active || "Active"
      } else {
        return labels?.inactive || "Inactive"
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          value === undefined
            ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            : value === true
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-red-500 text-white hover:bg-red-600",
          "h-10 px-4 py-2",
          className
        )}
        {...props}
      >
        {getLabel()}
      </button>
    )
  }
)
ToggleButton.displayName = "ToggleButton"

export { ToggleButton }

