import React from 'react';
import { MeasurementMethod } from '../../types';

interface MethodSelectorProps {
    current: MeasurementMethod;
    onChange: (method: MeasurementMethod) => void;
}

const MethodSelector: React.FC<MethodSelectorProps> = ({ current, onChange }) => (
    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
        {(['1-point', '4-point', '6-point'] as const).map((m) => (
            <button
                key={m}
                onClick={() => onChange(m)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${current === m
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
            >
                {m === '1-point' ? '1点' : m === '4-point' ? '4点' : '6点'}
            </button>
        ))}
    </div>
);

export default MethodSelector;
