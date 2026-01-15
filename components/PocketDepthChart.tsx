import React from 'react';
import { MeasurementPoint } from '../types';

interface PocketDepthChartProps {
  values: [number | null, number | null, number | null];
  onChange: (pointIndex: MeasurementPoint, value: number | null) => void;
  isInverted?: boolean; // If true, 0 is at the top (for Buccal/Bottom section)
  singlePoint?: boolean;
  displayPoints?: MeasurementPoint[];
}

const PocketDepthChart: React.FC<PocketDepthChartProps> = ({ values, onChange, isInverted = false, singlePoint = false, displayPoints }) => {
  // Determine points to render: use displayPoints if provided, else fallback to singlePoint logic
  const points: MeasurementPoint[] = displayPoints 
    ? displayPoints 
    : (singlePoint ? [1] : [0, 1, 2]);
  
  // Fixed 13 levels: 0 to 12. 13 and 14 are replaced by input.
  const depthLevels = Array.from({ length: 13 }, (_, i) => i); 

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
          
          {/* Input for manual entry (replacing 13 & 14) */}
          <input 
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={`
               h-[39px] border border-[#ccc] mb-[0.5px] w-full 
               text-center text-[12px] font-bold bg-slate-50 
               focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-none p-0
            `}
            value={values[pointIndex] ?? ''}
            onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                    onChange(pointIndex, null);
                } else {
                    const num = Number(val);
                    if (!isNaN(num)) {
                        onChange(pointIndex, num);
                    }
                }
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()} // Enable interaction with input
          />
        </div>
      ))}
    </div>
  );
};

export default React.memo(PocketDepthChart);