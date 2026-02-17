import React from 'react';

interface SideLabelsProps {
    jaw: 'upper' | 'lower';
}

const SideLabels: React.FC<SideLabelsProps> = ({ jaw }) => (
    <div className="flex flex-col justify-between py-1 h-full font-bold text-[10px] text-slate-400 select-none uppercase tracking-tighter w-4 text-center">
        <span>{jaw === 'upper' ? 'B' : 'L'}</span>
        <span className="opacity-30 text-[8px]">- ID -</span>
        <span>{jaw === 'upper' ? 'L' : 'B'}</span>
    </div>
);

export default SideLabels;
