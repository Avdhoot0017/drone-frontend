'use client';

import * as React from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
  month?: number; // 0-11
  year?: number;
  filterType: 'range' | 'month' | 'year' | 'all';
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  minYear?: number;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function DateRangeFilter({
  value,
  onChange,
  minYear = 2015,
  className,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'range' | 'month' | 'year'>('month');
  const [tempStartDate, setTempStartDate] = React.useState<string>('');
  const [tempEndDate, setTempEndDate] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<number>(value.year || new Date().getFullYear());
  const [yearPageStart, setYearPageStart] = React.useState(Math.floor((value.year || new Date().getFullYear()) / 12) * 12);

  const currentYear = new Date().getFullYear();

  // Format display label
  const getDisplayLabel = () => {
    if (value.filterType === 'all') return 'All Time';
    if (value.filterType === 'year' && value.year) return `Year ${value.year}`;
    if (value.filterType === 'month' && value.month !== undefined && value.year) {
      return `${SHORT_MONTHS[value.month]} ${value.year}`;
    }
    if (value.filterType === 'range' && value.startDate && value.endDate) {
      const formatDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      return `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`;
    }
    return 'Select Period';
  };

  const handleApplyRange = () => {
    if (tempStartDate && tempEndDate) {
      onChange({
        filterType: 'range',
        startDate: new Date(tempStartDate),
        endDate: new Date(tempEndDate),
      });
      setIsOpen(false);
    }
  };

  const handleSelectMonth = (month: number) => {
    onChange({
      filterType: 'month',
      month,
      year: selectedYear,
    });
    setIsOpen(false);
  };

  const handleSelectYear = (year: number) => {
    if (activeTab === 'year') {
      onChange({
        filterType: 'year',
        year,
      });
      setIsOpen(false);
    } else {
      setSelectedYear(year);
    }
  };

  const handleClear = () => {
    onChange({ filterType: 'all' });
    setTempStartDate('');
    setTempEndDate('');
    setSelectedYear(currentYear);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all",
            "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-200",
            value.filterType !== 'all'
              ? "bg-red-50 text-red-700 border-red-300 shadow-sm hover:bg-red-100"
              : "bg-white text-gray-700 border-gray-300 hover:border-red-200 hover:bg-red-50/50",
            className
          )}
        >
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{getDisplayLabel()}</span>
          {value.filterType !== 'all' && (
            <X
              className="h-4 w-4 ml-1 flex-shrink-0 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[360px] p-0 shadow-2xl border border-gray-200 rounded-xl overflow-hidden bg-white"
        align="end"
        sideOffset={8}
      >
        {/* Pure white background container */}
        <div className="bg-white">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">
              Filter by Date
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Select a time period to filter data
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 p-1.5 mx-4 mt-4 rounded-xl">
            {(['month', 'year', 'range'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all duration-200",
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {tab === 'range' ? 'Date Range' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-5 bg-white">
            {/* Month Tab */}
            {activeTab === 'month' && (
              <div className="space-y-4">
                {/* Year Selector */}
                <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
                  <button
                    className="p-1.5 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-30"
                    onClick={() => setSelectedYear(Math.max(minYear, selectedYear - 1))}
                    disabled={selectedYear <= minYear}
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <span className="font-semibold text-gray-900">{selectedYear}</span>
                  <button
                    className="p-1.5 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-30"
                    onClick={() => setSelectedYear(Math.min(currentYear, selectedYear + 1))}
                    disabled={selectedYear >= currentYear}
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                </div>

                {/* Months Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((month, idx) => {
                    const isSelected = value.filterType === 'month' && value.month === idx && value.year === selectedYear;
                    const isFuture = selectedYear === currentYear && idx > new Date().getMonth();
                    return (
                      <button
                        key={month}
                        onClick={() => !isFuture && handleSelectMonth(idx)}
                        disabled={isFuture}
                        className={cn(
                          "relative py-3 px-2 text-sm rounded-lg transition-all duration-200",
                          "border-2 font-medium",
                          isSelected
                            ? "bg-red-50 text-red-700 border-red-400 shadow-sm"
                            : isFuture
                            ? "text-gray-300 cursor-not-allowed border-gray-100 bg-gray-50"
                            : "text-gray-700 border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/50"
                        )}
                      >
                        {SHORT_MONTHS[idx]}
                        {isSelected && (
                          <Check className="absolute top-1 right-1 h-3.5 w-3.5 text-red-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Year Tab */}
            {activeTab === 'year' && (
              <div className="space-y-4">
                {/* Year Page Navigation */}
                <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
                  <button
                    className="p-1.5 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-30"
                    onClick={() => setYearPageStart(Math.max(minYear, yearPageStart - 12))}
                    disabled={yearPageStart <= minYear}
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                    {yearPageStart} - {Math.min(yearPageStart + 11, currentYear)}
                  </span>
                  <button
                    className="p-1.5 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-30"
                    onClick={() => setYearPageStart(yearPageStart + 12)}
                    disabled={yearPageStart + 12 > currentYear}
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                </div>

                {/* Years Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }, (_, i) => yearPageStart + i)
                    .filter(year => year >= minYear && year <= currentYear)
                    .map((year) => {
                      const isSelected = value.filterType === 'year' && value.year === year;
                      return (
                        <button
                          key={year}
                          onClick={() => handleSelectYear(year)}
                          className={cn(
                            "relative py-3 px-2 text-sm rounded-lg transition-all duration-200",
                            "border-2 font-medium",
                            isSelected
                              ? "bg-red-50 text-red-700 border-red-400 shadow-sm"
                              : "text-gray-700 border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/50"
                          )}
                        >
                          {year}
                          {isSelected && (
                            <Check className="absolute top-1 right-1 h-3.5 w-3.5" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Date Range Tab */}
            {activeTab === 'range' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      max={tempEndDate || new Date().toISOString().split('T')[0]}
                      min={`${minYear}-01-01`}
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-red-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      min={tempStartDate || `${minYear}-01-01`}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-red-400 transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={handleApplyRange}
                  disabled={!tempStartDate || !tempEndDate}
                  className={cn(
                    "w-full py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-200",
                    tempStartDate && tempEndDate
                      ? "bg-red-50 text-red-700 border-2 border-red-400 hover:bg-red-100 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                  )}
                >
                  Apply Date Range
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              onClick={handleClear}
              className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors"
            >
              Clear Filter
            </button>
            {value.filterType !== 'all' && (
              <span className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-1.5 rounded-md border border-red-200">
                {getDisplayLabel()}
              </span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
