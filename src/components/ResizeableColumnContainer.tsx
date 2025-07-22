"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

// Wrapper component that adds collapsible and resizable functionality
const ResizeableColumnContainer = ({ 
  children, 
  title, 
  defaultHeight = 300, 
  minHeight = 50, 
  maxHeight = 800, 
  collapseThreshold = 40  // New prop to customize collapse threshold
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [height, setHeight] = useState(defaultHeight);
  const [isDragging, setIsDragging] = useState(false);
  const componentRef = useRef(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const rafRef = useRef(null);

  // Remember previous height when collapsing
  const prevHeightRef = useRef(defaultHeight);

  // Update the toggle function to remember height
  const toggleCollapse = () => {
    if (!isCollapsed) {
      // Save current height before collapsing
      prevHeightRef.current = height;
    } else {
      // Restore previous height when expanding
      setHeight(prevHeightRef.current);
    }
    setIsCollapsed(!isCollapsed);
  };

  // Ensure the handle is visible even when collapsed during dragging
  const handleMouseDown = (e: { clientY: number; preventDefault: () => void; }) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection during resize
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: { clientY: number; }) => {
      console.log("Brandon handleMouseUp")
      if (!isDragging) return;
      
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Schedule a new animation frame
      rafRef.current = requestAnimationFrame(() => {
        const deltaY = e.clientY - startYRef.current;
        let newHeight = startHeightRef.current + deltaY;
        
        // Check if we should collapse
        if (!isCollapsed && newHeight < minHeight - collapseThreshold) {
          // Save the height before collapsing
          prevHeightRef.current = Math.max(startHeightRef.current, minHeight + collapseThreshold + 5);
          setIsCollapsed(true);
          // We don't end dragging here, allowing user to continue to drag and possibly uncollapse
        } 
        // Check if we should uncollapse by dragging back up
        else if (isCollapsed && deltaY < -collapseThreshold * 2) {
          setIsCollapsed(false);
          // Set height to previous height, but ensure it's not too small
          setHeight(prevHeightRef.current);
        }
        else if (!isCollapsed) {
          // Normal resizing behavior when not collapsed
          newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
          setHeight(newHeight);
        }
      });
    };

  // We don't need the mouseup collapse check anymore since we do it during drag
  const handleMouseUp = () => {
    console.log("Brandon handleMouseUp")
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minHeight, maxHeight, collapseThreshold, isCollapsed]);

  return (
    <div className="flex flex-col border rounded shadow-sm bg-white">
      {/* Header with title and collapse button */}
      <div className="flex justify-between items-center p-3 border-b bg-gray-50 cursor-pointer" onClick={toggleCollapse}>
        <h3 className="font-medium">{title}</h3>
        <button className="p-1 hover:bg-gray-200 rounded-full">
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* Content area with adjustable height */}
      <div 
        ref={componentRef}
        className="overflow-auto"
        style={{ 
          height: isCollapsed ? 0 : `${height}px`,
          opacity: isCollapsed ? 0 : 1,
          visibility: isCollapsed ? 'hidden' : 'visible',
          transition: isDragging ? 'none' : 'all 300ms ease-in-out'
        }}
      >
        <div className="p-4">
          {children}
        </div>
      </div>

      {/* Resize handle - always visible during dragging, otherwise only when not collapsed */}
      {(!isCollapsed || isDragging) && (
        <div 
          className="h-2 bg-gray-100 hover:bg-gray-200 cursor-ns-resize flex justify-center items-center"
          onMouseDown={handleMouseDown}
        >
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>
      )}
    </div>
  );
};

export default ResizeableColumnContainer;