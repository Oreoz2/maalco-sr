import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from './button.jsx';
import { Card, CardContent } from './card.jsx';

const DateRangePicker = ({ onDateRangeChange, selectedPeriod }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Handle date range submission
  const handleApplyRange = () => {
    if (startDate && endDate) {
      // Format: custom:startDate:endDate (matching database format)
      const customRange = `custom:${startDate}:${endDate}`;
      onDateRangeChange(customRange);
      setIsOpen(false);
    }
  };

  // Handle clear/reset
  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onDateRangeChange('30d'); // Reset to default
    setIsOpen(false);
  };

  // Get display text for custom ranges
  const getDisplayText = () => {
    if (selectedPeriod?.startsWith('custom:')) {
      const [, start, end] = selectedPeriod.split(':');
      return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
    }
    return 'Custom Range';
  };

  return (
    <div className="relative">
      <Button
        variant={selectedPeriod?.startsWith('custom:') ? "default" : "ghost"}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-6 py-2 rounded-md transition-all duration-200 ${
          selectedPeriod?.startsWith('custom:')
            ? 'bg-green-600 text-white shadow-md'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Calendar className="w-4 h-4 mr-2" />
        {getDisplayText()}
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 left-0 z-50 w-80 shadow-lg border border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Select Date Range
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="text-gray-600"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleApplyRange}
                  disabled={!startDate || !endDate}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Apply Range
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DateRangePicker;