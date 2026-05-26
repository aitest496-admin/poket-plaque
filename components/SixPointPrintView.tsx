import React, { useMemo, useState } from 'react';
import { ToothData, MeasurementMethod } from '../types';

interface DentalChartPrintViewProps {
  data: {
    UL: ToothData[];
    UR: ToothData[];
    LL: ToothData[];
    LR: ToothData[];
  };
  date: string;
  method: MeasurementMethod;
  examiner?: { id: string; name: string; color: string };
  showFurcation?: boolean;
  plaqueViewMode?: 'all' | 'plaque-only' | 'plaque-none';
}

const formatToothId = (id: number, isPrimary?: boolean) => {
  if (!isPrimary) return id;
  const map = ['A', 'B', 'C', 'D', 'E'];
  return map[id - 1] ?? id;
};

// Collapsed border model: Cells have Right and Bottom borders. Container has Top and Left.
const baseCellClass = "border-r border-b border-slate-800 text-center text-xs relative p-0 overflow-hidden h-full print:border-black";

const getCellCount = (id: number, isUpper: boolean): 1 | 2 | 3 => {
  if (isUpper) {
    if (id >= 6) return 3;
    if (id === 4 || id === 5) return 2;
    return 1;
  } else {
    if (id >= 6) return 2;
    return 1;
  }
};

const getFurcationVariant = (id: number, isUpper: boolean): 'single' | 'horizontal' | 'vertical' | 'y-shape' => {
  if (isUpper) {
    if (id >= 6) return 'y-shape';
    if (id === 4 || id === 5) return 'vertical';
    return 'single';
  } else {
    if (id >= 6) return 'horizontal';
    return 'single';
  }
};

const getFurcationValues = (tooth: ToothData, count: number) => {
  return tooth.furcation && tooth.furcation.length === count 
    ? tooth.furcation 
    : Array(count).fill(null);
};

const getFurcationFillColor = (val: string | null): string => {
  if (val === 'Ⅰ') return '#fef9c3';
  if (val === 'Ⅱ') return '#ffedd5';
  if (val === 'Ⅲ') return '#fee2e2';
  return '#ffffff';
};

