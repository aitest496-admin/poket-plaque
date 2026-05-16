import React, { useMemo } from 'react';
import { ToothData, MeasurementMethod } from '../types';
import { calculateFullMouthPISA, FullMouthPISAResult, ToothPISAResult } from '../utils/pisaCalculator';

interface PisaPreviewProps {
    data: {
        UL: ToothData[];
        UR: ToothData[];
        LL: ToothData[];
        LR: ToothData[];
    };
    date: string;
    method: MeasurementMethod;
    examiner?: { id: string; name: string; color: string };
}

const formatToothId = (id: number, isPrimary?: boolean) => {
    if (!isPrimary) return id;
    const map = ['A', 'B', 'C', 'D', 'E'];
    return map[id - 1] ?? id;
};

/** 重症度に応じた色設定 */
const severityConfig = {
    healthy: { label: '健全', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-500/20', icon: '✓' },
    mild: { label: '軽度', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-500/20', icon: '△' },
    moderate: { label: '中等度', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', ring: 'ring-orange-500/20', icon: '▲' },
    severe: { label: '重度', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-500/20', icon: '●' },
};

/** 歯ごとのPISAセルの背景色 */
function getPisaCellColor(pisa: number, isMissing: boolean): string {
    if (isMissing) return 'bg-slate-300 print:bg-slate-300';
    if (pisa === 0) return 'bg-white';
    if (pisa < 20) return 'bg-emerald-50 print:bg-emerald-50';
    if (pisa < 50) return 'bg-amber-100 print:bg-amber-100';
    if (pisa < 100) return 'bg-orange-200 print:bg-orange-200';
    return 'bg-red-300 print:bg-red-300';
}

const baseCellClass = "border-r border-b border-slate-800 text-center text-xs relative p-0 overflow-hidden h-full print:border-black";

const PisaPreview: React.FC<PisaPreviewProps> = ({ data, date, method, examiner }) => {
    const result = useMemo(() => calculateFullMouthPISA(data), [data]);

    const upperTeethUR = data.UR;
    const upperTeethUL = data.UL;
    const lowerTeethLR = data.LR;
    const lowerTeethLL = data.LL;

    // Upper: UR(8→1) + UL(1→8) = 16 teeth
    const upperTeeth = [...upperTeethUR, ...upperTeethUL];
    const lowerTeeth = [...lowerTeethLR, ...lowerTeethLL];

    const upperResults = [...result.teethResults.UR, ...result.teethResults.UL];
    const lowerResults = [...result.teethResults.LR, ...result.teethResults.LL];

    const sev = severityConfig[result.severity];

    return (
        <div className="w-full max-w-[1100px] bg-white p-4 md:p-8 mx-auto text-slate-900 print:p-0 print:max-w-none">
            {/* Unmeasured Warning */}
            {result.totalUnmeasuredSites > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center gap-4 animate-pulse-slow print:border-amber-500">
                    <div className="p-2 bg-amber-200 rounded-full text-amber-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <div>
                        <div className="font-black text-amber-800">
                            {result.totalUnmeasuredSites === result.totalBOPSites ? '未入力のため評価できません' : '未入力サイトがあります。PISAは参考値です。'}
                        </div>
                        <div className="text-xs text-amber-600 font-bold">
                            全 {result.totalBOPSites} 部位中 {result.totalUnmeasuredSites} 部位が未入力です。
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-end mb-6 border-b-2 border-slate-800 pb-2">
                <h1 className="text-xl font-bold">PISA（歯周組織炎症面積）</h1>
                <div className="flex gap-8 text-sm font-bold">
                    {examiner && <div>実施者: {examiner.name}</div>}
                    <div>検査日 {date.replace(/-/g, '.')}</div>
                    <div>残存歯 {result.presentTeethCount}本</div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Total PISA */}
                <div className={`${sev.bg} ${sev.border} border-2 rounded-xl p-4 flex flex-col items-center justify-center ring-2 ${sev.ring}`}>
                    <div className="text-xs font-bold text-slate-500 mb-1">PISA 合計</div>
                    <div className={`text-3xl font-black ${sev.color} leading-none`}>
                        {result.totalPISA.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">mm²</div>
                    {result.totalUnmeasuredSites === result.totalBOPSites ? (
                        <div className="mt-2 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            評価不可
                        </div>
                    ) : (
                        <div className={`mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${sev.bg} ${sev.color} border ${sev.border}`}>
                            {sev.icon} {sev.label}
                        </div>
                    )}
                </div>

                {/* PESA / BOP Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center gap-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-500">PESA 合計</span>
                        <span className="text-lg font-black text-slate-700">{result.totalPESA.toFixed(1)} <span className="text-xs font-normal">mm²</span></span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-500">BOP 陽性率</span>
                        <span className="text-lg font-black text-slate-700">{result.totalBOPPercent.toFixed(1)} <span className="text-xs font-normal">%</span></span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-500">BOP 部位</span>
                        <span className="text-sm font-bold text-slate-600">{result.totalBOPPositive} / {result.totalBOPSites} <span className="text-xs font-normal">部位</span></span>
                    </div>
                </div>

                {/* Quadrant Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                    <div className="text-xs font-bold text-slate-500 mb-2 text-center">象限別 PISA</div>
                    <div className="grid grid-cols-2 gap-1">
                        {(['UR', 'UL', 'LR', 'LL'] as const).map(q => {
                            const label: Record<string, string> = { UR: '右上', UL: '左上', LR: '右下', LL: '左下' };
                            const val = result.quadrantPISA[q];
                            return (
                                <div key={q} className="flex justify-between items-center bg-white rounded px-2 py-1 border border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-500">{label[q]}</span>
                                    <span className="text-xs font-black text-slate-700">{val.toFixed(1)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Teeth Detail Table */}
            <div className="border-2 border-slate-800 select-none">
                {/* UPPER JAW */}
                <div className="grid" style={{ gridTemplateColumns: `50px repeat(16, 1fr)` }}>
                    {/* PISA Row */}
                    <div className={`${baseCellClass} font-bold text-[9px] flex items-center justify-center bg-slate-100 whitespace-nowrap`}>PISA</div>
                    {upperResults.map((r, i) => (
                        <div key={r.fdiNumber} className={`${baseCellClass} min-h-[28px] flex items-center justify-center font-bold text-[10px] ${getPisaCellColor(r.pisa, r.isMissing)} ${i === 7 ? '!border-r-4' : ''} ${i === 15 ? '!border-r-0' : ''}`}>
                            {!r.isMissing && r.pisa > 0 ? r.pisa.toFixed(1) : !r.isMissing ? '-' : ''}
                        </div>
                    ))}

                    {/* BOP Count Row */}
                    <div className={`${baseCellClass} font-bold text-[9px] flex items-center justify-center bg-slate-100 whitespace-nowrap`}>BOP</div>
                    {upperResults.map((r, i) => (
                        <div key={r.fdiNumber} className={`${baseCellClass} min-h-[20px] flex items-center justify-center text-[10px] ${r.isMissing ? 'bg-slate-300 print:bg-slate-300' : r.bopPositive > 0 ? 'bg-red-100 print:bg-red-100 text-red-700 font-bold' : ''} ${i === 7 ? '!border-r-4' : ''} ${i === 15 ? '!border-r-0' : ''}`}>
                            {!r.isMissing ? `${r.bopPositive}/6` : ''}
                        </div>
                    ))}

                    {/* Mean PPD Row */}
                    <div className={`${baseCellClass} font-bold text-[9px] flex items-center justify-center bg-slate-100 whitespace-nowrap`}>PPD平均</div>
                    {upperResults.map((r, i) => (
                        <div key={r.fdiNumber} className={`${baseCellClass} min-h-[20px] flex items-center justify-center text-[10px] ${r.isMissing ? 'bg-slate-300 print:bg-slate-300' : r.meanPPD >= 4 ? 'font-bold text-orange-700' : ''} ${i === 7 ? '!border-r-4' : ''} ${i === 15 ? '!border-r-0' : ''}`}>
                            {!r.isMissing && r.meanPPD > 0 ? r.meanPPD.toFixed(1) : !r.isMissing ? '-' : ''}
                        </div>
                    ))}
                </div>

                {/* MIDDLE STRIP: TOOTH IDs */}
                <div className="grid grid-cols-[50px_repeat(16,_1fr)] bg-slate-100 h-6 print:bg-slate-200">
                    <div className={`${baseCellClass} bg-transparent font-bold text-[10px] flex items-center justify-center`}>部位</div>
                    {upperTeeth.map((t, i) => (
                        <div key={`upper-${i}`} className={`flex items-center justify-center font-bold text-sm border-r border-b border-slate-800 print:border-black ${t.isMissing ? 'bg-black text-slate-500 line-through print:bg-black print:text-white' : t.isPrimary ? 'bg-green-600 text-white print:bg-green-600' : ''} ${i === 7 ? '!border-r-4' : ''} ${i === 15 ? '!border-r-0' : ''}`}>
                            {formatToothId(t.id, t.isPrimary)}
                        </div>
                    ))}
                </div>

                {/* LOWER JAW */}
                <div className="grid" style={{ gridTemplateColumns: `50px repeat(16, 1fr)` }}>
                    {/* Mean PPD Row */}
                    <div className={`${baseCellClass} font-bold text-[9px] flex items-center justify-center bg-slate-100 whitespace-nowrap`}>PPD平均</div>
                    {lowerResults.map((r, i) => (
                        <div key={r.fdiNumber} className={`${baseCellClass} min-h-[20px] flex items-center justify-center text-[10px] ${r.isMissing ? 'bg-slate-300 print:bg-slate-300' : r.meanPPD >= 4 ? 'font-bold text-orange-700' : ''} ${i === 7 ? '!border-r-4' : ''} ${i === 15 ? '!border-r-0' : ''}`}>
                            {!r.isMissing && r.meanPPD > 0 ? r.meanPPD.toFixed(1) : !r.isMissing ? '-' : ''}
                        </div>
                    ))}

                    {/* BOP Count Row */}
                    <div className={`${baseCellClass} font-bold text-[9px] flex items-center justify-center bg-slate-100 whitespace-nowrap`}>BOP</div>
                    {lowerResults.map((r, i) => (
                        <div key={r.fdiNumber} className={`${baseCellClass} min-h-[20px] flex items-center justify-center text-[10px] ${r.isMissing ? 'bg-slate-300 print:bg-slate-300' : r.bopPositive > 0 ? 'bg-red-100 print:bg-red-100 text-red-700 font-bold' : ''} ${i === 7 ? '!border-r-4' : ''} ${i === 15 ? '!border-r-0' : ''}`}>
                            {!r.isMissing ? `${r.bopPositive}/6` : ''}
                        </div>
                    ))}

                    {/* PISA Row */}
                    <div className={`${baseCellClass} !border-b-0 font-bold text-[9px] flex items-center justify-center bg-slate-100 whitespace-nowrap`}>PISA</div>
                    {lowerResults.map((r, i) => (
                        <div key={r.fdiNumber} className={`${baseCellClass} !border-b-0 min-h-[28px] flex items-center justify-center font-bold text-[10px] ${getPisaCellColor(r.pisa, r.isMissing)} ${i === 7 ? '!border-r-4' : ''} ${i === 15 ? '!border-r-0' : ''}`}>
                            {!r.isMissing && r.pisa > 0 ? r.pisa.toFixed(1) : !r.isMissing ? '-' : ''}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend / Reference */}
            <div className="mt-2 flex gap-4 text-[10px] items-center border border-slate-800 p-1.5 bg-white">
                <div className="font-bold text-slate-600">PISA値の色:</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-400"></div> 0</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-50 border border-slate-400"></div> ~20</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-100 border border-slate-400"></div> ~50</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-200 border border-slate-400"></div> ~100</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-300 border border-slate-400"></div> 100~</div>
                <div className="ml-auto text-slate-500">日本版PESA係数 (Ueda et al. 2022)</div>
            </div>

            {/* Severity Reference */}
            <div className="mt-1 flex gap-4 text-[10px] items-center border border-slate-800 p-1.5 bg-white">
                <div className="font-bold text-slate-600">PISA合計の目安:</div>
                <div className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓ 健全</span> &lt;200</div>
                <div className="flex items-center gap-1"><span className="text-amber-600 font-bold">△ 軽度</span> 200~500</div>
                <div className="flex items-center gap-1"><span className="text-orange-600 font-bold">▲ 中等度</span> 500~1000</div>
                <div className="flex items-center gap-1"><span className="text-red-600 font-bold">● 重度</span> 1000~</div>
                <div className="ml-auto text-slate-500">単位: mm²</div>
            </div>
        </div>
    );
};

export default PisaPreview;
