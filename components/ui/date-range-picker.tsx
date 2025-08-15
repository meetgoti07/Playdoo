import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface DatePickerWithRangeProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({ date, setDate }: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">From</label>
              <Input
                type="date"
                value={date?.from ? format(date.from, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : undefined;
                  setDate({ from: newDate, to: date?.to });
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">To</label>
              <Input
                type="date"
                value={date?.to ? format(date.to, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : undefined;
                  setDate({ from: date?.from, to: newDate });
                }}
              />
            </div>
          </div>
          <Button onClick={() => setIsOpen(false)} className="w-full">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
