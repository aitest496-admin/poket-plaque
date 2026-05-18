import React from 'react';

interface FurcationInputProps {
  values: (string | null)[];
  onChange: (index: number, newValue: string | null) => void;
  variant: 'single' | 'horizontal' | 'vertical' | 'y-shape';
  disabled?: boolean;
  height?: string;
}

const cycleValue = (current: string | null): string | null => {
  if (!current) return 'Ⅰ';
  if (current === 'Ⅰ') return 'Ⅱ';
  if (current === 'Ⅱ') return 'Ⅲ';
  return null;
};

// Color mapping for premium look
const getFillColor = (val: string | null): string => {
  if (val === 'Ⅰ') return '#fef9c3'; // Light yellow (bg-amber-100 equivalent)
  if (val === 'Ⅱ') return '#ffedd5'; // Light orange (bg-orange-100 equivalent)
  if (val === 'Ⅲ') return '#fee2e2'; // Light red (bg-red-100 equivalent)
  return '#ffffff'; // White
};

export const FurcationInput: React.FC<FurcationInputProps> = ({
  values,
  onChange,
  variant,
  disabled = false,
  height = 'h-[40px]'
}) => {
  const handleClick = (index: number) => {
    if (disabled) return;
    const currentVal = values[index] || null;
    const newVal = cycleValue(currentVal);
    onChange(index, newVal);
  };

  const strokeColor = '#999999';

  if (variant === 'y-shape') {
    // Upper Molars - Y-shaped division (3 regions)
    // Centroids:
    // Left: (17.5, 25)
    // Right: (52.5, 25)
    // Top: (35, 8)
    return (
      <div className={`w-full ${height} bg-white select-none`}>
        <svg
          viewBox="0 0 70 40"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Top-Left Polygon */}
          <polygon
            points="0,0 35,20 35,40 0,40"
            fill={getFillColor(values[0])}
            stroke={strokeColor}
            strokeWidth="1"
            onClick={() => handleClick(0)}
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90 transition-opacity'}
          />
          {/* Top-Right Polygon */}
          <polygon
            points="70,0 35,20 35,40 70,40"
            fill={getFillColor(values[1])}
            stroke={strokeColor}
            strokeWidth="1"
            onClick={() => handleClick(1)}
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90 transition-opacity'}
          />
          {/* Top-Center/Middle Polygon */}
          <polygon
            points="0,0 35,20 70,0"
            fill={getFillColor(values[2])}
            stroke={strokeColor}
            strokeWidth="1"
            onClick={() => handleClick(2)}
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90 transition-opacity'}
          />

          {/* Text labels for values */}
          {values[0] && (
            <text
              x="17.5"
              y="25"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold text-[13px] fill-slate-800 pointer-events-none select-none"
            >
              {values[0]}
            </text>
          )}
          {values[1] && (
            <text
              x="52.5"
              y="25"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold text-[13px] fill-slate-800 pointer-events-none select-none"
            >
              {values[1]}
            </text>
          )}
          {values[2] && (
            <text
              x="35"
              y="8"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold text-[13px] fill-slate-800 pointer-events-none select-none"
            >
              {values[2]}
            </text>
          )}
        </svg>
      </div>
    );
  }

  if (variant === 'horizontal') {
    // Lower Molars - Horizontal division (2 regions)
    // Centroids:
    // Top half: (35, 10)
    // Bottom half: (35, 30)
    return (
      <div className={`w-full ${height} bg-white select-none`}>
        <svg
          viewBox="0 0 70 40"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Top Half */}
          <rect
            x="0"
            y="0"
            width="70"
            height="20"
            fill={getFillColor(values[0])}
            stroke={strokeColor}
            strokeWidth="1"
            onClick={() => handleClick(0)}
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90 transition-opacity'}
          />
          {/* Bottom Half */}
          <rect
            x="0"
            y="20"
            width="70"
            height="20"
            fill={getFillColor(values[1])}
            stroke={strokeColor}
            strokeWidth="1"
            onClick={() => handleClick(1)}
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90 transition-opacity'}
          />

          {/* Text labels */}
          {values[0] && (
            <text
              x="35"
              y="10"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold text-[13px] fill-slate-800 pointer-events-none select-none"
            >
              {values[0]}
            </text>
          )}
          {values[1] && (
            <text
              x="35"
              y="30"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold text-[13px] fill-slate-800 pointer-events-none select-none"
            >
              {values[1]}
            </text>
          )}
        </svg>
      </div>
    );
  }

  if (variant === 'vertical') {
    // Upper Premolars 4 & 5 - Vertical division (2 regions: Left & Right)
    // Centroids:
    // Left half: (17.5, 20)
    // Right half: (52.5, 20)
    return (
      <div className={`w-full ${height} bg-white select-none`}>
        <svg
          viewBox="0 0 70 40"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Left Half */}
          <rect
            x="0"
            y="0"
            width="35"
            height="40"
            fill={getFillColor(values[0])}
            stroke={strokeColor}
            strokeWidth="1"
            onClick={() => handleClick(0)}
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90 transition-opacity'}
          />
          {/* Right Half */}
          <rect
            x="35"
            y="0"
            width="35"
            height="40"
            fill={getFillColor(values[1])}
            stroke={strokeColor}
            strokeWidth="1"
            onClick={() => handleClick(1)}
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90 transition-opacity'}
          />

          {/* Text labels */}
          {values[0] && (
            <text
              x="17.5"
              y="20"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold text-[13px] fill-slate-800 pointer-events-none select-none"
            >
              {values[0]}
            </text>
          )}
          {values[1] && (
            <text
              x="52.5"
              y="20"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold text-[13px] fill-slate-800 pointer-events-none select-none"
            >
              {values[1]}
            </text>
          )}
        </svg>
      </div>
    );
  }

  // Single cell (Default - other teeth)
  // Centroid: (35, 20)
  return (
    <div className={`w-full ${height} bg-white select-none`}>
      <svg
        viewBox="0 0 70 40"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <rect
          x="0"
          y="0"
          width="70"
          height="40"
          fill={getFillColor(values[0])}
          stroke={strokeColor}
          strokeWidth="1"
          onClick={() => handleClick(0)}
          className={disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90 transition-opacity'}
        />
        {values[0] && (
          <text
            x="35"
            y="20"
            textAnchor="middle"
            dominantBaseline="central"
            className="font-bold text-[13px] fill-slate-800 pointer-events-none select-none"
          >
            {values[0]}
          </text>
        )}
      </svg>
    </div>
  );
};
