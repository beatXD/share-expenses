'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
}

// Helper function to format date as DD/MM/YYYY
const formatDateToDDMMYYYY = (date: Date | undefined): string => {
  if (!date) return '';
  return format(date, 'dd/MM/yyyy');
};

// Helper function to convert string to Date
const stringToDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  try {
    return parseISO(dateString);
  } catch {
    return undefined;
  }
};

// Helper function to convert Date to ISO string
const dateToString = (date: Date | undefined): string => {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
};

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
}: DateRangePickerProps) {
  const [startOpen, setStartOpen] = React.useState(false);
  const [endOpen, setEndOpen] = React.useState(false);

  const startDate = stringToDate(dateRange.startDate);
  const endDate = stringToDate(dateRange.endDate);

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateRangeChange({
        ...dateRange,
        startDate: dateToString(date),
      });
      setStartOpen(false);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateRangeChange({
        ...dateRange,
        endDate: dateToString(date),
      });
      setEndOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Date Range Picker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 thai-text">
            📅 วันที่เริ่มต้น
          </Label>
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate
                  ? formatDateToDDMMYYYY(startDate)
                  : 'เลือกวันที่เริ่มต้น'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                captionLayout="dropdown"
                locale={th}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 thai-text">
            📅 วันที่สิ้นสุด
          </Label>
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-10 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? formatDateToDDMMYYYY(endDate) : 'เลือกวันที่สิ้นสุด'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                captionLayout="dropdown"
                locale={th}
                disabled={date => (startDate ? date < startDate : false)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
