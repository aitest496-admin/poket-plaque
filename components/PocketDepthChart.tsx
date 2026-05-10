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

  // Fixed 9 levels: 1 to 9.
  const depthLevels = Array.from({ length: 9 }, (_, i) => i + 1);

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

  // Dynamic sizes based on method
  const isLarge = !singlePoint;
  const inputHeight = isLarge ? 'h-[46px]' : 'h-[39px]';
  const cellHeight = isLarge ? 'h-[25px]' : 'h-[19px]';
  const inputTextSize = isLarge ? 'text-[20px]' : 'text-[14px]';
  const cellTextSize = isLarge ? 'text-[16px]' : 'text-[10px]';

  return (
    <div className="flex justify-between px-[2px] w-full bg-white touch-none relative">
      {points.map((pointIndex) => (
        <div
          key={pointIndex}
          className={`flex flex-1 mx-[1px] ${isInverted ? 'flex-col' : 'flex-col-reverse'}`}
        >
          {/* Input for manual entry (Placed closest to Tooth ID) */}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={`
               ${inputHeight} border border-[#ccc] mb-[0.5px] w-full 
               text-center ${inputTextSize} font-bold bg-slate-50 
               focus:bg-blue-600 focus:text-white focus:outline-none focus:border-blue-700 rounded-none p-0
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
                  ${cellHeight} border border-[#ccc] mb-[0.5px]
                  flex items-center justify-center ${cellTextSize} cursor-pointer select-none
                  ${getBgClass(level)}
                  ${isSelected ? '!bg-blue-600 !text-white relative z-10 font-bold border-blue-800' : ''}
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