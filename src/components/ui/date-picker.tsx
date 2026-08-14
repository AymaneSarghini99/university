import * as React from "react";
import { format, isValid, parse, isAfter, isBefore } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MIN_DATE = new Date(1995, 0, 1);
const MAX_DATE = new Date(2035, 11, 31);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = Array.from({ length: 2035 - 1995 + 1 }, (_, i) => String(1995 + i));

function getInitialMonth(value?: Date | { from: Date; to: Date }, mode: "single" | "range" = "single") {
  if (mode === "range" && value && "from" in value) return value.from.getMonth();
  if (mode === "single" && value && !("from" in value)) return (value as Date).getMonth();
  return new Date().getMonth();
}

function getInitialYear(value?: Date | { from: Date; to: Date }, mode: "single" | "range" = "single") {
  if (mode === "range" && value && "from" in value) return value.from.getFullYear();
  if (mode === "single" && value && !("from" in value)) return (value as Date).getFullYear();
  return new Date().getFullYear();
}

type DatePickerPanelProps = {
  value?: Date | { from: Date; to: Date };
  onChange: (date?: Date | { from: Date; to: Date }) => void;
  mode?: "single" | "range";
  disabled?: boolean;
  onValidationError?: (message: string | null) => void;
};

export function DatePickerPanel({
  value,
  onChange,
  mode = "single",
  disabled = false,
  onValidationError,
}: DatePickerPanelProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => getInitialMonth(value, mode));
  const [currentYear, setCurrentYear] = React.useState(() => getInitialYear(value, mode));

  React.useEffect(() => {
    setCurrentMonth(getInitialMonth(value, mode));
    setCurrentYear(getInitialYear(value, mode));
  }, [value, mode]);

  const reportError = (message: string) => {
    onValidationError?.(message);
    setTimeout(() => onValidationError?.(null), 3000);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }

    let next = date;
    if (isBefore(next, MIN_DATE)) {
      next = MIN_DATE;
      reportError("Date cannot be before January 1, 1995");
    } else if (isAfter(next, MAX_DATE)) {
      next = MAX_DATE;
      reportError("Date cannot be after December 31, 2035");
    }

    onChange(next);
  };

  const handleRangeSelect = (range: { from?: Date; to?: Date }) => {
    if (!range.from) {
      onChange(undefined);
      return;
    }

    let from = range.from;
    let to = range.to;

    if (isBefore(from, MIN_DATE)) {
      from = MIN_DATE;
      reportError("Start date cannot be before January 1, 1995");
    }

    if (to && isAfter(to, MAX_DATE)) {
      to = MAX_DATE;
      reportError("End date cannot be after December 31, 2035");
    }

    onChange({ from, to: to || from });
  };

  return (
    <div className="p-1">
      <div className="mb-2 flex items-center justify-between px-1">
        <Select
          value={MONTHS[currentMonth]}
          onValueChange={(month) => {
            const monthIndex = MONTHS.findIndex((item) => item === month);
            if (monthIndex >= 0) setCurrentMonth(monthIndex);
          }}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentYear.toString()} onValueChange={(year) => setCurrentYear(parseInt(year))}>
          <SelectTrigger className="h-8 w-[80px] text-xs">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Calendar
        mode={mode}
        selected={value}
        onSelect={mode === "single" ? handleCalendarSelect : handleRangeSelect}
        month={new Date(currentYear, currentMonth)}
        onMonthChange={(date) => {
          setCurrentMonth(date.getMonth());
          setCurrentYear(date.getFullYear());
        }}
        initialFocus
        disabled={disabled}
        fromDate={MIN_DATE}
        toDate={MAX_DATE}
      />
    </div>
  );
}

interface DatePickerProps {
  value?: Date | { from: Date; to: Date };
  onChange: (date?: Date | { from: Date; to: Date }) => void;
  onTextChange?: (text: string) => void;
  inputValue?: string;
  placeholder?: string;
  disabled?: boolean;
  showTextInput?: boolean;
  dateFormat?: string;
  className?: string;
  mode?: "single" | "range";
  error?: string;
}