const FurcationShape: React.FC<{
  values: (string | null)[];
  variant: 'single' | 'horizontal' | 'vertical' | 'y-shape';
}> = ({ values, variant }) => {
  const strokeColor = '#999999';
  const textClass = 'font-bold text-[13px] fill-slate-800 pointer-events-none select-none';

  if (variant === 'y-shape') {
    return (
      <svg viewBox="0 0 70 40" className="w-full h-full" preserveAspectRatio="none">
        <polygon points="0,0 35,20 35,40 0,40" fill={getFurcationFillColor(values[0])} stroke={strokeColor} strokeWidth="1" />
        <polygon points="70,0 35,20 35,40 70,40" fill={getFurcationFillColor(values[1])} stroke={strokeColor} strokeWidth="1" />
        <polygon points="0,0 35,20 70,0" fill={getFurcationFillColor(values[2])} stroke={strokeColor} strokeWidth="1" />
        {values[0] && <text x="17.5" y="25" textAnchor="middle" dominantBaseline="central" className={textClass}>{values[0]}</text>}
        {values[1] && <text x="52.5" y="25" textAnchor="middle" dominantBaseline="central" className={textClass}>{values[1]}</text>}
        {values[2] && <text x="35" y="8" textAnchor="middle" dominantBaseline="central" className={textClass}>{values[2]}</text>}
      </svg>
    );
  }

  if (variant === 'horizontal') {
    return (
      <svg viewBox="0 0 70 40" className="w-full h-full" preserveAspectRatio="none">
        <rect x="0" y="0" width="70" height="20" fill={getFurcationFillColor(values[0])} stroke={strokeColor} strokeWidth="1" />
        <rect x="0" y="20" width="70" height="20" fill={getFurcationFillColor(values[1])} stroke={strokeColor} strokeWidth="1" />
        {values[0] && <text x="35" y="10" textAnchor="middle" dominantBaseline="central" className={textClass}>{values[0]}</text>}
        {values[1] && <text x="35" y="30" textAnchor="middle" dominantBaseline="central" className={textClass}>{values[1]}</text>}
      </svg>
    );
  }

  if (variant === 'vertical') {
    return (
      <svg viewBox="0 0 70 40" className="w-full h-full" preserveAspectRatio="none">
        <rect x="0" y="0" width="35" height="40" fill={getFurcationFillColor(values[0])} stroke={strokeColor} strokeWidth="1" />
        <rect x="35" y="0" width="35" height="40" fill={getFurcationFillColor(values[1])} stroke={strokeColor} strokeWidth="1" />
        {values[0] && <text x="17.5" y="20" textAnchor="middle" dominantBaseline="central" className={textClass}>{values[0]}</text>}
        {values[1] && <text x="52.5" y="20" textAnchor="middle" dominantBaseline="central" className={textClass}>{values[1]}</text>}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 70 40" className="w-full h-full" preserveAspectRatio="none">
      <rect x="0" y="0" width="70" height="40" fill={getFurcationFillColor(values[0])} stroke={strokeColor} strokeWidth="1" />
      {values[0] && <text x="35" y="20" textAnchor="middle" dominantBaseline="central" className={textClass}>{values[0]}</text>}
    </svg>
  );
};

const FurcationPrintCell: React.FC<{
  tooth: ToothData;
  isUpper: boolean;
  colSpan: number;
  isCenterSeparator?: boolean;
  isLastTooth?: boolean;
  isLastRow?: boolean;
}> = ({ tooth, isUpper, colSpan, isCenterSeparator, isLastTooth, isLastRow }) => {
  if (tooth.isMissing) {
    return (
      <div
        className={`${baseCellClass} min-h-[24px] bg-slate-300 print:bg-slate-300 ${isCenterSeparator ? '!border-r-4' : ''} ${isLastTooth ? '!border-r-0' : ''} ${isLastRow ? '!border-b-0' : ''}`}
        style={{ gridColumn: `span ${colSpan}` }}
      />
    );
  }

  const variant = getFurcationVariant(tooth.id, isUpper);
  const count = getCellCount(tooth.id, isUpper);
  const values = getFurcationValues(tooth, count);

  return (
    <div
      className={`${baseCellClass} min-h-[24px] h-[24px] w-full flex items-center justify-center p-0 ${isCenterSeparator ? '!border-r-4' : ''} ${isLastTooth ? '!border-r-0' : ''} ${isLastRow ? '!border-b-0' : ''}`}
      style={{ gridColumn: `span ${colSpan}` }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <FurcationShape values={values} variant={variant} />
      </div>
    </div>
  );
};

const getDepthColor = (d: number | null) => {
  if (d === null) return 'bg-transparent';
  if (d >= 10) return 'bg-[#ff4d4d] text-white print:bg-[#ff4d4d] print:text-white'; // Red
  if (d >= 7) return 'bg-[#ffc0cb] print:bg-[#ffc0cb]'; // Pink
  if (d >= 4) return 'bg-[#ffff00] print:bg-[#ffff00]'; // Yellow
  return 'bg-white';
};

const BleedingPusIndicator: React.FC<{ bleeding: boolean, pus: boolean }> = ({ bleeding, pus }) => {
  if (bleeding && pus) {
    return (
      <div className="w-full h-full flex">
          <div className="w-1/2 bg-[#ff4d4d] h-full print:bg-[#ff4d4d]"></div>
          <div className="w-1/2 bg-[#808080] h-full print:bg-[#808080]"></div>
      </div>
    );
  } else if (bleeding) {
    return <div className="w-full h-full bg-[#ff4d4d] print:bg-[#ff4d4d]"></div>;
  } else if (pus) {
    return <div className="w-full h-full bg-[#808080] print:bg-[#808080]"></div>;
  }
  return null;
};

// Bleeding/Pus Row Cells
const BleedingPusCells: React.FC<{ tooth: ToothData, side: 'buccal' | 'lingual', indices: number[], colSpan: number, isCenterSeparator?: boolean, isLastTooth?: boolean }> = ({ tooth, side, indices, colSpan, isCenterSeparator, isLastTooth }) => {
    if (tooth.isMissing) {
        return (
            <div className={`${baseCellClass} min-h-[12px] bg-slate-300 print:bg-slate-300 ${isCenterSeparator ? '!border-r-4' : ''} ${isLastTooth ? '!border-r-0' : ''}`} style={{ gridColumn: `span ${colSpan}` }}></div>
        );
    }
    const bleeding = tooth.bleeding[side];
    const pus = tooth.pus[side];
    return (
        <>
        {indices.map((idx, i) => (
             <div key={idx} className={`${baseCellClass} min-h-[12px] flex items-center justify-center ${isCenterSeparator && i === indices.length - 1 ? '!border-r-4' : ''} ${isLastTooth && i === indices.length - 1 ? '!border-r-0' : ''}`}>
                <BleedingPusIndicator bleeding={bleeding[idx]} pus={pus[idx]} />
             </div>
        ))}
        </>
    );
}

// Plaque Cell Renderer
const PlaqueCell: React.FC<{ tooth: ToothData, colSpan: number, isCenterSeparator?: boolean, isLastTooth?: boolean, isLastRow?: boolean }> = ({ tooth, colSpan, isCenterSeparator, isLastTooth, isLastRow }) => {
  if (tooth.isMissing) {
      return <div className={`${baseCellClass} min-h-[24px] w-full bg-slate-300 print:bg-slate-300 ${isCenterSeparator ? '!border-r-4' : ''} ${isLastTooth ? '!border-r-0' : ''} ${isLastRow ? '!border-b-0' : ''}`} style={{ gridColumn: `span ${colSpan}` }}></div>;
  }

  const { plaque } = tooth;
  const activeColor = "#ef4444"; 
  const inactiveColor = "transparent";
  const strokeClass = "stroke-slate-800 print:stroke-black";

  return (
    <div className={`${baseCellClass} min-h-[24px] w-full ${isCenterSeparator ? '!border-r-4' : ''} ${isLastTooth ? '!border-r-0' : ''} ${isLastRow ? '!border-b-0' : ''}`} style={{ gridColumn: `span ${colSpan}` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full absolute inset-0 block pointer-events-none">
         <path d="M0 0 L100 0 L50 50 Z" fill={plaque.buccal ? activeColor : inactiveColor} stroke="none" />
         <path d="M0 100 L100 100 L50 50 Z" fill={plaque.lingual ? activeColor : inactiveColor} stroke="none" />
         <path d="M0 0 L0 100 L50 50 Z" fill={plaque.mesial ? activeColor : inactiveColor} stroke="none" />
         <path d="M100 0 L100 100 L50 50 Z" fill={plaque.distal ? activeColor : inactiveColor} stroke="none" />
         
         <line x1="0" y1="0" x2="100" y2="100" className={strokeClass} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
         <line x1="100" y1="0" x2="0" y2="100" className={strokeClass} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
};

// Mobility Cell Renderer
const MobilityCell: React.FC<{ tooth: ToothData, colSpan: number, isCenterSeparator?: boolean, isLastTooth?: boolean }> = ({ tooth, colSpan, isCenterSeparator, isLastTooth }) => {
    if (tooth.isMissing) {
        return <div className={`${baseCellClass} min-h-[24px] w-full bg-slate-300 print:bg-slate-300 ${isCenterSeparator ? '!border-r-4' : ''} ${isLastTooth ? '!border-r-0' : ''}`} style={{ gridColumn: `span ${colSpan}` }}></div>;
    }
    return (
        <div className={`${baseCellClass} min-h-[24px] w-full flex items-center justify-center font-bold ${isCenterSeparator ? '!border-r-4' : ''} ${isLastTooth ? '!border-r-0' : ''}`} style={{ gridColumn: `span ${colSpan}` }}>
            {tooth.mobility > 0 ? tooth.mobility : ''}
        </div>
    );
};

// Measurement Cell Renderer (Depth only)
const MeasurementCells: React.FC<{ tooth: ToothData, side: 'buccal' | 'lingual', indices: number[], colSpan: number, isCenterSeparator?: boolean, isLastTooth?: boolean }> = ({ tooth, side, indices, colSpan, isCenterSeparator, isLastTooth }) => {
  if (tooth.isMissing) {
      return <div className={`${baseCellClass} min-h-[24px] bg-slate-300 print:bg-slate-300 ${isCenterSeparator ? '!border-r-4' : ''} ${isLastTooth ? '!border-r-0' : ''}`} style={{ gridColumn: `span ${colSpan}` }}></div>;
  }

  const depth = tooth.pocketDepth[side];

  return (
    <>
      {indices.map((idx, i) => (
          <div key={idx} className={`${baseCellClass} min-h-[24px] ${getDepthColor(depth[idx])} flex items-center justify-center relative ${isCenterSeparator && i === indices.length - 1 ? '!border-r-4' : ''} ${isLastTooth && i === indices.length - 1 ? '!border-r-0' : ''}`}>
            <span className="z-0 text-[10px] font-medium leading-none">{depth[idx]}</span>
          </div>
      ))}
    </>
  );
};

const DentalChartPrintView: React.FC<DentalChartPrintViewProps> = ({ data, date, method, examiner, showFurcation = false, plaqueViewMode = 'all' }) => {
  const upperTeeth = [...data.UR, ...data.UL];
  const lowerTeeth = [...data.LR, ...data.LL];
  const isPlaqueOnly = plaqueViewMode === 'plaque-only';
  const isPlaqueHidden = plaqueViewMode === 'plaque-none';

  // Config based on method
  const config = useMemo(() => {
    switch (method) {
      case '1-point':
        return {
          indices: [1], // Center only
          colSpan: 1,
          showLingual: false, // 1-point usually just shows deepest (mapped to Buccal in editor)
          pointsPerTooth: 1,
          colsTotal: 16 // 16 teeth * 1 point
        };
      case '4-point':
        return {
          indices: [0, 2], // Left(Distal) and Right(Mesial)
          colSpan: 2,
          showLingual: true,
          pointsPerTooth: 2,
          colsTotal: 32 // 16 teeth * 2 points
        };
      case '6-point':
      default:
        return {
          indices: [0, 1, 2],
          colSpan: 3,
          showLingual: true,
          pointsPerTooth: 3,
          colsTotal: 48 // 16 teeth * 3 points
        };
    }
  }, [method]);

  // Calculate Statistics
  const stats = useMemo(() => {
    let totalTeeth = 0;
    let plaqueSurfaces = 0;
    let bleedingPoints = 0;
    let totalBleedingPointsToCheck = 0;
    let totalPlaqueSurfacesToCheck = 0;

    const processTooth = (t: ToothData) => {
      if (t.isMissing) return;

      totalTeeth++;
      // PCR: Always 4 surfaces regardless of method (O'Leary)
      if (t.plaque.mesial) plaqueSurfaces++;
      if (t.plaque.distal) plaqueSurfaces++;
      if (t.plaque.buccal) plaqueSurfaces++;
      if (t.plaque.lingual) plaqueSurfaces++;
      totalPlaqueSurfacesToCheck += 4;

      // BOP: Depends on method
      let bPoints = 0;
      let checkCount = 0;

      // Check Buccal
      config.indices.forEach(idx => {
          if (t.bleeding.buccal[idx]) bPoints++;
          checkCount++;
      });

      // Check Lingual (Only if relevant for BOP calculation, usually 1-point BOP implies just one check per tooth)
      // In 1-point editor, we only set Buccal bleeding. So we only check Buccal.
      if (config.showLingual) {
          config.indices.forEach(idx => {
            if (t.bleeding.lingual[idx]) bPoints++;
            checkCount++;
          });
      }

      bleedingPoints += bPoints;
      totalBleedingPointsToCheck += checkCount;
    };

    upperTeeth.forEach(processTooth);
    lowerTeeth.forEach(processTooth);

    const pcr = totalPlaqueSurfacesToCheck > 0 ? ((plaqueSurfaces / totalPlaqueSurfacesToCheck) * 100).toFixed(1) : "0.0";
    const bop = totalBleedingPointsToCheck > 0 ? ((bleedingPoints / totalBleedingPointsToCheck) * 100).toFixed(1) : "0.0";

    return { pcr, bop };
  }, [upperTeeth, lowerTeeth, config]);

  const labelClass = "bg-white font-bold text-[10px] tracking-tighter flex items-center justify-center h-full w-full shrink-0 border-r border-b border-slate-800 print:border-black whitespace-nowrap overflow-hidden";
  const title = method === '1-point'
    ? '歯周基本検査表'
    : `歯周精密検査表 (${method === '4-point' ? '4点法' : '6点法'})`;

  // Dynamic grid columns
  const gridStyle = {
      gridTemplateColumns: `40px repeat(${config.colsTotal}, 1fr)`
  };

  return (
    <div className="w-full max-w-[1100px] bg-white p-4 md:p-8 mx-auto text-slate-900 print:p-0 print:max-w-none">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-4 border-b-2 border-slate-800 pb-2">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex gap-8 text-sm font-bold">
            {examiner && <div>実施者: {examiner.name}</div>}
            <div>検査日 {date.replace(/-/g, '.')}</div>
            {!isPlaqueHidden && <div>PCR {stats.pcr}%</div>}
        </div>
      </div>



      {/* Main Table Container */}
      <div className="border-2 border-slate-800 select-none">
        
        {/* UPPER JAW */}
        <div className="grid" style={gridStyle}>
             {/* Row 0: Furcation (Upper) */}
             {!isPlaqueOnly && method === '6-point' && showFurcation && (
               <>
                 <div className={`${labelClass}`}>根分岐部</div>
                 {upperTeeth.map((t, i) => (
                   <FurcationPrintCell
                     key={t.id}
                     tooth={t}
                     isUpper={true}
                     colSpan={config.colSpan}
                     isCenterSeparator={i === 7}
                     isLastTooth={i === upperTeeth.length - 1}
                   />
                 ))}
               </>
             )}

             {/* Row 1: Plaque */}
             {!isPlaqueHidden && (
               <>
                 <div className={`${labelClass}`}>プラーク</div>
                 {upperTeeth.map((t, i) => <PlaqueCell key={t.id} tooth={t} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === upperTeeth.length - 1} />)}
               </>
             )}

             {/* Row 2: Mobility */}
             {!isPlaqueOnly && (
               <>
                 <div className={`${labelClass}`} style={{ gridColumn: '1 / 2' }}>動揺度</div>
                 {upperTeeth.map((t, i) => <MobilityCell key={t.id} tooth={t} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === upperTeeth.length - 1} />)}
               </>
             )}

             {/* Row 3: Bleeding/Pus (Buccal) */}
             {!isPlaqueOnly && (
               <>
                 <div className={`${labelClass} !text-[8px]`} style={{ gridColumn: '1 / 2' }}>出血・排膿</div>
                 {upperTeeth.map((t, i) => <BleedingPusCells key={t.id} tooth={t} side="buccal" indices={config.indices} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === upperTeeth.length - 1} />)}
               </>
             )}

             {/* Row 4: Buccal Pocket */}
             {!isPlaqueOnly && (
               <>
                 <div className={`${labelClass}`} style={{ gridColumn: '1 / 2' }}>ポケット</div>
                 {upperTeeth.map((t, i) => <MeasurementCells key={t.id} tooth={t} side="buccal" indices={config.indices} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === upperTeeth.length - 1} />)}
               </>
             )}

             {/* Row 5 & 6: Lingual (Conditional) */}
             {!isPlaqueOnly && config.showLingual && (
                <>
                    <div className={`${labelClass}`} style={{ gridColumn: '1 / 2' }}>ポケット</div>
                    {upperTeeth.map((t, i) => <MeasurementCells key={t.id} tooth={t} side="lingual" indices={config.indices} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === upperTeeth.length - 1} />)}

                    <div className={`${labelClass} !text-[8px]`} style={{ gridColumn: '1 / 2' }}>出血・排膿</div>
                    {upperTeeth.map((t, i) => <BleedingPusCells key={t.id} tooth={t} side="lingual" indices={config.indices} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === upperTeeth.length - 1} />)}
                </>
             )}
        </div>

        {/* MIDDLE STRIP: TOOTH IDs */}
        <div className="grid grid-cols-[40px_repeat(16,_1fr)] bg-slate-100 h-6 print:bg-slate-200">
            <div className={`${labelClass} bg-transparent`}>部位</div>
            {upperTeeth.map((t, i) => (
                <div key={t.id} className={`flex items-center justify-center font-bold text-sm border-r border-b border-slate-800 print:border-black ${t.isMissing ? 'bg-black text-slate-500 line-through print:bg-black print:text-white' : t.isPrimary ? 'bg-green-600 text-white print:bg-green-600' : ''} ${i === 7 ? '!border-r-4' : ''} ${i === upperTeeth.length - 1 ? '!border-r-0' : ''}`}>
                    {formatToothId(t.id, t.isPrimary)}
                </div>
            ))}
        </div>

        {/* LOWER JAW */}
        <div className="grid" style={gridStyle}>
             {/* Row 1 & 2: Lingual (Conditional) */}
             {!isPlaqueOnly && config.showLingual && (
                <>
                    <div className={`${labelClass} !text-[8px]`} style={{ gridColumn: '1 / 2' }}>出血・排膿</div>
                    {lowerTeeth.map((t, i) => <BleedingPusCells key={t.id} tooth={t} side="lingual" indices={config.indices} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === lowerTeeth.length - 1} />)}

                    <div className={`${labelClass}`} style={{ gridColumn: '1 / 2' }}>ポケット</div>
                    {lowerTeeth.map((t, i) => <MeasurementCells key={t.id} tooth={t} side="lingual" indices={config.indices} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === lowerTeeth.length - 1} />)}
                </>
             )}

             {/* Row 3: Buccal Pocket */}
             {!isPlaqueOnly && (
               <>
                 <div className={`${labelClass}`} style={{ gridColumn: '1 / 2' }}>ポケット</div>
                 {lowerTeeth.map((t, i) => <MeasurementCells key={t.id} tooth={t} side="buccal" indices={config.indices} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === lowerTeeth.length - 1} />)}
               </>
             )}

             {/* Row 4: Bleeding/Pus (Buccal) */}
             {!isPlaqueOnly && (
               <>
                 <div className={`${labelClass} !text-[8px]`} style={{ gridColumn: '1 / 2' }}>出血・排膿</div>
                 {lowerTeeth.map((t, i) => <BleedingPusCells key={t.id} tooth={t} side="buccal" indices={config.indices} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === lowerTeeth.length - 1} />)}
               </>
             )}

             {/* Row 5: Mobility */}
             {!isPlaqueOnly && (
               <>
                 <div className={`${labelClass}`} style={{ gridColumn: '1 / 2' }}>動揺度</div>
                 {lowerTeeth.map((t, i) => <MobilityCell key={t.id} tooth={t} colSpan={config.colSpan} isCenterSeparator={i === 7} isLastTooth={i === lowerTeeth.length - 1} />)}
               </>
             )}

             {/* Row 6: Plaque */}
             {!isPlaqueHidden && (
               <>
                 <div className={`${labelClass} ${isPlaqueOnly || !(method === '6-point' && showFurcation) ? '!border-b-0' : ''}`} style={{ gridColumn: '1 / 2' }}>プラーク</div>
                 {lowerTeeth.map((t, i) => (
                   <PlaqueCell
                     key={t.id}
                     tooth={t}
                     colSpan={config.colSpan}
                     isCenterSeparator={i === 7}
                     isLastTooth={i === lowerTeeth.length - 1}
                     isLastRow={isPlaqueOnly || !(method === '6-point' && showFurcation)}
                   />
                 ))}
               </>
             )}

             {/* Row 7: Furcation (Lower) */}
             {!isPlaqueOnly && method === '6-point' && showFurcation && (
               <>
                 <div className={`${labelClass} !border-b-0`}>根分岐部</div>
                 {lowerTeeth.map((t, i) => (
                   <FurcationPrintCell
                     key={t.id}
                     tooth={t}
                     isUpper={false}
                     colSpan={config.colSpan}
                     isCenterSeparator={i === 7}
                     isLastTooth={i === lowerTeeth.length - 1}
                     isLastRow={true}
                   />
                 ))}
               </>
             )}
        </div>

      </div>

      {/* Legend Footer */}
      {!isPlaqueOnly && (
        <div className="mt-2 flex gap-4 text-[10px] items-center border border-slate-800 p-1 bg-white">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#ff4d4d] border border-black"></div> 出血</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#808080] border border-black"></div> 排膿</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 flex"><div className="w-1.5 bg-[#ff4d4d]"></div><div className="w-1.5 bg-[#808080]"></div></div> 出血+排膿</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-600 border border-black"></div> 乳歯</div>
          
          <div className="font-bold ml-2">BOP {stats.bop}%</div>

          <div className="ml-auto flex gap-4">
              <span>プロービング: ~3mm(白)</span>
              <span>4~6mm(黄)</span>
              <span>7mm~(桃/赤)</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default DentalChartPrintView;
