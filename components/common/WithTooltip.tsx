import React from 'react';

interface WithTooltipProps {
    label: string;
    children: React.ReactNode;
    className?: string;
}

const WithTooltip: React.FC<WithTooltipProps> = ({ label, children, className = "" }) => (
    <div className={`group relative inline-block ${className}`}>
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[200] shadow-lg border border-slate-700">
            {label}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
    </div>
);

export default WithTooltip;
