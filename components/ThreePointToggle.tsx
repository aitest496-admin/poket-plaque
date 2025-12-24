import React from 'react';
import { MeasurementPoint } from '../types';

interface ThreePointToggleProps {
  values: [boolean, boolean, boolean];
  onChange: (pointIndex: MeasurementPoint, value: boolean) => void;
  type: 'pus' | 'bleeding';
  singlePoint?: boolean;
  displayPoints?: MeasurementPoint[];
}

const ThreePointToggle: React.FC<ThreePointToggleProps> = ({ values, onChange, type, singlePoint = false, displayPoints }) => {
  // PoC Colors: Pus = #808080 (Grey), Bleeding = #ff4d4d (Red)
  const activeClass = type === 'pus' ? '!bg-[#808080] text-white' : '!bg-[#ff4d4d] text-white';
  
  const handlePointerEnter = (e: React.PointerEvent, index: MeasurementPoint, isActive: boolean) => {
    if (e.buttons === 1) {
       onChange(index, !isActive);
    }
  };

  // Determine points to render
  const pointsToRender: MeasurementPoint[] = displayPoints 
    ? displayPoints 
    : (singlePoint ? [1] : [0, 1, 2]);

  return (
    <div className="flex h-[24px] border-b border-[#ccc] bg-white w-full text-[9px] touch-none">
      {pointsToRender.map((index) => {
        const isActive = values[index];
        return (
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
        );
      })}
    </div>
  );
};

export default React.memo(ThreePointToggle);