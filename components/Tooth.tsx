import React from 'react';
import { ToothData, Surface, MeasurementPoint } from '../types';
import PlaqueDiagram from './PlaqueDiagram';
import ThreePointToggle from './ThreePointToggle';
import PocketDepthChart from './PocketDepthChart';

interface ToothProps {
  data: ToothData;
  onUpdate: (data: ToothData) => void;
}

const Tooth: React.FC<ToothProps> = ({ data, onUpdate }) => {
  
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
    const newVal = Math.max(0, data.mobility + delta);
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

  // Compact Mobility Row
  const MobilityRow = () => (
    <div className="h-[24px] flex items-center justify-between px-1 bg-[#fafafa] border-b border-[#ccc]">
      <button 
        className="w-[18px] h-[18px] text-[14px] leading-none font-bold flex items-center justify-center border border-gray-400 rounded bg-white"
        onClick={() => handleMobilityChange(-1)}
      >-</button>
      <span className="text-[12px] font-bold w-[20px] text-center">{data.mobility}</span>
      <button 
        className="w-[18px] h-[18px] text-[14px] leading-none font-bold flex items-center justify-center border border-gray-400 rounded bg-white"
        onClick={() => handleMobilityChange(1)}
      >+</button>
    </div>
  );

  return (
    <div className="w-[86px] flex flex-col border border-[#999] bg-white shrink-0 select-none">
      
      {/* ================= LINGUAL (TOP) ================= */}
      <div className="flex flex-col">
        <div className="border-b border-[#ccc]">
             {/* Labels removed, container simplified */}
             <PlaqueDiagram 
                value={data.plaque} 
                onChange={handlePlaqueChange} 
                onToggleAll={handlePlaqueToggleAll}
             />
        </div>
        <MobilityRow />
        <ThreePointToggle type="pus" values={data.pus.lingual} onChange={(idx, val) => updateMeasurement('pus', 'lingual', idx, val)} />
        <ThreePointToggle type="bleeding" values={data.bleeding.lingual} onChange={(idx, val) => updateMeasurement('bleeding', 'lingual', idx, val)} />
        <PocketDepthChart values={data.pocketDepth.lingual} onChange={(idx, val) => updateMeasurement('pocketDepth', 'lingual', idx, val)} isInverted={false} />
      </div>

      {/* ================= TOOTH ID ================= */}
      <div className="bg-[#666] text-white font-bold py-[2px] text-[12px] text-center border-y border-[#999]">
        {data.id}
      </div>

      {/* ================= BUCCAL (BOTTOM) ================= */}
      <div className="flex flex-col">
        <PocketDepthChart values={data.pocketDepth.buccal} onChange={(idx, val) => updateMeasurement('pocketDepth', 'buccal', idx, val)} isInverted={true} />
        <ThreePointToggle type="bleeding" values={data.bleeding.buccal} onChange={(idx, val) => updateMeasurement('bleeding', 'buccal', idx, val)} />
        <ThreePointToggle type="pus" values={data.pus.buccal} onChange={(idx, val) => updateMeasurement('pus', 'buccal', idx, val)} />
        {/* Footer label removed */}
      </div>

    </div>
  );
};

export default Tooth;