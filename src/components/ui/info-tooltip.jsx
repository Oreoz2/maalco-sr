import React from 'react';
import { Info } from 'lucide-react';
import { Button } from './button.jsx';

const InfoTooltip = ({ title, description, calculation }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      >
        <Info className="h-3 w-3" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 left-0 top-6 w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
            <p className="text-xs text-gray-600">{description}</p>
            {calculation && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded">
                  {calculation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;