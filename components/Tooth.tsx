import React from 'react';
import { ToothData, Surface, MeasurementPoint, MeasurementMethod } from '../types';
import PlaqueDiagram from './PlaqueDiagram';
import ThreePointToggle from './ThreePointToggle';
import PocketDepthChart from './PocketDepthChart';

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

  const handleMobilityChange = (delta: number) => {
    const newVal = Math.min(3, Math.max(0, data.mobility + delta));
    onUpdate({ ...data, mobility: newVal });
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

  // Handler for toggling lower jaw status (1-point mode)
  const handleLowerStatusChange = () => {
    if (!lowerData || !onUpdateLower) return;
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
  };

  const is1Point = method === '1-point';
  const is4Point = method === '4-point';

  // 4-point method: Buccal = 2 points, Lingual = 2 points
  // 1-point method: All = 1 point
  const lingualSinglePoint = is1Point;
  const buccalSinglePoint = is1Point;

  const mobilityBtnClass = `${is1Point ? 'w-[12px] text-[10px]' : 'w-[18px] text-[14px]'} h-full leading-none font-bold flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 rounded`;

  // Missing Overlay Component
  const MissingOverlay = () => (
    <div className="absolute inset-0 bg-slate-300/80 z-30 flex items-center justify-center pointer-events-auto cursor-not-allowed">
      <span className="text-[10px] font-bold text-slate-600 bg-white/50 px-1 rounded transform -rotate-45">欠損</span>
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

    const handleLowerMobilityChange = (delta: number) => {
      const newVal = Math.min(3, Math.max(0, lowerData.mobility + delta));
      onUpdateLower({ ...lowerData, mobility: newVal });
    };

    return (
      <div className={`flex-1 flex flex-col border border-[#999] bg-white select-none shadow-sm min-w-[28px] max-w-[45px]`}>
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
          <div className="h-[24px] flex items-center justify-between px-1 bg-[#fafafa] border-b border-[#ccc]">
            <button className={mobilityBtnClass} onClick={() => handleMobilityChange(-1)}>-</button>
            <span className="text-[12px] font-bold flex-1 text-center">{data.mobility}</span>
            <button className={mobilityBtnClass} onClick={() => handleMobilityChange(1)}>+</button>
          </div>
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

        {/* === TOOTH ID (Upper) === */}
        <div
          className={`font-bold py-[5px] text-[11px] text-center border-t border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(data)}`}
          onClick={handleStatusChange}
          title="上顎: クリックで状態切替 (永久歯/欠損/乳歯)"
        >
          {formatToothId(data.id, data.isPrimary)}
        </div>
        {/* === TOOTH ID (Lower) === */}
        <div
          className={`font-bold py-[5px] text-[11px] text-center border-y border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(lowerData)}`}
          onClick={handleLowerStatusChange}
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
          <div className="h-[24px] flex items-center justify-between px-1 bg-[#fafafa] border-t border-[#ccc]">
            <button className={mobilityBtnClass} onClick={() => handleLowerMobilityChange(-1)}>-</button>
            <span className="text-[12px] font-bold flex-1 text-center">{lowerData.mobility}</span>
            <button className={mobilityBtnClass} onClick={() => handleLowerMobilityChange(1)}>+</button>
          </div>
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
        <div className="flex-1 flex flex-col border border-[#999] bg-white select-none shadow-sm min-w-[50px] max-w-[120px]">
          {/* TOP BLOCK: BUCCAL (2-point, Outer) */}
          <div className="flex flex-col w-full relative">
            {data.isMissing && <MissingOverlay />}
            {/* 1. Plaque (Most Outer / Top) */}
            <div className="border-b border-[#ccc] w-full">
              <PlaqueDiagram value={data.plaque} onChange={handlePlaqueChange} onToggleAll={handlePlaqueToggleAll} variant="simple" />
            </div>

            {/* 2. Mobility (Next to Pus) */}
            <div className="h-[24px] flex items-center justify-between px-1 bg-[#fafafa] border-b border-[#ccc]">
              <button className={mobilityBtnClass} onClick={() => handleMobilityChange(-1)}>-</button>
              <span className="text-[12px] font-bold flex-1 text-center">{data.mobility}</span>
              <button className={mobilityBtnClass} onClick={() => handleMobilityChange(1)}>+</button>
            </div>

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
            className={`font-bold py-[2px] text-[12px] text-center border-y border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(data)}`}
            onClick={handleStatusChange}
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
        <div className="flex-1 flex flex-col border border-[#999] bg-white select-none shadow-sm min-w-[50px] max-w-[120px]">
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
            className={`font-bold py-[2px] text-[12px] text-center border-y border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(data)}`}
            onClick={handleStatusChange}
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
            <div className="h-[24px] flex items-center justify-between px-1 bg-[#fafafa] border-t border-[#ccc]">
              <button className={mobilityBtnClass} onClick={() => handleMobilityChange(-1)}>-</button>
              <span className="text-[12px] font-bold flex-1 text-center">{data.mobility}</span>
              <button className={mobilityBtnClass} onClick={() => handleMobilityChange(1)}>+</button>
            </div>

            {/* 5. Plaque */}
            <div className="border-t border-[#ccc] w-full">
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

  // complexAContent: The "Outer" block logic (Contains Plaque/Mobility logic)
  // Now mapped to BUCCAL Data
  const complexAContent = (
    <div className="flex flex-col w-full relative">
      {data.isMissing && <MissingOverlay />}
      {jaw === 'upper' && (
        <>
          {/* Plaque Diagram (Outer Most) */}
          <div className="border-b border-[#ccc] w-full">
            <PlaqueDiagram
              value={data.plaque}
              onChange={handlePlaqueChange}
              onToggleAll={handlePlaqueToggleAll}
              variant="simple"
            />
          </div>
          <div className="h-[24px] flex items-center justify-between px-1 bg-[#fafafa] border-b border-[#ccc]">
            <button
              className={mobilityBtnClass}
              onClick={() => handleMobilityChange(-1)}
            >-</button>
            <span className="text-[12px] font-bold flex-1 text-center">{data.mobility}</span>
            <button
              className={mobilityBtnClass}
              onClick={() => handleMobilityChange(1)}
            >+</button>
          </div>
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
          <div className="h-[24px] flex items-center justify-between px-1 bg-[#fafafa] border-t border-[#ccc]">
            <button
              className={mobilityBtnClass}
              onClick={() => handleMobilityChange(-1)}
            >-</button>
            <span className="text-[12px] font-bold flex-1 text-center">{data.mobility}</span>
            <button
              className={mobilityBtnClass}
              onClick={() => handleMobilityChange(1)}
            >+</button>
          </div>
          <div className="border-t border-[#ccc] w-full">
            <PlaqueDiagram
              value={data.plaque}
              onChange={handlePlaqueChange}
              onToggleAll={handlePlaqueToggleAll}
              variant="simple"
            />
          </div>
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
    <div className={`flex-1 flex flex-col border border-[#999] bg-white select-none shadow-sm ${is1Point ? 'min-w-[28px] max-w-[45px]' : 'min-w-[50px] max-w-[120px]'}`}>

      {/* TOP BLOCK */}
      {jaw === 'upper' ? complexAContent : complexBContent}

      {/* ================= TOOTH ID ================= */}
      <div
        className={`font-bold py-[2px] text-[12px] text-center border-y border-[#999] cursor-pointer hover:opacity-80 transition-colors ${getIdClass(data)}`}
        onClick={handleStatusChange}
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