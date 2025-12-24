import React from 'react';
import { Plaque, Surface } from '../types';

interface PlaqueDiagramProps {
  value: Plaque;
  onChange: (surface: Surface, isActive: boolean) => void;
  onToggleAll: () => void;
  maskedSurfaces?: Surface[]; // Surfaces to render but disable interaction and hide active state
  variant?: 'standard' | 'simple';
}

const PlaqueDiagram: React.FC<PlaqueDiagramProps> = ({ value, onChange, onToggleAll, maskedSurfaces = [], variant = 'standard' }) => {
  
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

  if (variant === 'simple') {
    return (
        <div className="w-full aspect-square flex items-center justify-center bg-white touch-none p-[1px]">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Top - Buccal */}
            <path d="M0 0 L100 0 L50 50 Z" {...getPathProps(Surface.Buccal)} />
            {/* Bottom - Lingual */}
            <path d="M0 100 L100 100 L50 50 Z" {...getPathProps(Surface.Lingual)} />
            {/* Left - Mesial */}
            <path d="M0 0 L0 100 L50 50 Z" {...getPathProps(Surface.Mesial)} />
            {/* Right - Distal */}
            <path d="M100 0 L100 100 L50 50 Z" {...getPathProps(Surface.Distal)} />
            
            {/* Center - Occlusal/ToggleAll - Invisible touch target unless active */}
            <circle 
                cx="50" cy="50" r="14"
                className={`${value.occlusal ? 'fill-[#ff0000]' : 'fill-transparent hover:fill-slate-200/30'} stroke-none touch-none cursor-pointer`}
                onPointerDown={(e) => { e.stopPropagation(); onToggleAll(); }}
            />
          </svg>
        </div>
    );
  }

  // Geometry: 
  // ViewBox 0-100. Center 50.
  // We want the inner square to appear approx 18-20px when rendered at ~80px size.
  // 18/80 = 0.225 => ~22 units.
  // Half width = 11.
  // Inner: 50-11=39 to 50+11=61.
  // Outer: 2 to 98 (padding for stroke).
  
  return (
    <div className="w-full aspect-square flex items-center justify-center bg-white touch-none p-1">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
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

export default React.memo(PlaqueDiagram);