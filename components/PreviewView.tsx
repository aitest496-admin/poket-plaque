import React from 'react';
import DentalChartPrintView from './SixPointPrintView';
import { ToothData, MeasurementMethod } from '../types';

interface PreviewViewProps {
    isCompareMode: boolean;
    markedDates: string[];
    selectedDate: string;
    compareDates: string[];
    comparisonData: { [date: string]: { UL: ToothData[]; UR: ToothData[]; LL: ToothData[]; LR: ToothData[] } };
    teeth: { UL: ToothData[]; UR: ToothData[]; LL: ToothData[]; LR: ToothData[] };
    measurementMethod: MeasurementMethod;
    handleCompareDateToggle: (date: string) => void;
    handleConfirmComparison: () => void;
    getTranslate: () => string;
}

const PreviewView: React.FC<PreviewViewProps> = ({
    isCompareMode,
    markedDates,
    selectedDate,
    compareDates,
    comparisonData,
    teeth,
    measurementMethod,
    handleCompareDateToggle,
    handleConfirmComparison,
    getTranslate,
}) => {
    return (
        <div className="w-full h-full flex flex-col items-center gap-4 py-4 print:p-0 print:gap-0 overflow-auto">
            {isCompareMode && (
                <div className="print:hidden w-full max-w-2xl px-4 py-6 bg-white rounded-xl shadow-lg border border-indigo-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                        比較する日付を選択（最大2つ）
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {markedDates.filter(d => d !== selectedDate).length > 0 ? (
                            markedDates.filter(d => d !== selectedDate).map(date => (
                                <button
                                    key={date}
                                    onClick={() => handleCompareDateToggle(date)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${compareDates.includes(date)
                                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {date}
                                </button>
                            ))
                        ) : (
                            <p className="text-slate-400 text-sm">比較可能な過去データがありません。</p>
                        )}
                    </div>
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleConfirmComparison}
                            disabled={compareDates.length === 0}
                            className={`px-8 py-3 rounded-full font-bold shadow-lg transition-all active:scale-95 ${compareDates.length > 0
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            比較を開始する
                        </button>
                    </div>
                </div>
            )}

            {/* Preview Map & Legend (Hidden on print) */}
            {!isCompareMode && (
                <div className="print:hidden w-full max-w-4xl px-2 mb-4">
                    <div className="bg-indigo-900/5 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100/50 shadow-inner">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 italic">
                                    {getTranslate()}
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                                        {selectedDate.replace(/-/g, '/')}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm">
                                        {measurementMethod === '6-point' ? '6点' : measurementMethod === '4-point' ? '4点' : '1点'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-sm shadow-sm ring-1 ring-red-200"></div>
                                    <span className="text-[10px] font-black text-slate-600">BOP</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-sm shadow-sm ring-1 ring-blue-200"></div>
                                    <span className="text-[10px] font-black text-slate-600">Pus</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full h-fit flex items-center justify-center print:block">
                <DentalChartPrintView
                    teeth={teeth}
                    compareTeeth={comparisonData[compareDates[0]]}
                    compareTeeth2={comparisonData[compareDates[1]]}
                    date={selectedDate}
                    compareDate={compareDates[0]}
                    compareDate2={compareDates[1]}
                    method={measurementMethod}
                />
            </div>
        </div>
    );
};

export default PreviewView;
