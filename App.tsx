import React, { useState } from 'react';
import Tooth from './components/Tooth';
import { ToothData, MeasurementMethod } from './types';

// Helper to create a single tooth
const createTooth = (id: number): ToothData => ({
  id,
  mobility: 0,
  plaque: { distal: false, buccal: false, mesial: false, lingual: false, occlusal: false },
  pus: { buccal: [false, false, false], lingual: [false, false, false] },
  bleeding: { buccal: [false, false, false], lingual: [false, false, false] },
  pocketDepth: { buccal: [null, null, null], lingual: [null, null, null] },
});

// Helper to generate a range of teeth
const generateTeeth = (ids: number[]) => ids.map(createTooth);

type Quadrant = 'UL' | 'UR' | 'LL' | 'LR';

// MiniMap Component for visual navigation
const MiniMap: React.FC<{ current: Quadrant; onSelect: (q: Quadrant) => void; disabled?: boolean }> = ({ current, onSelect, disabled }) => {
  const Quad = ({ q, label, rounded }: { q: Quadrant; label: string; rounded: string }) => {
    const isActive = current === q && !disabled;
    return (
      <button
        onClick={() => !disabled && onSelect(q)}
        disabled={disabled}
        className={`w-10 h-8 flex items-center justify-center text-[10px] font-bold border transition-all duration-200 select-none
          ${isActive 
            ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-105 z-10 ring-1 ring-blue-300' 
            : 'bg-white text-slate-400 border-slate-300'}
          ${!disabled && !isActive ? 'hover:bg-slate-50 hover:text-slate-600' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${rounded}
        `}
        aria-label={`View ${label}`}
        title={label}
      >
        {q}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-[1px] bg-slate-200 p-[2px] rounded border border-slate-300 shadow-inner">
      <div className="flex gap-[1px]">
        {/* Visual Layout: Patient Right is Viewer Left (UR), Patient Left is Viewer Right (UL) */}
        <Quad q="UR" label="Upper Right" rounded="rounded-tl-sm" />
        <Quad q="UL" label="Upper Left" rounded="rounded-tr-sm" />
      </div>
      <div className="flex gap-[1px]">
        <Quad q="LR" label="Lower Right" rounded="rounded-bl-sm" />
        <Quad q="LL" label="Lower Left" rounded="rounded-br-sm" />
      </div>
    </div>
  );
};

const MethodTab: React.FC<{ current: MeasurementMethod; onChange: (m: MeasurementMethod) => void }> = ({ current, onChange }) => {
  const Tab = ({ method, label }: { method: MeasurementMethod; label: string }) => {
    const isActive = current === method;
    return (
      <button
        onClick={() => onChange(method)}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 select-none
          ${isActive 
            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
        `}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/60 shadow-inner items-center">
      <Tab method="1-point" label="1点法" />
      <Tab method="4-point" label="4点法" />
      <Tab method="6-point" label="6点法" />
    </div>
  );
};

const App: React.FC = () => {
  const [currentQuadrant, setCurrentQuadrant] = useState<Quadrant>('UL');
  const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>('6-point');
  
  // State holds data for all 4 quadrants
  const [teethData, setTeethData] = useState<{ UL: ToothData[]; UR: ToothData[]; LL: ToothData[]; LR: ToothData[] }>({
    UL: generateTeeth([1, 2, 3, 4, 5, 6, 7, 8]),       // Left Upper: 1 to 8 (Center to Left)
    UR: generateTeeth([8, 7, 6, 5, 4, 3, 2, 1]),       // Right Upper: 8 to 1 (Right to Center)
    LL: generateTeeth([1, 2, 3, 4, 5, 6, 7, 8]),       // Left Lower: 1 to 8 (Center to Left)
    LR: generateTeeth([8, 7, 6, 5, 4, 3, 2, 1]),       // Right Lower: 8 to 1 (Right to Center)
  });

  const handleToothUpdate = (quadrant: Quadrant, updatedTooth: ToothData) => {
    setTeethData(prev => ({
      ...prev,
      [quadrant]: prev[quadrant].map(t => t.id === updatedTooth.id ? updatedTooth : t)
    }));
  };

  // Navigation Logic
  const goLeft = () => {
    if (currentQuadrant === 'UL') setCurrentQuadrant('UR');
    if (currentQuadrant === 'LL') setCurrentQuadrant('LR');
  };

  const goRight = () => {
    if (currentQuadrant === 'UR') setCurrentQuadrant('UL');
    if (currentQuadrant === 'LR') setCurrentQuadrant('LL');
  };

  const goDown = () => {
    if (currentQuadrant === 'UL') setCurrentQuadrant('LL');
    if (currentQuadrant === 'UR') setCurrentQuadrant('LR');
  };

  const goUp = () => {
    if (currentQuadrant === 'LL') setCurrentQuadrant('UL');
    if (currentQuadrant === 'LR') setCurrentQuadrant('UR');
  };

  // Layout Logic for 2x2 Grid (6-point/4-point)
  // [ UR ] [ UL ]  <-- Row 1
  // [ LR ] [ LL ]  <-- Row 2
  const getTranslate = () => {
    switch (currentQuadrant) {
      case 'UR': return 'translate(0%, 0%)';
      case 'UL': return 'translate(-50%, 0%)';
      case 'LR': return 'translate(0%, -50%)';
      case 'LL': return 'translate(-50%, -50%)';
    }
  };

  const showLeftControls = currentQuadrant === 'UL' || currentQuadrant === 'LL';
  const showRightControls = currentQuadrant === 'UR' || currentQuadrant === 'LR';
  const isLower = currentQuadrant === 'LL' || currentQuadrant === 'LR';

  const RedVerticalButton = () => (
    <button 
      onClick={currentQuadrant.startsWith('U') ? goDown : goUp}
      className={`w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 active:bg-red-700 transition-all duration-300`}
      aria-label={currentQuadrant.startsWith('U') ? "Go Down" : "Go Up"}
    >
        {currentQuadrant.startsWith('U') ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        )}
    </button>
  );

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header - Compact */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-2 sticky top-0 z-50 shrink-0">
        <div className="max-w-full mx-auto flex justify-between items-center gap-4">
          
          {/* Measurement Method Tabs */}
          <div className="flex-1 flex justify-center">
            <MethodTab current={measurementMethod} onChange={setMeasurementMethod} />
          </div>

          {/* MiniMap for Navigation and Orientation - Hidden in 1-point mode but keeps layout size */}
          <div className={measurementMethod === '1-point' ? 'invisible pointer-events-none' : ''}>
            <MiniMap 
              current={currentQuadrant} 
              onSelect={setCurrentQuadrant} 
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-center justify-center overflow-hidden relative p-1 md:p-2">
        
        {/* Navigation Wrapper */}
        <div className="w-full h-full flex items-center justify-center gap-1 relative max-w-7xl mx-auto">

          {/* LEFT CONTROLS COLUMN (Active for UL/LL) - Hide in 1-point mode */}
          {measurementMethod !== '1-point' && (
            <div className="flex flex-col gap-2 z-20 shrink-0 w-10 self-center">
               
               {/* Red Button (UP) - Displayed ABOVE Blue Arrow for Lower Jaw */}
               {isLower && showLeftControls && <RedVerticalButton />}
  
               {/* LEFT ARROW (To go UR/LR) */}
              <button 
                  onClick={goLeft}
                  disabled={!showLeftControls}
                  className={`w-10 h-24 flex items-center justify-center bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 active:bg-blue-800 transition-opacity duration-300 ${ showLeftControls ? 'opacity-100' : 'opacity-0 pointer-events-none' }`}
                  aria-label="Go Left"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
              </button>
  
              {/* Red Button (DOWN) - Displayed BELOW Blue Arrow for Upper Jaw */}
              {!isLower && showLeftControls && <RedVerticalButton />}
            </div>
          )}

          {/* Sliding Viewport Container (The "One Screen") */}
          <div className="flex-1 h-full overflow-hidden relative border border-slate-200 bg-slate-50 rounded-lg shadow-inner">
            
            {/* 
                CONDITIONAL RENDER: 
                If '1-point', show Full Mouth Layout (Upper Jaw Only per request).
                Otherwise, show the original 2x2 Sliding Grid.
            */}
            {measurementMethod === '1-point' ? (
                // === 1-POINT FULL MOUTH LAYOUT ===
                <div className="w-full h-full overflow-hidden p-2 flex items-center justify-center touch-none select-none">
                    
                    {/* FULL ARCH (Upper and Lower Combined in one visual row) */}
                    <div className="flex justify-center gap-1">
                        {/* UR (8-1) and LR (8-1) */}
                        <div className="flex gap-[1px] bg-white p-1 rounded border border-slate-300 shadow-sm">
                            {teethData.UR.map((tooth, index) => (
                                <Tooth 
                                    key={tooth.id} 
                                    data={tooth} 
                                    lowerData={teethData.LR[index]}
                                    onUpdate={(t) => handleToothUpdate('UR', t)} 
                                    onUpdateLower={(t) => handleToothUpdate('LR', t)}
                                    jaw="upper" 
                                    method="1-point" 
                                />
                            ))}
                        </div>
                        <div className="w-2 shrink-0"></div>
                        {/* UL (1-8) and LL (1-8) */}
                        <div className="flex gap-[1px] bg-white p-1 rounded border border-slate-300 shadow-sm">
                            {teethData.UL.map((tooth, index) => (
                                <Tooth 
                                    key={tooth.id} 
                                    data={tooth} 
                                    lowerData={teethData.LL[index]}
                                    onUpdate={(t) => handleToothUpdate('UL', t)} 
                                    onUpdateLower={(t) => handleToothUpdate('LL', t)}
                                    jaw="upper" 
                                    method="1-point" 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // === EXISTING 6-POINT LAYOUT (UNCHANGED LOGIC) ===
                <div 
                className="flex flex-wrap w-[200%] h-[200%] transition-transform duration-500 ease-in-out will-change-transform"
                style={{ transform: getTranslate() }}
                >
                
                {/* === ROW 1: UPPER JAW === */}
                {/* [0,0] UPPER RIGHT - Aligned LEFT (justify-start), Gap on RIGHT (midline) */}
                <div className="w-1/2 h-1/2 flex items-center justify-start bg-slate-100 p-1 md:p-2 pr-8 md:pr-24">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col justify-center overflow-hidden">
                    <div className="flex justify-between w-full h-full gap-[1px]">
                        {teethData.UR.map(tooth => (
                        <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('UR', t)} jaw="upper" method={measurementMethod} />
                        ))}
                    </div>
                    </div>
                </div>

                {/* [0,1] UPPER LEFT - Aligned RIGHT (justify-end), Gap on LEFT (midline) */}
                <div className="w-1/2 h-1/2 flex items-center justify-end bg-slate-100 p-1 md:p-2 pl-8 md:pl-24">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col justify-center overflow-hidden">
                    <div className="flex justify-between w-full h-full gap-[1px]">
                        {teethData.UL.map(tooth => (
                        <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('UL', t)} jaw="upper" method={measurementMethod} />
                        ))}
                    </div>
                    </div>
                </div>

                {/* === ROW 2: LOWER JAW === */}
                {/* [1,0] LOWER RIGHT - Aligned LEFT (justify-start), Gap on RIGHT (midline) */}
                <div className="w-1/2 h-1/2 flex items-center justify-start bg-slate-100 p-1 md:p-2 pr-8 md:pr-24">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col justify-center overflow-hidden">
                    <div className="flex justify-between w-full h-full gap-[1px]">
                        {teethData.LR.map(tooth => (
                        <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('LR', t)} jaw="lower" method={measurementMethod} />
                        ))}
                    </div>
                    </div>
                </div>

                {/* [1,1] LOWER LEFT - Aligned RIGHT (justify-end), Gap on LEFT (midline) */}
                <div className="w-1/2 h-1/2 flex items-center justify-end bg-slate-100 p-1 md:p-2 pl-8 md:pl-24">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col justify-center overflow-hidden">
                    <div className="flex justify-between w-full h-full gap-[1px]">
                        {teethData.LL.map(tooth => (
                        <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('LL', t)} jaw="lower" method={measurementMethod} />
                        ))}
                    </div>
                    </div>
                </div>

                </div>
            )}
          </div>

          {/* RIGHT CONTROLS COLUMN (Active for UR/LR) - Hide in 1-point mode */}
          {measurementMethod !== '1-point' && (
            <div className="flex flex-col gap-2 z-20 shrink-0 w-10 self-center">
               
               {/* Red Button (UP) - Displayed ABOVE Blue Arrow for Lower Jaw */}
               {isLower && showRightControls && <RedVerticalButton />}
  
               {/* RIGHT ARROW (To go UL/LL) */}
              <button 
                  onClick={goRight}
                  disabled={!showRightControls}
                  className={`w-10 h-24 flex items-center justify-center bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 active:bg-blue-800 transition-opacity duration-300 ${ showRightControls ? 'opacity-100' : 'opacity-0 pointer-events-none' }`}
                  aria-label="Go Right"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
              </button>
              
              {/* Red Button (DOWN) - Displayed BELOW Blue Arrow for Upper Jaw */}
              {!isLower && showRightControls && <RedVerticalButton />}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;