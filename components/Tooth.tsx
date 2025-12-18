import React from 'react';
import { ToothData, Surface, MeasurementPoint } from '../types';
import PlaqueDiagram from './PlaqueDiagram';
import ThreePointToggle from './ThreePointToggle';
import PocketDepthChart from './PocketDepthChart';

interface ToothProps {
  data: ToothData;
  onUpdate: (data: ToothData) => void;
  jaw: 'upper' | 'lower';
}

const Tooth: React.FC<ToothProps> = ({ data, onUpdate, jaw }) => {
  
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
              />
          </div>
          <div className="h-[24px] flex items-center justify-between px-1 bg-[#fafafa] border-b border-[#ccc]">
            <button 
                className="w-[18px] h-full text-[14px] leading-none font-bold flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 rounded"
                onClick={() => handleMobilityChange(-1)}
            >-</button>
            <span className="text-[12px] font-bold flex-1 text-center">{data.mobility}</span>
            <button 
                className="w-[18px] h-full text-[14px] leading-none font-bold flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 rounded"
                onClick={() => handleMobilityChange(1)}
            >+</button>
          </div>
         </>
       )}

      {/* 
        Lingual Measurements
        Upper (Top Block): Pus -> Bleeding -> Chart (15..1) | Result: Pus/Bleeding outside 15.
        Lower (Bottom Block): Chart (1..15) -> Bleeding -> Pus | Result: Bleeding/Pus outside 15.
      */}
      {jaw === 'upper' ? (
        <>
            <ThreePointToggle type="pus" values={data.pus.lingual} onChange={(idx, val) => updateMeasurement('pus', 'lingual', idx, val)} />
            <ThreePointToggle type="bleeding" values={data.bleeding.lingual} onChange={(idx, val) => updateMeasurement('bleeding', 'lingual', idx, val)} />
            <PocketDepthChart 
                values={data.pocketDepth.lingual} 
                onChange={(idx, val) => updateMeasurement('pocketDepth', 'lingual', idx, val)} 
                isInverted={false} 
            />
        </>
      ) : (
        <>
            <PocketDepthChart 
                values={data.pocketDepth.lingual} 
                onChange={(idx, val) => updateMeasurement('pocketDepth', 'lingual', idx, val)} 
                isInverted={true} 
            />
            <ThreePointToggle type="bleeding" values={data.bleeding.lingual} onChange={(idx, val) => updateMeasurement('bleeding', 'lingual', idx, val)} />
            <ThreePointToggle type="pus" values={data.pus.lingual} onChange={(idx, val) => updateMeasurement('pus', 'lingual', idx, val)} />
        </>
      )}

       {jaw === 'lower' && (
         <>
          <div className="h-[24px] flex items-center justify-between px-1 bg-[#fafafa] border-t border-[#ccc]">
            <button 
                className="w-[18px] h-full text-[14px] leading-none font-bold flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 rounded"
                onClick={() => handleMobilityChange(-1)}
            >-</button>
            <span className="text-[12px] font-bold flex-1 text-center">{data.mobility}</span>
            <button 
                className="w-[18px] h-full text-[14px] leading-none font-bold flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 rounded"
                onClick={() => handleMobilityChange(1)}
            >+</button>
          </div>
          <div className="border-t border-[#ccc] w-full">
              <PlaqueDiagram 
                  value={data.plaque} 
                  onChange={handlePlaqueChange} 
                  onToggleAll={handlePlaqueToggleAll}
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
        Upper (Bottom Block): Chart (1..15) -> Bleeding -> Pus | Result: Bleeding/Pus outside 15.
        Lower (Top Block): Pus -> Bleeding -> Chart (15..1) | Result: Pus/Bleeding outside 15.
      */}
      {jaw === 'upper' ? (
        <>
          <PocketDepthChart 
            values={data.pocketDepth.buccal} 
            onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)} 
            isInverted={true} 
          />
          <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} />
          <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} />
        </>
      ) : (
        <>
          <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} />
          <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} />
          <PocketDepthChart 
            values={data.pocketDepth.buccal} 
            onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)} 
            isInverted={false} 
          />
        </>
      )}
    </div>
  );

  return (
    <div className="flex-1 min-w-[50px] max-w-[120px] flex flex-col border border-[#999] bg-white select-none shadow-sm">
      
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

// Use React.memo with a custom comparator.
// We ignore the `onUpdate` function reference change because it's functionally stable (state setter).
// This prevents all 32 teeth from re-rendering when one updates.
export default React.memo(Tooth, (prev, next) => {
  return prev.data === next.data && prev.jaw === next.jaw;
});