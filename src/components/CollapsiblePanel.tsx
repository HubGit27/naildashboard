'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapsiblePanelProps {
  children: React.ReactNode;
  className?: string;
}

const CollapsiblePanel = ({ 
  children, 
  className = ''
}: CollapsiblePanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update main content width via CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--main-content-width', 
      isCollapsed ? '100%' : '66.666667%'
    );
  }, [isCollapsed]);

  return (
    <div className="relative flex">
      {/* Toggle button positioned outside of the collapsible area */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`
          absolute top-4 z-10 bg-gray-100 hover:bg-gray-200 
          p-1 rounded-full shadow-md 
          -left-3
        `}
        aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
      
      {/* Collapsible content */}
      <div 
        className={`
          transition-all duration-300 ease-in-out flex-grow
          ${isCollapsed ? 'w-0 max-w-0 overflow-hidden opacity-0' : 'w-full lg:w-1/3 opacity-100'} 
          ${className}
        `}
      >
        <div className="w-full h-full flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsiblePanel;