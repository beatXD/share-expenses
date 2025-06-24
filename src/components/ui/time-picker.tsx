'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'เลือกเวลา',
  className,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Parse current time
  const [hours, minutes] = value ? value.split(':') : ['12', '00'];

  // Generate hours (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: hour, label: hour };
  });

  // Generate minutes (00-59, step by 5)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minute = (i * 5).toString().padStart(2, '0');
    return { value: minute, label: minute };
  });

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const timeString = `${newHours}:${newMinutes}`;
    onChange(timeString);
  };

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return placeholder;
    const [h, m] = timeString.split(':');
    return `${h}:${m}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-9 text-sm border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 dark:text-white',
            !value && 'text-muted-foreground dark:text-gray-400',
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          <span className="thai-text">{formatDisplayTime(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        align="start"
      >
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-900 dark:text-white thai-text text-center">
            เลือกเวลา
          </div>

          <div className="flex items-center space-x-2">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-xs text-gray-600 dark:text-gray-400 thai-text mb-1">
                ชั่วโมง
              </div>
              <Select
                value={hours}
                onValueChange={newHours => handleTimeChange(newHours, minutes)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {hourOptions.map(hour => (
                    <SelectItem key={hour.value} value={hour.value}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-lg font-bold text-gray-500 dark:text-gray-400 pt-5">
              :
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-xs text-gray-600 dark:text-gray-400 thai-text mb-1">
                นาที
              </div>
              <Select
                value={minutes}
                onValueChange={newMinutes =>
                  handleTimeChange(hours, newMinutes)
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {minuteOptions.map(minute => (
                    <SelectItem key={minute.value} value={minute.value}>
                      {minute.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick time buttons */}
          <div className="space-y-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 thai-text">
              เวลายอดนิยม
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: '08:00', value: '08:00' },
                { label: '12:00', value: '12:00' },
                { label: '18:00', value: '18:00' },
                { label: '09:00', value: '09:00' },
                { label: '13:00', value: '13:00' },
                { label: '20:00', value: '20:00' },
              ].map(time => (
                <Button
                  key={time.value}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onChange(time.value);
                    setIsOpen(false);
                  }}
                  className="h-7 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700"
                >
                  {time.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Current time button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentTime = format(new Date(), 'HH:mm');
              onChange(currentTime);
              setIsOpen(false);
            }}
            className="h-7 w-full text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            ตอนนี้ ({format(new Date(), 'HH:mm')})
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
