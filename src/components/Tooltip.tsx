/**
 * Tooltip Component
 *
 * Simple hover tooltip for displaying help text.
 */

import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

interface HelpIconProps {
  tooltip: string;
}

export function HelpIcon({ tooltip }: HelpIconProps) {
  return (
    <Tooltip content={tooltip}>
      <span className="inline-flex items-center justify-center w-4 h-4 ml-1 text-xs text-gray-400 border border-gray-500 rounded-full cursor-help hover:text-gray-300 hover:border-gray-400">
        ?
      </span>
    </Tooltip>
  );
}
