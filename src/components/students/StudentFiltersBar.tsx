import type { StudentFilters } from "@/types";
import { DEGREE_OPTIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface StudentFiltersBarProps {
  filters: StudentFilters;
  majors: string[];
  intakes: string[];
  onChange: (next: Partial<StudentFilters>) => void;
}

export function StudentFiltersBar({
  filters,
  majors,
  intakes,
  onChange,
}: StudentFiltersBarProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border/60 bg-white p-4 shadow-sm md:grid-cols-4">
      <div className="relative md:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Search students..."
          className="pl-9"
        />
      </div>

      <Select value={filters.degree} onValueChange={(value) => onChange({ degree: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Degree" />
        </SelectTrigger>
        <SelectContent>
          {DEGREE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.major} onValueChange={(value) => onChange({ major: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Major" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All majors</SelectItem>
          {majors.map((major) => (
            <SelectItem key={major} value={major}>
              {major}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.intake} onValueChange={(value) => onChange({ intake: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Intake" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All intakes</SelectItem>
          {intakes.map((intake) => (
            <SelectItem key={intake} value={intake}>
              {intake}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
