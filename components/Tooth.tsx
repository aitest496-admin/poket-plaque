import React from 'react';
import { ToothData, Surface, MeasurementPoint, MeasurementMethod } from '../types';
import PlaqueDiagram from './PlaqueDiagram';
import ThreePointToggle from './ThreePointToggle';
import PocketDepthChart from './PocketDepthChart';
import { FurcationInput } from './FurcationInput';

interface ToothProps {
  data: ToothData;
  lowerData?: ToothData; // Optional, for 1-point combined view
  onUpdate: (data: ToothData) => void;
  onUpdateLower?: (data: ToothData) => void; // Optional, for updating lowerData
  jaw: 'upper' | 'lower';
  method: MeasurementMethod;
}

const formatToothId = (id: number, isPrimary?: boolean) => {
  if (!isPrimary) return id;
  const map = ['A', 'B', 'C', 'D', 'E'];
  return map[id - 1] ?? id;
};

const Tooth: React.FC<ToothProps> = ({ data, lowerData, onUpdate, onUpdateLower, jaw, method }) => {

  const handlePlaqueChange = (surface: Surface, isActive: boolean) => {
    onUpdate({
      ...data,
      plaque: { ...data.plaque, [surface]: isActive }
    });
  };

  const handlePlaqueToggleAll = () => {
    const allActive = Object.values(data.plaque).every(v => v);
    const newState = !allActive;
    onUpdate({
      ...data,
      plaque: {
        distal: newState,
        buccal: newState,
        mesial: newState,
        lingual: newState,
        occlusal: newState
      }
    });
  };

  const handleMobilitySelect = (value: 1 | 2 | 3) => {
    onUpdate({ ...data, mobility: data.mobility === value ? 0 : value });
  };

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

  const handleFurcationChange = (index: number, newValue: string | null) => {
    const isUpper = jaw === 'upper';
    const cellCount = getCellCount(data.id, isUpper);
    const currentFurcation = data.furcation && data.furcation.length === cellCount 
      ? [...data.furcation] 
      : Array(cellCount).fill(null);
    
    currentFurcation[index] = newValue;
    onUpdate({
      ...data,
      furcation: currentFurcation
    });
  };

  const updateMeasurement = <T extends unknown>(
    category: 'pus' | 'bleeding' | 'pocketDepth',
    side: 'buccal' | 'lingual',
    index: MeasurementPoint,
    value: T
  ) => {
    const currentSideArray = [...data[category][side]];
    // @ts-ignore
    currentSideArray[index] = value;

    onUpdate({
      ...data,
      [category]: {
        ...data[category],
        [side]: currentSideArray
      }
    });
  };

  // Handler for toggling status
  const handleStatusChange = () => {
    let nextState = { isMissing: false, isPrimary: false };

    // Logic for 6, 7, 8: Cycle Permanent -> Missing -> Permanent (No Primary option)
    if (data.id >= 6) {
      if (data.isMissing) {
        nextState = { isMissing: false, isPrimary: false };
      } else {
        nextState = { isMissing: true, isPrimary: false };
      }
    } else {
      // Logic for 1-5: Cycle Normal(Permanent) -> Missing -> Primary -> Normal
      if (data.isMissing) {
        // Missing -> Primary
        nextState = { isMissing: false, isPrimary: true };
      } else if (data.isPrimary) {
        // Primary -> Permanent
        nextState = { isMissing: false, isPrimary: false };
      } else {
        // Permanent -> Missing
        nextState = { isMissing: true, isPrimary: false };
      }
    }

    onUpdate({ ...data, ...nextState });
  };

  const is1Point = method === '1-point';
  const is4Point = method === '4-point';

  // 4-point method: Buccal = 2 points, Lingual = 2 points
  // 1-point method: All = 1 point
  const lingualSinglePoint = is1Point;
  const buccalSinglePoint = is1Point;
  const isLarge = !is1Point;
  const toothWidthClass = is1Point ? 'flex-1 min-w-[34px]' : 'flex-1 min-w-[70px]';
  const mobilityRowHeight = isLarge ? 'h-[28px]' : 'h-[24px]';
  const toothIdTextSize = isLarge ? 'text-[16px]' : 'text-[12px]';
  const toothIdPadding = isLarge ? 'py-[2px]' : 'py-[2px]';
  const toothIdHeight = isLarge ? 'h-[52px]' : 'h-[30px]';

  const renderMobilityToggle = (
    currentValue: number,
    onSelect: (value: 1 | 2 | 3) => void,
    borderClass: string
  ) => (
    <div className={`${mobilityRowHeight} grid grid-cols-3 bg-slate-50 ${borderClass}`}>
      {([1, 2, 3] as const).map((value) => {
        const isActive = currentValue === value;
        return (
          <button
            key={value}
            type="button"
            onPointerDown={() => onSelect(value)}
            className={`
              h-full min-w-0 flex items-center justify-center border-r last:border-r-0 border-slate-200
              text-[11px] md:text-[12px] font-black leading-none transition-colors active:scale-95
              ${isActive
                ? 'bg-blue-600 text-white shadow-inner'
                : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-700'}
            `}
            aria-pressed={isActive}
            aria-label={`動揺度${value}`}
            title={`動揺度${value}`}
          >
            {value}
          </button>
        );
      })}
    </div>
  );

  // Missing Overlay Component
  const MissingOverlay = () => (
    <div className="absolute inset-0 bg-slate-300/80 z-30 flex items-center justify-center pointer-events-auto cursor-not-allowed">
      <span className={`${isLarge ? 'text-[16px]' : 'text-[10px]'} font-bold text-slate-600 bg-white/50 px-1 rounded transform -rotate-45`}>欠損</span>
    </div>
  );

  // Helper for ID styling
  const getIdClass = (t: ToothData) => {
    if (t.isMissing) return 'bg-black text-slate-500 line-through';
    if (t.isPrimary) return 'bg-green-600 text-white';
    return 'bg-[#666] text-white';
  };

  // === 1-POINT COMBINED VIEW LOGIC (Unchanged) ===
  if (is1Point && lowerData && onUpdateLower) {
    // Helper for updating Lower Data
    const updateLower = <T extends unknown>(
      category: 'pus' | 'bleeding' | 'pocketDepth',
      side: 'buccal' | 'lingual',
      index: MeasurementPoint,
      value: T
    ) => {
      const currentSideArray = [...lowerData[category][side]];
      // @ts-ignore
      currentSideArray[index] = value;
      onUpdateLower({
        ...lowerData,
        [category]: {
          ...lowerData[category],
          [side]: currentSideArray
        }
      });
    };

    const handleLowerPlaqueChange = (surface: Surface, isActive: boolean) => {
      onUpdateLower({ ...lowerData, plaque: { ...lowerData.plaque, [surface]: isActive } });
    };

    const handleLowerMobilitySelect = (value: 1 | 2 | 3) => {
      onUpdateLower({ ...lowerData, mobility: lowerData.mobility === value ? 0 : value });
    };

    return (
      <div className={`flex-1 flex flex-col border border-[#999] bg-white select-none shadow-sm ${toothWidthClass}`}>
        {/* === UPPER JAW (Top Section) === */}
        <div className="flex flex-col w-full relative">
          {data.isMissing && <MissingOverlay />}
          {/* Plaque Diagram (Upper) */}
          <div className="border-b border-[#ccc] w-full">
            <PlaqueDiagram
              value={data.plaque}
              onChange={handlePlaqueChange}
              onToggleAll={handlePlaqueToggleAll}
              variant="simple"
            />
          </div>
          {/* Mobility (Upper) */}
          {renderMobilityToggle(data.mobility, handleMobilitySelect, 'border-b border-[#ccc]')}
          {/* Measurements (Upper Buccal) */}
          {/* Pus -> Bleeding -> Chart (15..1) | Inverted=false puts 1 at bottom */}
          <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} singlePoint={true} />
          <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} singlePoint={true} />
          <PocketDepthChart
            values={data.pocketDepth.buccal}
            onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)}
            isInverted={false}
            singlePoint={true}
          />
        </div>

        {/* === TOOTH ID (上顎) === */}
        <div
          className={`font-bold ${toothIdHeight} ${toothIdTextSize} flex items-center justify-center border-b border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(data)}`}
          onPointerDown={handleStatusChange}
          title="上顎: クリックで状態切替 (永久歯/欠損/乳歯)"
        >
          {formatToothId(data.id, data.isPrimary)}
        </div>
        {/* === TOOTH ID (下顎) === */}
        <div
          className={`font-bold ${toothIdHeight} ${toothIdTextSize} flex items-center justify-center border-y border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(lowerData)}`}
          onPointerDown={() => {
            let nextState = { isMissing: false, isPrimary: false };
            if (lowerData.id >= 6) {
              if (lowerData.isMissing) {
                nextState = { isMissing: false, isPrimary: false };
              } else {
                nextState = { isMissing: true, isPrimary: false };
              }
            } else {
              if (lowerData.isMissing) {
                nextState = { isMissing: false, isPrimary: true };
              } else if (lowerData.isPrimary) {
                nextState = { isMissing: false, isPrimary: false };
              } else {
                nextState = { isMissing: true, isPrimary: false };
              }
            }
            onUpdateLower({ ...lowerData, ...nextState });
          }}
          title="下顎: クリックで状態切替 (永久歯/欠損/乳歯)"
        >
          {formatToothId(lowerData.id, lowerData.isPrimary)}
        </div>

        {/* === LOWER JAW (Bottom Section) === */}
        <div className="flex flex-col w-full relative">
          {lowerData.isMissing && <MissingOverlay />}
          {/* Measurements (Lower Buccal) */}
          {/* Chart (1..15) -> Bleeding -> Pus | Inverted=true puts 1 at top */}
          <PocketDepthChart
            values={lowerData.pocketDepth.buccal}
            onChange={(idx, val) => updateLower('pocketDepth', 'buccal', idx, val)}
            isInverted={true}
            singlePoint={true}
          />
          <ThreePointToggle type="bleeding" values={lowerData.bleeding.buccal} onChange={(idx, val) => updateLower('bleeding', 'buccal', idx, val)} singlePoint={true} />
          <ThreePointToggle type="pus" values={lowerData.pus.buccal} onChange={(idx, val) => updateLower('pus', 'buccal', idx, val)} singlePoint={true} />

          {/* Mobility (Lower) */}
          {renderMobilityToggle(lowerData.mobility, handleLowerMobilitySelect, 'border-t border-[#ccc]')}
          {/* Plaque Diagram (Lower) */}
          <div className="border-t border-[#ccc] w-full">
            <PlaqueDiagram
              value={lowerData.plaque}
              onChange={handleLowerPlaqueChange}
              onToggleAll={() => {
                const all = Object.values(lowerData.plaque).every(v => v);
                const n = !all;
                onUpdateLower({ ...lowerData, plaque: { distal: n, buccal: n, mesial: n, lingual: n, occlusal: n } });
              }}
              variant="simple"
            />
          </div>
        </div>
      </div>
    );
  }

  // === 4-POINT CUSTOM LAYOUT (Buccal 2 points, Lingual 2 points) ===
  if (is4Point) {
    // 2 points: Indices 0 (Left) and 2 (Right). Skips 1 (Center).
    const points4: MeasurementPoint[] = [0, 2];

    if (jaw === 'upper') {
      // Layout: Buccal (Top) -> ID -> Lingual (Bottom)
      return (
        <div className={`flex-1 flex flex-col border border-[#999] bg-white select-none shadow-sm ${toothWidthClass}`}>
          {/* TOP BLOCK: BUCCAL (2-point, Outer) */}
          <div className="flex flex-col w-full relative">
            {data.isMissing && <MissingOverlay />}
            {/* 1. Plaque (Most Outer / Top) */}
            <div className={`border-b border-[#ccc] w-full ${isLarge ? 'h-[70px]' : ''}`}>
              <PlaqueDiagram value={data.plaque} onChange={handlePlaqueChange} onToggleAll={handlePlaqueToggleAll} variant="simple" />
            </div>

            {/* 2. Mobility (Next to Pus) */}
            {renderMobilityToggle(data.mobility, handleMobilitySelect, 'border-b border-[#ccc]')}

            {/* 3. Pus (Buccal) - 2 Points */}
            <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} displayPoints={points4} />

            {/* 4. Bleeding (Buccal) - 2 Points */}
            <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} displayPoints={points4} />

            {/* 5. Pocket Depth (Buccal) - 2 Points */}
            <PocketDepthChart
              values={data.pocketDepth.buccal}
              onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)}
              isInverted={false}
              displayPoints={points4}
            />
          </div>

          {/* TOOTH ID */}
          <div
            className={`font-bold ${toothIdHeight} ${toothIdTextSize} flex items-center justify-center border-y border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(data)}`}
            onPointerDown={handleStatusChange}
            title="クリックで状態切替 (永久歯/欠損/乳歯)"
          >
            {formatToothId(data.id, data.isPrimary)}
          </div>

          {/* BOTTOM BLOCK: LINGUAL (2-point, Inner) */}
          <div className="flex flex-col w-full relative">
            {data.isMissing && <MissingOverlay />}
            {/* 1. Pocket Depth (Lingual) - 2 Points */}
            <PocketDepthChart
              values={data.pocketDepth.lingual}
              onChange={(idx, val) => updateMeasurement('pocketDepth', 'lingual', idx, val)}
              isInverted={true}
              displayPoints={points4}
            />

            {/* 2. Bleeding (Lingual) - 2 Points */}
            <ThreePointToggle type="bleeding" values={data.bleeding.lingual} onChange={(idx, val) => updateMeasurement('bleeding', 'lingual', idx, val)} displayPoints={points4} />

            {/* 3. Pus (Lingual) - 2 Points */}
            <ThreePointToggle type="pus" values={data.pus.lingual} onChange={(idx, val) => updateMeasurement('pus', 'lingual', idx, val)} displayPoints={points4} />
          </div>
        </div>
      );
    } else {
      // jaw === 'lower'
      // Layout: Lingual (Top) -> ID -> Buccal (Bottom)
      return (
        <div className={`flex-1 flex flex-col border border-[#999] bg-white select-none shadow-sm ${toothWidthClass}`}>
          {/* TOP BLOCK: LINGUAL (2-point, Inner) */}
          <div className="flex flex-col w-full relative">
            {data.isMissing && <MissingOverlay />}
            {/* 1. Pus (Lingual) - 2 Points */}
            <ThreePointToggle type="pus" values={data.pus.lingual} onChange={(idx, val) => updateMeasurement('pus', 'lingual', idx, val)} displayPoints={points4} />

            {/* 2. Bleeding (Lingual) - 2 Points */}
            <ThreePointToggle type="bleeding" values={data.bleeding.lingual} onChange={(idx, val) => updateMeasurement('bleeding', 'lingual', idx, val)} displayPoints={points4} />

            {/* 3. Pocket Depth (Lingual) - 2 Points */}
            <PocketDepthChart
              values={data.pocketDepth.lingual}
              onChange={(idx, val) => updateMeasurement('pocketDepth', 'lingual', idx, val)}
              isInverted={false}
              displayPoints={points4}
            />
          </div>

          {/* TOOTH ID */}
          <div
            className={`font-bold ${toothIdHeight} ${toothIdTextSize} flex items-center justify-center border-y border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(data)}`}
            onPointerDown={handleStatusChange}
            title="クリックで状態切替 (永久歯/欠損/乳歯)"
          >
            {formatToothId(data.id, data.isPrimary)}
          </div>

          {/* BOTTOM BLOCK: BUCCAL (2-point, Outer) */}
          <div className="flex flex-col w-full relative">
            {data.isMissing && <MissingOverlay />}
            {/* 1. Pocket Depth (Buccal) - 2 Points */}
            <PocketDepthChart
              values={data.pocketDepth.buccal}
              onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)}
              isInverted={true}
              displayPoints={points4}
            />

            {/* 2. Bleeding (Buccal) - 2 Points */}
            <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} displayPoints={points4} />

            {/* 3. Pus (Buccal) - 2 Points */}
            <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} displayPoints={points4} />

            {/* 4. Mobility */}
            {renderMobilityToggle(data.mobility, handleMobilitySelect, 'border-t border-[#ccc]')}

            {/* 5. Plaque */}
            <div className={`border-t border-[#ccc] w-full ${isLarge ? 'h-[70px]' : ''}`}>
              <PlaqueDiagram value={data.plaque} onChange={handlePlaqueChange} onToggleAll={handlePlaqueToggleAll} variant="simple" />
            </div>
          </div>
        </div>
      );
    }
  }

  // === STANDARD 6-POINT VIEW LOGIC ===
  // Revised for correct labeling:
  // Upper Jaw: Top Block = Outer/Buccal, Bottom Block = Inner/Lingual
  // Lower Jaw: Top Block = Inner/Lingual, Bottom Block = Outer/Buccal

  // Define content variables instead of inner components to avoid remounting on every render

  const isUpper = jaw === 'upper';
  const cellCount = getCellCount(data.id, isUpper);
  const furcationValues = getFurcationValues(data, cellCount);

  // complexAContent: The "Outer" block logic (Contains Plaque/Mobility logic)
  // Now mapped to BUCCAL Data
  const complexAContent = (
    <div className="flex flex-col w-full relative">
      {data.isMissing && <MissingOverlay />}
      {jaw === 'upper' && (
        <>
          {method === '6-point' && (
            <>
              <div className="border-b border-[#ccc] w-full">
                <FurcationInput
                  values={furcationValues}
                  onChange={handleFurcationChange}
                  variant={getFurcationVariant(data.id, isUpper)}
                  disabled={data.isMissing}
                />
              </div>
              <div className="h-2 bg-slate-100 border-b border-[#ccc] w-full" />
            </>
          )}
          {/* Plaque Diagram (Outer Most) */}
          <div className={`border-b border-[#ccc] w-full ${isLarge ? 'h-[70px]' : ''}`}>
            <PlaqueDiagram
              value={data.plaque}
              onChange={handlePlaqueChange}
              onToggleAll={handlePlaqueToggleAll}
              variant="simple"
            />
          </div>
          {renderMobilityToggle(data.mobility, handleMobilitySelect, 'border-b border-[#ccc]')}
        </>
      )}

      {/* BUCCAL Data in the Outer Block */}
      {jaw === 'upper' ? (
        <>
          <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} singlePoint={buccalSinglePoint} />
          <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} singlePoint={buccalSinglePoint} />
          <PocketDepthChart
            values={data.pocketDepth.buccal}
            onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)}
            isInverted={false}
            singlePoint={buccalSinglePoint}
          />
        </>
      ) : (
        <>
          <PocketDepthChart
            values={data.pocketDepth.buccal}
            onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)}
            isInverted={true}
            singlePoint={buccalSinglePoint}
          />
          <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} singlePoint={buccalSinglePoint} />
          <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} singlePoint={buccalSinglePoint} />
        </>
      )}

      {jaw === 'lower' && (
        <>
          {renderMobilityToggle(data.mobility, handleMobilitySelect, 'border-t border-[#ccc]')}
          <div className={`border-t border-[#ccc] w-full ${isLarge ? 'h-[70px]' : ''}`}>
            <PlaqueDiagram
              value={data.plaque}
              onChange={handlePlaqueChange}
              onToggleAll={handlePlaqueToggleAll}
              variant="simple"
            />
          </div>
          {method === '6-point' && (
            <>
              <div className="h-2 bg-slate-100 border-t border-[#ccc] w-full" />
              <div className="border-t border-[#ccc] w-full">
                <FurcationInput
                  values={furcationValues}
                  onChange={handleFurcationChange}
                  variant={getFurcationVariant(data.id, isUpper)}
                  disabled={data.isMissing}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  // complexBContent: The "Inner" block logic
  // Now mapped to LINGUAL Data
  const complexBContent = (
    <div className="flex flex-col w-full relative">
      {data.isMissing && <MissingOverlay />}
      {jaw === 'upper' ? (
        <>
          <PocketDepthChart
            values={data.pocketDepth.lingual}
            onChange={(idx, val) => updateMeasurement('pocketDepth', 'lingual', idx, val)}
            isInverted={true}
            singlePoint={lingualSinglePoint}
          />
          <ThreePointToggle type="bleeding" values={data.bleeding.lingual} onChange={(idx, val) => updateMeasurement('bleeding', 'lingual', idx, val)} singlePoint={lingualSinglePoint} />
          <ThreePointToggle type="pus" values={data.pus.lingual} onChange={(idx, val) => updateMeasurement('pus', 'lingual', idx, val)} singlePoint={lingualSinglePoint} />
        </>
      ) : (
        <>
          <ThreePointToggle type="pus" values={data.pus.lingual} onChange={(idx, val) => updateMeasurement('pus', 'lingual', idx, val)} singlePoint={lingualSinglePoint} />
          <ThreePointToggle type="bleeding" values={data.bleeding.lingual} onChange={(idx, val) => updateMeasurement('bleeding', 'lingual', idx, val)} singlePoint={lingualSinglePoint} />
          <PocketDepthChart
            values={data.pocketDepth.lingual}
            onChange={(idx, val) => updateMeasurement('pocketDepth', 'lingual', idx, val)}
            isInverted={false}
            singlePoint={lingualSinglePoint}
          />
        </>
      )}
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col border border-[#999] bg-white select-none shadow-sm ${toothWidthClass}`}>

      {/* TOP BLOCK */}
      {jaw === 'upper' ? complexAContent : complexBContent}

      {/* ================= TOOTH ID ================= */}
      <div
        className={`font-bold ${toothIdHeight} ${toothIdTextSize} flex items-center justify-center border-y border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(data)}`}
        onPointerDown={handleStatusChange}
        title="クリックで状態切替 (永久歯/欠損/乳歯)"
      >
        {formatToothId(data.id, data.isPrimary)}
      </div>

      {/* BOTTOM BLOCK */}
      {jaw === 'upper' ? complexBContent : complexAContent}

    </div>
  );
};

export default React.memo(Tooth, (prev, next) => {
  return prev.data === next.data && prev.lowerData === next.lowerData && prev.jaw === next.jaw && prev.method === next.method;
});
