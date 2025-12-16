import React from 'react';
import { Plaque, Surface } from '../types';

interface PlaqueDiagramProps {
  value: Plaque;
  onChange: (surface: Surface, isActive: boolean) => void;
  onToggleAll: () => void;
  maskedSurfaces?: Surface[]; // Surfaces to render but disable interaction and hide active state
}

const PlaqueDiagram: React.FC<PlaqueDiagramProps> = ({ value, onChange, onToggleAll, maskedSurfaces = [] }) => {
  
  const getPathProps = (surface: Surface) => {
    const isMasked = maskedSurfaces.includes(surface);
    const isActive = value[surface];
    const shouldShowActive = isActive && !isMasked;
    
    // Base classes
    const baseClasses = "stroke-black stroke-[1.5] touch-none";
    
    if (isMasked) {
        // Render as 'empty' (white) and non-interactive, but keep the stroke
        return {
            className: `${baseClasses} fill-white opacity-40`, // Slightly dimmed to indicate inactive
        };
    }

    // Interactive state
    return {
        className: `${baseClasses} cursor-pointer ${shouldShowActive ? 'fill-[#ff0000]' : 'fill-white hover:fill-slate-100'}`,
        onPointerDown: (e: React.PointerEvent) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            onChange(surface, !isActive);
        },
        onPointerEnter: (e: React.PointerEvent) => {
            if (e.buttons === 1) {
                onChange(surface, !isActive);
            }
        }
    };
  };

  // Geometry: 
  // ViewBox 0-100. Center 50.
  // We want the inner square to appear approx 18-20px when rendered at ~80px size.
  // 18/80 = 0.225 => ~22 units.
  // Half width = 11.
  // Inner: 50-11=39 to 50+11=61.
  // Outer: 2 to 98 (padding for stroke).
  
  return (
    <div className="h-[86px] w-full flex items-center justify-center bg-white touch-none">
      <svg width="80" height="80" viewBox="0 0 100 100">
        <path d="M2 2 L98 2 L61 39 L39 39 Z" {...getPathProps(Surface.Buccal)} />
        <path d="M98 2 L98 98 L61 61 L61 39 Z" {...getPathProps(Surface.Distal)} />
        <path d="M2 98 L98 98 L61 61 L39 61 Z" {...getPathProps(Surface.Lingual)} />
        <path d="M2 2 L2 98 L39 61 L39 39 Z" {...getPathProps(Surface.Mesial)} />
        <rect 
            x="39" y="39" width="22" height="22" 
            className={`${value.occlusal ? 'fill-[#ff0000]' : 'fill-white hover:fill-slate-100'} stroke-black stroke-[1.5] touch-none cursor-pointer`}
            onPointerDown={(e) => { e.stopPropagation(); onToggleAll(); }}
        />
      </svg>
    </div>
  );
};

export default PlaqueDiagram;