import React from 'react';
import { MeasurementPoint } from '../types';

interface ThreePointToggleProps {
  values: [boolean, boolean, boolean];
  onChange: (pointIndex: MeasurementPoint, value: boolean) => void;
  type: 'pus' | 'bleeding';
}

const ThreePointToggle: React.FC<ThreePointToggleProps> = ({ values, onChange, type }) => {
  // PoC Colors: Pus = #808080 (Grey), Bleeding = #ff4d4d (Red)
  const activeClass = type === 'pus' ? '!bg-[#808080] text-white' : '!bg-[#ff4d4d] text-white';
  
  const handlePointerEnter = (e: React.PointerEvent, index: MeasurementPoint, isActive: boolean) => {
    if (e.buttons === 1) {
      // For toggles, dragging usually means "painting" the opposite of what it was,
      // but simplistic toggle on drag is acceptable for this PoC.
      // To improve UX, we check if it's already in the desired state, but simple toggle is requested.
      // Note: Dragging across multiple usually implies setting them all ON or all OFF.
      // Here we just flip it if it's not the same as the current "drag" intent, but simplest is just update.
      // We'll stick to simple update (flip) if the user enters the cell.
      // However, flipping on re-entry is annoying.
      // A safer bet for "tracing" is to set it to true (or toggle once).
      // Let's rely on the parent state update.
       onChange(index, !isActive);
    }
  };

  return (
    <div className="flex h-[24px] border-b border-[#ccc] bg-white w-full text-[9px] touch-none">
      {values.map((isActive, index) => (
        <div
          key={index}
          onPointerDown={(e) => {
             e.currentTarget.releasePointerCapture(e.pointerId);
             onChange(index as MeasurementPoint, !isActive);
          }}
          onPointerEnter={(e) => handlePointerEnter(e, index as MeasurementPoint, isActive)}
          className={`
            flex-1 border-r border-[#ccc] last:border-r-0 
            cursor-pointer flex items-center justify-center font-bold select-none
            ${isActive ? activeClass : ''}
          `}
        >
          {/* Label optional for compactness */}
        </div>
      ))}
    </div>
  );
};

export default ThreePointToggle;