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

  const isSinglePoint = method === '1-point';
  const mobilityBtnClass = `${isSinglePoint ? 'w-[12px] text-[10px]' : 'w-[18px] text-[14px]'} h-full leading-none font-bold flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 rounded`;

  // === 1-POINT COMBINED VIEW LOGIC ===
  if (isSinglePoint && lowerData && onUpdateLower) {
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
            <div className="flex flex-col w-full">
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

            {/* === TOOTH ID === */}
            <div className="bg-[#666] text-white font-bold py-[2px] text-[12px] text-center border-y border-[#999]">
                {data.id}
            </div>

            {/* === LOWER JAW (Bottom Section) === */}
            <div className="flex flex-col w-full">
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
                            const all = Object.values(lowerData.plaque).every(v=>v);
                            const n = !all;
                            onUpdateLower({...lowerData, plaque: {distal:n, buccal:n, mesial:n, lingual:n, occlusal:n}});
                        }}
                        variant="simple"
                    />
                </div>
            </div>
        </div>
    );
  }

  // === STANDARD VIEW LOGIC (4-point / 6-point) ===
  
  // Define content variables instead of inner components to avoid remounting on every render
  const complexAContent = (
    <div className="flex flex-col w-full">
       {/* Upper: Top position (Lingual/Palatal), Lower: Bottom position (Lingual) */}
       
       {jaw === 'upper' && (
         <>
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

      {/* 
        Lingual Measurements
        Upper (Top Block): Pus -> Bleeding -> Chart (15..1)
        Lower (Bottom Block): Chart (1..15) -> Bleeding -> Pus
      */}
      {jaw === 'upper' ? (
        <>
            <ThreePointToggle type="pus" values={data.pus.lingual} onChange={(idx, val) => updateMeasurement('pus', 'lingual', idx, val)} singlePoint={isSinglePoint} />
            <ThreePointToggle type="bleeding" values={data.bleeding.lingual} onChange={(idx, val) => updateMeasurement('bleeding', 'lingual', idx, val)} singlePoint={isSinglePoint} />
            <PocketDepthChart 
                values={data.pocketDepth.lingual} 
                onChange={(idx, val) => updateMeasurement('pocketDepth', 'lingual', idx, val)} 
                isInverted={false} 
                singlePoint={isSinglePoint}
            />
        </>
      ) : (
        <>
            <PocketDepthChart 
                values={data.pocketDepth.lingual} 
                onChange={(idx, val) => updateMeasurement('pocketDepth', 'lingual', idx, val)} 
                isInverted={true} 
                singlePoint={isSinglePoint}
            />
            <ThreePointToggle type="bleeding" values={data.bleeding.lingual} onChange={(idx, val) => updateMeasurement('bleeding', 'lingual', idx, val)} singlePoint={isSinglePoint} />
            <ThreePointToggle type="pus" values={data.pus.lingual} onChange={(idx, val) => updateMeasurement('pus', 'lingual', idx, val)} singlePoint={isSinglePoint} />
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

  const complexBContent = (
    <div className="flex flex-col w-full">
      {/* 
        Buccal Measurements
        Upper (Bottom Block): Chart (1..15) -> Bleeding -> Pus
        Lower (Top Block): Pus -> Bleeding -> Chart (15..1)
      */}
      {jaw === 'upper' ? (
        <>
          <PocketDepthChart 
            values={data.pocketDepth.buccal} 
            onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)} 
            isInverted={true} 
            singlePoint={isSinglePoint}
          />
          <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} singlePoint={isSinglePoint} />
          <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} singlePoint={isSinglePoint} />
        </>
      ) : (
        <>
          <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} singlePoint={isSinglePoint} />
          <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} singlePoint={isSinglePoint} />
          <PocketDepthChart 
            values={data.pocketDepth.buccal} 
            onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)} 
            isInverted={false} 
            singlePoint={isSinglePoint}
          />
        </>
      )}
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col border border-[#999] bg-white select-none shadow-sm ${isSinglePoint ? 'min-w-[28px] max-w-[45px]' : 'min-w-[50px] max-w-[120px]'}`}>
      
      {/* TOP BLOCK */}
      {jaw === 'upper' ? complexAContent : complexBContent}

      {/* ================= TOOTH ID ================= */}
      <div className="bg-[#666] text-white font-bold py-[2px] text-[12px] text-center border-y border-[#999]">
        {data.id}
      </div>

      {/* BOTTOM BLOCK */}
      {jaw === 'upper' ? complexBContent : complexAContent}

    </div>
  );
};

export default React.memo(Tooth, (prev, next) => {
  return prev.data === next.data && prev.lowerData === next.lowerData && prev.jaw === next.jaw && prev.method === next.method;
});