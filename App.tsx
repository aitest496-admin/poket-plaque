import React, { useState } from 'react';
import Tooth from './components/Tooth';
import { ToothData } from './types';

const createTooth = (id: number): ToothData => ({
  id,
  mobility: 0,
  plaque: { distal: false, buccal: false, mesial: false, lingual: false, occlusal: false },
  pus: { buccal: [false, false, false], lingual: [false, false, false] },
  bleeding: { buccal: [false, false, false], lingual: [false, false, false] },
  pocketDepth: { buccal: [null, null, null], lingual: [null, null, null] },
});

const INITIAL_TEETH = [1, 2, 3, 4, 5, 6, 7, 8].map(createTooth);

const App: React.FC = () => {
  const [teeth, setTeeth] = useState<ToothData[]>(INITIAL_TEETH);

  const handleToothUpdate = (updatedTooth: ToothData) => {
    setTeeth(prev => prev.map(t => t.id === updatedTooth.id ? updatedTooth : t));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header - Compact */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-2 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Smart Perio (6点法)</h1>
            <p className="text-[10px] text-slate-500">1/4顎 | 歯番 #1-8</p>
          </div>
        </div>
      </header>

      {/* Main Content - No side padding to maximize width for tablet */}
      <main className="flex-1 p-2 md:p-4 flex justify-center overflow-hidden">
        <div className="w-full max-w-[720px] flex flex-col gap-4">
          
          {/* Chart Container */}
          <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
            <div className="flex justify-center min-w-max">
              {teeth.map(tooth => (
                <Tooth 
                  key={tooth.id} 
                  data={tooth} 
                  onUpdate={handleToothUpdate} 
                />
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;