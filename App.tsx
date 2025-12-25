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

// Helper to generate full mouth data structure
const generateFullMouth = () => ({
    UL: generateTeeth([1, 2, 3, 4, 5, 6, 7, 8]),       // Left Upper: 1 to 8 (Center to Left)
    UR: generateTeeth([8, 7, 6, 5, 4, 3, 2, 1]),       // Right Upper: 8 to 1 (Right to Center)
    LL: generateTeeth([1, 2, 3, 4, 5, 6, 7, 8]),       // Left Lower: 1 to 8 (Center to Left)
    LR: generateTeeth([8, 7, 6, 5, 4, 3, 2, 1]),       // Right Lower: 8 to 1 (Right to Center)
});

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
        className={`px-3 shrink-0 py-1 text-xs font-medium rounded-full transition-all duration-200 select-none text-center
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
    <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/60 shadow-inner items-center overflow-x-auto no-scrollbar">
      <Tab method="1-point" label="1点法" />
      <Tab method="4-point" label="4点法" />
      <Tab method="6-point" label="6点法" />
    </div>
  );
};

// SideLabels Component to show Buccal/Lingual text
const SideLabels = ({ jaw }: { jaw: 'upper' | 'lower' }) => {
  const topText = jaw === 'upper' ? '頬側' : '舌側';
  const bottomText = jaw === 'upper' ? '口蓋側' : '頬側';

  return (
    <div className="flex flex-col self-stretch items-center min-w-[40px] select-none text-slate-400 font-bold text-lg py-1">
       <div className="flex-1 flex flex-col justify-end items-center pb-[145px]">
         <span className="[writing-mode:vertical-rl] tracking-widest">{topText}</span>
       </div>
       <div className="h-[24px] w-full shrink-0"></div>
       <div className="flex-1 flex flex-col justify-start items-center pt-[145px]">
         <span className="[writing-mode:vertical-rl] tracking-widest">{bottomText}</span>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentQuadrant, setCurrentQuadrant] = useState<Quadrant>('UL');
  const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>('6-point');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [allTeethData, setAllTeethData] = useState<Record<MeasurementMethod, { UL: ToothData[]; UR: ToothData[]; LL: ToothData[]; LR: ToothData[] }>>({
    '1-point': generateFullMouth(),
    '4-point': generateFullMouth(),
    '6-point': generateFullMouth(),
  });

  const currentTeethData = allTeethData[measurementMethod];

  const handleToothUpdate = (quadrant: Quadrant, updatedTooth: ToothData) => {
    setAllTeethData(prev => ({
      ...prev,
      [measurementMethod]: {
        ...prev[measurementMethod],
        [quadrant]: prev[measurementMethod][quadrant].map(t => t.id === updatedTooth.id ? updatedTooth : t)
      }
    }));
  };

  const handleConfirmDelete = () => {
    setAllTeethData(prev => ({
      ...prev,
      [measurementMethod]: generateFullMouth()
    }));
    setIsDeleteModalOpen(false);
  };

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
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-slate-900 relative">
      {/* Header - Compact */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-2 sticky top-0 z-50 shrink-0">
        <div className="max-w-full mx-auto grid grid-cols-3 items-center gap-4">
          
          {/* Column 1: Tabs, Save, Print - Left aligned, spread */}
          <div className="flex justify-between items-center pr-2">
            <MethodTab current={measurementMethod} onChange={setMeasurementMethod} />
            
            <div className="flex items-center gap-2">
                {/* 保存アイコン */}
                <button 
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center"
                title="保存"
                aria-label="Save"
                onClick={() => alert('チャートデータを保存しました')}
                >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
                </button>

                {/* プレビューアイコン */}
                <button 
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center"
                title="プレビュー"
                aria-label="Preview"
                onClick={() => window.print()}
                >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                </button>
            </div>
          </div>

          {/* Column 2: Date Picker and History Button - Precisely Centered */}
          <div className="flex justify-center items-center gap-3">
            <span className="text-sm font-bold text-slate-500 whitespace-nowrap">検査日</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all hover:bg-white h-9"
            />
            <button 
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all flex items-center gap-1.5 h-9"
              onClick={() => alert('検査履歴機能はPoC開発中です')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              検査履歴
            </button>
          </div>

          {/* Column 3: Delete Button and MiniMap - Right aligned, spread */}
          <div className="flex justify-between items-center pl-2">
            {/* 削除アイコン: 検査履歴とMAPの間に配置 */}
            <button 
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center"
              title="削除"
              aria-label="Delete"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>

            <div className={measurementMethod === '1-point' ? 'invisible pointer-events-none' : ''}>
                <MiniMap 
                current={currentQuadrant} 
                onSelect={setCurrentQuadrant} 
                />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-center justify-center overflow-hidden relative p-1 md:p-2">
        <div className="w-full h-full flex items-center justify-center gap-1 relative max-w-7xl mx-auto">

          {/* LEFT CONTROLS COLUMN */}
          {measurementMethod !== '1-point' && (
            <div className="flex flex-col gap-2 z-20 shrink-0 w-10 self-center">
               {isLower && showLeftControls && <RedVerticalButton />}
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
              {!isLower && showLeftControls && <RedVerticalButton />}
            </div>
          )}

          <div className="flex-1 h-full overflow-hidden relative border border-slate-200 bg-slate-50 rounded-lg shadow-inner">
            {measurementMethod === '1-point' ? (
                <div className="w-full h-full overflow-hidden p-2 flex items-center justify-center touch-none select-none">
                    <div className="flex justify-center gap-1">
                        <div className="flex gap-[1px] bg-white p-1 rounded border border-slate-300 shadow-sm">
                            {currentTeethData.UR.map((tooth, index) => (
                                <Tooth 
                                    key={tooth.id} 
                                    data={tooth} 
                                    lowerData={currentTeethData.LR[index]}
                                    onUpdate={(t) => handleToothUpdate('UR', t)} 
                                    onUpdateLower={(t) => handleToothUpdate('LR', t)}
                                    jaw="upper" 
                                    method="1-point" 
                                />
                            ))}
                        </div>
                        <div className="w-2 shrink-0"></div>
                        <div className="flex gap-[1px] bg-white p-1 rounded border border-slate-300 shadow-sm">
                            {currentTeethData.UL.map((tooth, index) => (
                                <Tooth 
                                    key={tooth.id} 
                                    data={tooth} 
                                    lowerData={currentTeethData.LL[index]}
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
                <div 
                className="flex flex-wrap w-[200%] h-[200%] transition-transform duration-500 ease-in-out will-change-transform"
                style={{ transform: getTranslate() }}
                >
                <div className="w-1/2 h-1/2 flex items-center justify-start bg-slate-100 p-1 md:p-2 pr-8 md:pr-24">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col justify-center overflow-hidden">
                    <div className="flex justify-between w-full h-full gap-[1px] items-start">
                        {currentTeethData.UR.map(tooth => (
                        <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('UR', t)} jaw="upper" method={measurementMethod} />
                        ))}
                        <SideLabels jaw="upper" />
                    </div>
                    </div>
                </div>

                <div className="w-1/2 h-1/2 flex items-center justify-end bg-slate-100 p-1 md:p-2 pl-8 md:pl-24">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col justify-center overflow-hidden">
                    <div className="flex justify-between w-full h-full gap-[1px] items-start">
                        <SideLabels jaw="upper" />
                        {currentTeethData.UL.map(tooth => (
                        <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('UL', t)} jaw="upper" method={measurementMethod} />
                        ))}
                    </div>
                    </div>
                </div>

                <div className="w-1/2 h-1/2 flex items-center justify-start bg-slate-100 p-1 md:p-2 pr-8 md:pr-24">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col justify-center overflow-hidden">
                    <div className="flex justify-between w-full h-full gap-[1px] items-start">
                        {currentTeethData.LR.map(tooth => (
                        <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('LR', t)} jaw="lower" method={measurementMethod} />
                        ))}
                        <SideLabels jaw="lower" />
                    </div>
                    </div>
                </div>

                <div className="w-1/2 h-1/2 flex items-center justify-end bg-slate-100 p-1 md:p-2 pl-8 md:pl-24">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col justify-center overflow-hidden">
                    <div className="flex justify-between w-full h-full gap-[1px] items-start">
                        <SideLabels jaw="lower" />
                        {currentTeethData.LL.map(tooth => (
                        <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('LL', t)} jaw="lower" method={measurementMethod} />
                        ))}
                    </div>
                    </div>
                </div>
                </div>
            )}
          </div>

          {/* RIGHT CONTROLS COLUMN */}
          {measurementMethod !== '1-point' && (
            <div className="flex flex-col gap-2 z-20 shrink-0 w-10 self-center">
               {isLower && showRightControls && <RedVerticalButton />}
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
              {!isLower && showRightControls && <RedVerticalButton />}
            </div>
          )}

        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-3 text-red-600">
                        <div className="p-2 bg-red-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">データを削除</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        現在選択されている<strong className="text-slate-800 mx-1">{measurementMethod === '1-point' ? '1点法' : measurementMethod === '4-point' ? '4点法' : '6点法'}</strong>のデータを全てリセットしますか？
                        <br/>
                        <span className="text-xs text-slate-400 mt-2 block">※この操作は取り消せません。他の計測法のデータは残ります。</span>
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
                    <button 
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button 
                        onClick={handleConfirmDelete}
                        className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-all active:scale-95"
                    >
                        削除実行
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;