export function DatePicker({
  value,
  onChange,
  onTextChange,
  inputValue,
  placeholder = "YYYY-MM-DD",
  disabled = false,
  showTextInput = true,
  dateFormat = "yyyy-MM-dd",
  className,
  mode = "single",
  error,
}: DatePickerProps) {
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      if (onTextChange) onTextChange("");
      return;
    }

    let next = date;
    if (isBefore(next, MIN_DATE)) {
      next = MIN_DATE;
      setValidationError("Date cannot be before January 1, 1995");
      setTimeout(() => setValidationError(null), 3000);
    } else if (isAfter(next, MAX_DATE)) {
      next = MAX_DATE;
      setValidationError("Date cannot be after December 31, 2035");
      setTimeout(() => setValidationError(null), 3000);
    }

    onChange(next);
    if (onTextChange) onTextChange(format(next, dateFormat));
  };

  const handleRangeSelect = (range: { from?: Date; to?: Date }) => {
    if (!range.from) {
      onChange(undefined);
      if (onTextChange) onTextChange("");
      return;
    }

    let { from, to } = range;

    if (from && isBefore(from, MIN_DATE)) {
      from = MIN_DATE;
      setValidationError("Start date cannot be before January 1, 1995");
      setTimeout(() => setValidationError(null), 3000);
    }

    if (to && isAfter(to, MAX_DATE)) {
      to = MAX_DATE;
      setValidationError("End date cannot be after December 31, 2035");
      setTimeout(() => setValidationError(null), 3000);
    }

    onChange({ from, to: to || from });

    if (onTextChange && from) {
      if (to && to !== from) {
        onTextChange(`${format(from, dateFormat)} - ${format(to, dateFormat)}`);
      } else {
        onTextChange(format(from, dateFormat));
      }
    }
  };

  return (
    <div className="flex w-full flex-col">
      <div className={cn("flex w-full gap-2", className)}>
        {showTextInput ? (
          <div className="flex-1">
            <Input
              placeholder={placeholder}
              value={inputValue || ""}
              onChange={(e) => {
                const next = e.target.value.replace(/[^0-9-]/g, "");
                if (onTextChange) onTextChange(next);
              }}
              disabled={disabled}
              className={error || validationError ? "border-red-500" : ""}
            />
          </div>
        ) : null}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size={showTextInput ? "icon" : "default"}
              className={cn(
                showTextInput ? "h-10 w-10" : "flex w-full justify-between pl-3 text-left font-normal",
                error || validationError ? "border-red-500" : "",
              )}
              disabled={disabled}
            >
              {!showTextInput && mode === "single" && value && !("from" in value) ? (
                <>
                  <span>{format(value as Date, dateFormat)}</span>
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                </>
              ) : !showTextInput && mode === "range" && value && "from" in value ? (
                <>
                  <span>
                    {format(value.from, dateFormat)}
                    {value.to && value.to !== value.from && ` - ${format(value.to, dateFormat)}`}
                  </span>
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                </>
              ) : !showTextInput && !value ? (
                <>
                  <span className="text-muted-foreground">{placeholder}</span>
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                </>
              ) : (
                <CalendarIcon className="h-4 w-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3">
              <DatePickerPanel
                value={value}
                onChange={mode === "single" ? handleCalendarSelect : handleRangeSelect}
                mode={mode}
                disabled={disabled}
                onValidationError={setValidationError}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {error || validationError ? (
        <p className="mt-1 text-sm text-red-500">{error || validationError}</p>
      ) : null}
    </div>
  );
}

export function parseDateInputText(
  text: string,
  dateFormat = "yyyy-MM-dd",
): Date | undefined {
  if (!text.trim()) return undefined;
  const parsed = parse(text, dateFormat, new Date());
  return isValid(parsed) ? parsed : undefined;
}
