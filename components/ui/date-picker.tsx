"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import "react-day-picker/dist/style.css"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ date, onDateChange, placeholder = "Pick a date", className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal cursor-pointer",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <style dangerouslySetInnerHTML={{ __html: `
          .rdp {
            --rdp-cell-size: 44px;
            --rdp-accent-color: hsl(var(--foreground));
            --rdp-background-color: hsl(var(--background));
            margin: 0;
            font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
          }
          .rdp-button_reset {
            font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
          }
          .rdp-month {
            margin: 0;
          }
          .rdp-caption {
            font-size: 0.875rem;
            font-weight: 500;
            padding: 0.25rem 0;
            margin-bottom: 0.5rem;
          }
          .rdp-nav {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .rdp-button_previous,
          .rdp-button_next {
            width: 1.75rem;
            height: 1.75rem;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .rdp-button_previous:hover,
          .rdp-button_next:hover {
            background-color: hsl(var(--accent));
          }
          .rdp-day {
            width: var(--rdp-cell-size);
            height: var(--rdp-cell-size);
            font-size: 0.875rem;
            padding: 0;
            margin: 0.125rem;
          }
          .rdp-day_button {
            width: 100%;
            height: 100%;
            font-size: 0.875rem;
            border-radius: 0 !important;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .rdp-button_previous,
          .rdp-button_next {
            border-radius: 0 !important;
          }
          .rdp-month {
            border-radius: 0 !important;
          }
          .rdp-day_button:hover:not([disabled]) {
            background-color: hsl(var(--accent));
          }
          .rdp-day_selected {
            background-color: hsl(var(--foreground));
            color: hsl(var(--background));
          }
          .rdp-day_selected:hover {
            background-color: hsl(var(--foreground));
            opacity: 0.9;
          }
          .rdp-day_today {
            font-weight: 600;
          }
          .rdp-day_outside {
            color: hsl(var(--muted-foreground));
            opacity: 0.5;
          }
          .rdp-day_disabled {
            color: hsl(var(--muted-foreground));
            opacity: 0.3;
            cursor: not-allowed;
          }
          .rdp-weekday {
            font-size: 0.75rem;
            font-weight: 500;
            color: hsl(var(--muted-foreground));
            padding: 0.5rem 0;
            width: var(--rdp-cell-size);
            margin: 0.125rem;
          }
        ` }} />
        <DayPicker
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          className="text-sm"
        />
      </PopoverContent>
    </Popover>
  )
}

