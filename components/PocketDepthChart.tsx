import React from 'react';
import { MeasurementPoint } from '../types';

interface PocketDepthChartProps {
  values: [number | null, number | null, number | null];
  onChange: (pointIndex: MeasurementPoint, value: number) => void;
  isInverted?: boolean; // If true, 0 is at the top (for Buccal/Bottom section)
  singlePoint?: boolean;
  displayPoints?: MeasurementPoint[];
}

const PocketDepthChart: React.FC<PocketDepthChartProps> = ({ values, onChange, isInverted = false, singlePoint = false, displayPoints }) => {
  // Determine points to render: use displayPoints if provided, else fallback to singlePoint logic
  const points: MeasurementPoint[] = displayPoints 
    ? displayPoints 
    : (singlePoint ? [1] : [0, 1, 2]);
  
  // Fixed 15 levels: 0 to 14
  const depthLevels = Array.from({ length: 15 }, (_, i) => i); 

  const getBgClass = (level: number) => {
    if (level >= 10) return 'bg-[#ff4d4d] text-white'; // Red
    if (level >= 7) return 'bg-[#ffc0cb]'; // Pink
    if (level >= 4) return 'bg-[#ffff00]'; // Yellow
    return 'bg-white';
  };

  const handlePointerEnter = (e: React.PointerEvent, pointIndex: MeasurementPoint, level: number) => {
    // If the primary button (pen/touch/mouse) is pressed, update the value
    if (e.buttons === 1) {
      onChange(pointIndex, level);
    }
  };

  return (
    <div className="flex justify-between px-[2px] w-full bg-white touch-none relative">
      {points.map((pointIndex) => (
        <div 
          key={pointIndex} 
          className={`flex flex-1 mx-[1px] ${isInverted ? 'flex-col' : 'flex-col-reverse'}`}
        >
          {depthLevels.map((level) => {
            const isSelected = values[pointIndex] === level;
            return (
              <div
                key={level}
                onPointerDown={(e) => {
                    e.currentTarget.releasePointerCapture(e.pointerId); // Allow smooth dragging across elements
                    onChange(pointIndex, level);
                }}
                onPointerEnter={(e) => handlePointerEnter(e, pointIndex, level)}
                className={`
                  h-[19px] border border-[#ccc] mb-[0.5px]
                  flex items-center justify-center text-[10px] cursor-pointer select-none
                  ${getBgClass(level)}
                  ${isSelected ? 'border-[2px] border-[#0000ff] relative z-10 font-bold' : ''}
                `}
              >
                {level}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default React.memo(PocketDepthChart);