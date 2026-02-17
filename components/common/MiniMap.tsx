import React from 'react';
import { Quadrant } from '../../types';

interface MiniMapProps {
    current: Quadrant;
    onSelect: (q: Quadrant) => void;
    disabled?: boolean;
}

const Quad: React.FC<{ q: Quadrant; label: string; rounded: string; current: Quadrant; onSelect: (q: Quadrant) => void; disabled?: boolean }> = ({ q, label, rounded, current, onSelect, disabled }) => (
    <button
        onClick={() => !disabled && onSelect(q)}
        className={`w-10 h-6 flex items-center justify-center text-[10px] font-bold transition-all border ${rounded}
      ${current === q
                ? 'bg-blue-600 text-white border-blue-700 z-10'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }
      ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
    `}
    >
        {label}
    </button>
);

const MiniMap: React.FC<MiniMapProps> = ({ current, onSelect, disabled }) => (
    <div className="flex flex-col gap-0.5 pointer-events-auto">
        <div className="flex gap-0.5">
            <Quad q="UL" label="UL" rounded="rounded-tl-md" current={current} onSelect={onSelect} disabled={disabled} />
            <Quad q="UR" label="UR" rounded="rounded-tr-md" current={current} onSelect={onSelect} disabled={disabled} />
        </div>
        <div className="flex gap-0.5">
            <Quad q="LL" label="LL" rounded="rounded-bl-md" current={current} onSelect={onSelect} disabled={disabled} />
            <Quad q="LR" label="LR" rounded="rounded-br-md" current={current} onSelect={onSelect} disabled={disabled} />
        </div>
    </div>
);

export default MiniMap;
