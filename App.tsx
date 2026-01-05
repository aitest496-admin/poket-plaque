import React, { useState, useEffect, useCallback, useRef } from 'react';
import Tooth from './components/Tooth';
import DentalChartPrintView from './components/SixPointPrintView';
import { ToothData, MeasurementMethod } from './types';
import { DentalDB } from './services/db';
import CalendarModal from './components/CalendarModal';

// Helper to create a single tooth
const createTooth = (id: number): ToothData => ({
  id,
  mobility: 0,
  plaque: { distal: false, buccal: false, mesial: false, lingual: false, occlusal: false },
  pus: { buccal: [false, false, false], lingual: [false, false, false] },
  bleeding: { buccal: [false, false, false], lingual: [false, false, false] },
  pocketDepth: { buccal: [null, null, null], lingual: [null, null, null] },
  isMissing: false,
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

// --- UI Components ---

// Toast Notification
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgClass = type === 'success' ? 'bg-blue-600' : type === 'error' ? 'bg-red-500' : 'bg-slate-700';

    return (
        <div className={`fixed bottom-4 right-4 ${bgClass} text-white px-4 py-2 rounded-lg shadow-lg z-[200] flex items-center gap-2 animate-fade-in-up`}>
            {type === 'success' && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            )}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

// Tooltip Component
const WithTooltip: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => (
  <div className={`relative group flex items-center justify-center ${className}`}>
    {children}
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-md shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100]">
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
      {label}
    </div>
  </div>
);

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
  const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>('1-point');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Preview Mode State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false); // Comparison Mode State
  const [isCompareListOpen, setIsCompareListOpen] = useState(false); // Date Selection Modal for Compare
  
  // Multiple Comparison States
  const [compareTargetDates, setCompareTargetDates] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<Record<string, any>>({});

  const [zoomLevel, setZoomLevel] = useState(0.7); // Default zoom level for preview
  
  // Height Measurement for Preview Scrolling
  const previewContentRef = useRef<HTMLDivElement>(null);
  const [previewContentHeight, setPreviewContentHeight] = useState<number>(0);

  // Pinch Zoom Refs
  const touchStartDist = useRef<number>(0);
  const startZoomLevel = useRef<number>(0);

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [isSaveConfirmModalOpen, setIsSaveConfirmModalOpen] = useState(false); // New modal for save confirmation

  // Dirty State (Unsaved Changes)
  const [isDirty, setIsDirty] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Main Data Store
  const [allTeethData, setAllTeethData] = useState<Record<MeasurementMethod, { UL: ToothData[]; UR: ToothData[]; LL: ToothData[]; LR: ToothData[] }>>({
    '1-point': generateFullMouth(),
    '4-point': generateFullMouth(),
    '6-point': generateFullMouth(),
  });

  const currentTeethData = allTeethData[measurementMethod];

  // --- Database Interactions ---

  const updateMarkedDates = useCallback(async () => {
      try {
          const dates = await DentalDB.getAllDates();
          setMarkedDates(dates);
      } catch (e) {
          console.error("Failed to update marked dates", e);
      }
  }, []);

  const loadDataForDate = useCallback(async (date: string) => {
    try {
        const record = await DentalDB.getChart(date);
        if (record) {
            setAllTeethData(record.data);
            setToast({ message: `${date.replace(/-/g, '/')} のデータを読み込みました`, type: 'info' });
        } else {
            // If no data exists for this date, reset to empty
            setAllTeethData({
                '1-point': generateFullMouth(),
                '4-point': generateFullMouth(),
                '6-point': generateFullMouth(),
            });
        }
        setIsDirty(false); // Reset dirty state on load
    } catch (error) {
        console.error("Failed to load data", error);
        setToast({ message: "データの読み込みに失敗しました", type: 'error' });
    }
  }, []);

  // Load data for multiple comparison dates
  const loadComparisonData = async (dates: string[]) => {
      const newData: Record<string, any> = {};
      let loadedCount = 0;
      for (const date of dates) {
          try {
            const record = await DentalDB.getChart(date);
            if (record) {
                newData[date] = record.data;
                loadedCount++;
            }
          } catch (e) {
              console.error(`Failed to load comparison data for ${date}`, e);
          }
      }
      setComparisonData(newData);
      if (loadedCount > 0) {
          setToast({ message: `${loadedCount}件の比較データを読み込みました`, type: 'info' });
      }
  };

  const handleSave = async () => {
    try {
        await DentalDB.saveChart({
            date: selectedDate,
            data: allTeethData,
            updatedAt: Date.now()
        });
        setToast({ message: "保存しました", type: 'success' });
        await updateMarkedDates(); // Update calendar markers
        setIsDirty(false); // Reset dirty state on save
        return true; // Return success
    } catch (error) {
        console.error("Failed to save", error);
        setToast({ message: "保存に失敗しました", type: 'error' });
        return false;
    }
  };

  const handleSaveAndPreview = async () => {
    const success = await handleSave();
    if (success) {
        setIsSaveConfirmModalOpen(false);
        setIsPreviewMode(true);
    }
  };

  const handleSelectDate = (date: string) => {
      setSelectedDate(date);
      // useEffect will handle loading
  };

  // Initial load and when date changes
  useEffect(() => {
    updateMarkedDates();
    loadDataForDate(selectedDate);
  }, [selectedDate, loadDataForDate, updateMarkedDates]);

  // Observer for Preview Content Height
  useEffect(() => {
    if (!isPreviewMode) return;
    
    const element = previewContentRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPreviewContentHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isPreviewMode, isCompareMode, compareTargetDates]); // Re-attach if modes change heavily, though observe persists usually

  // --- Handlers ---

  const handleToothUpdate = (quadrant: Quadrant, updatedTooth: ToothData) => {
    setAllTeethData(prev => ({
      ...prev,
      [measurementMethod]: {
        ...prev[measurementMethod],
        [quadrant]: prev[measurementMethod][quadrant].map(t => t.id === updatedTooth.id ? updatedTooth : t)
      }
    }));
    setIsDirty(true); // Mark as dirty on change
  };

  const handleConfirmDelete = async () => {
    setAllTeethData(prev => ({
      ...prev,
      [measurementMethod]: generateFullMouth()
    }));
    setIsDeleteModalOpen(false);
    setIsDirty(true); // Resetting data is also a change
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.3));

  // --- Pinch Zoom Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
        // Calculate initial distance
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        touchStartDist.current = dist;
        startZoomLevel.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current > 0) {
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = dist / touchStartDist.current;
        // Apply scale to the initial zoom level
        const newZoom = Math.min(Math.max(startZoomLevel.current * scale, 0.3), 3.0);
        setZoomLevel(newZoom);
    }
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

  // Compare Logic
  const handleCompareClick = () => {
      if (isCompareMode) {
          setIsCompareMode(false);
          setCompareTargetDates([]);
          setComparisonData({});
      } else {
          setIsCompareListOpen(true);
          // Initialize with empty selection or keep previous? Let's start fresh or keep.
          // setCompareTargetDates([]); // Uncomment to reset every time
      }
  };

  const handleCompareDateToggle = (date: string) => {
      setCompareTargetDates(prev => {
          if (prev.includes(date)) {
              return prev.filter(d => d !== date);
          } else {
              return [...prev, date];
          }
      });
  };

  const handleConfirmComparison = async () => {
      if (compareTargetDates.length === 0) {
          setToast({ message: "比較する日付を選択してください", type: 'error' });
          return;
      }
      setIsCompareListOpen(false);
      await loadComparisonData(compareTargetDates);
      setIsCompareMode(true);
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

  // Render content based on mode and method
  const renderContent = () => {
    if (isPreviewMode) {
      return (
        <div 
          className="w-full h-full overflow-auto bg-slate-500/20 print:p-0 print:bg-white print:overflow-visible touch-pan-x touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => { touchStartDist.current = 0; }}
        >
          {/* Wrapper for scrolling: ensure min dimensions based on scaled content */}
          <div 
             className="flex justify-center items-start p-8"
             style={{
                minWidth: `${(1100 * zoomLevel) + 64}px`, // 1100px base width * zoom + padding
                minHeight: `${(previewContentHeight * zoomLevel) + 64}px`
             }}
          >
            <div 
                ref={previewContentRef}
                className="flex flex-col gap-8 items-center origin-top shadow-none print:shadow-none print:transform-none"
                style={{ 
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top center',
                    width: '1100px',     // Fixed width to maintain aspect ratio and preventing reflow on zoom
                    minWidth: '1100px'   
                }}
            >
                {/* Main Chart (Current Date) */}
                <div className="bg-white shadow-xl print:shadow-none w-full">
                    <DentalChartPrintView 
                    data={allTeethData[measurementMethod]} 
                    date={selectedDate} 
                    method={measurementMethod}
                    />
                </div>

                {/* Comparison Charts */}
                {isCompareMode && compareTargetDates.map(date => {
                    const dataForDate = comparisonData[date];
                    if (!dataForDate) return null;
                    
                    // dataForDate contains all methods. Use current method for view.
                    const viewData = dataForDate[measurementMethod]; 

                    return (
                        <div key={date} className="w-full relative animate-fade-in-up">
                            {/* Comparison Label/Header */}
                            <div className="absolute -top-8 left-0 flex items-center gap-2">
                                <div className="bg-indigo-600 text-white px-4 py-1.5 text-sm font-bold rounded-t-lg shadow-sm flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    過去データ: {date.replace(/-/g, '/')}
                                </div>
                            </div>

                            {/* Comparison Chart Body */}
                            <div className="bg-white shadow-xl border-[6px] border-indigo-200 print:shadow-none print:border-2 print:border-slate-300">
                                {/* Overlay mask to slightly dim or distinct comparison charts? Optional. Keeping it clear for now. */}
                                <DentalChartPrintView 
                                    data={viewData} 
                                    date={date} 
                                    method={measurementMethod}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        </div>
      );
    }

    // Default Editor View
    return (
        <div className="w-full h-full flex items-center justify-center gap-1 relative max-w-7xl mx-auto print:hidden">
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
    );
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-slate-900 relative">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header - Compact (Hidden on print) */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-2 sticky top-0 z-50 shrink-0 print:hidden">
        <div className="max-w-full mx-auto grid grid-cols-3 items-center gap-4">
          
          {/* Column 1: Tabs, Save, Compare, Preview - Left aligned, spread */}
          <div className="flex justify-between items-center pr-2">
            <MethodTab current={measurementMethod} onChange={setMeasurementMethod} />
            
            <div className="flex items-center gap-2">
                {/* 保存アイコン */}
                {!isPreviewMode && (
                <WithTooltip label="保存">
                    <button 
                    className={`p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center`}
                    aria-label="Save"
                    onClick={() => handleSave()}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                    </svg>
                    </button>
                </WithTooltip>
                )}

                {/* 比較アイコン (New) - Visible only in Preview Mode */}
                {isPreviewMode && (
                <WithTooltip label={isCompareMode ? "比較終了" : "比較モード"}>
                    <button 
                    className={`p-2 border rounded-lg shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center
                        ${isCompareMode 
                            ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700' 
                            : 'bg-white text-slate-600 border-slate-200 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'
                        }
                    `}
                    aria-label={isCompareMode ? "Exit Compare" : "Compare"}
                    onClick={handleCompareClick}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" />
                    </svg>
                    </button>
                </WithTooltip>
                )}

                {/* プレビューアイコン (Toggle) */}
                <WithTooltip label={isPreviewMode ? "プレビューを閉じる" : "プレビュー"}>
                    <button 
                    className={`p-2 border rounded-lg shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center
                        ${isPreviewMode 
                            ? 'bg-slate-800 text-white border-slate-900 hover:bg-slate-700' 
                            : 'bg-white text-slate-600 border-slate-200 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50'
                        }
                    `}
                    aria-label={isPreviewMode ? "Close Preview" : "Preview"}
                    onClick={() => {
                        if (isPreviewMode) {
                            setIsPreviewMode(false);
                            setIsCompareMode(false); // Reset compare mode on close
                            setCompareTargetDates([]);
                        } else {
                            if (isDirty) {
                                setIsSaveConfirmModalOpen(true);
                            } else {
                                setIsPreviewMode(true);
                            }
                        }
                    }}
                    >
                    {isPreviewMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    )}
                    </button>
                </WithTooltip>
            </div>
          </div>

          {/* Column 2: Date Picker and History/Zoom - Precisely Centered */}
          <div className="flex justify-center items-center gap-3">
            <span className="text-sm font-bold text-slate-500 whitespace-nowrap">検査日</span>
            
            {/* Custom Date Picker Trigger */}
            <button 
              onClick={() => !isPreviewMode && !isCompareMode && setIsCalendarOpen(true)}
              disabled={isPreviewMode || isCompareMode}
              className={`bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-inner flex items-center gap-2 hover:bg-white active:bg-slate-100 transition-colors h-9 ${isPreviewMode || isCompareMode ? 'opacity-70 pointer-events-none' : ''}`}
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
               </svg>
               {selectedDate.replace(/-/g, '/')}
            </button>

            {(isPreviewMode || isCompareMode) && (
                // Zoom Controls (Visible in Preview OR Compare Mode)
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm h-9">
                    <button 
                        onClick={handleZoomOut} 
                        className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded active:bg-slate-200 transition-colors font-bold text-lg leading-none pb-1"
                        title="縮小"
                    >−</button>
                    <span className="text-xs font-bold w-12 text-center text-slate-700 select-none">{Math.round(zoomLevel * 100)}%</span>
                    <button 
                        onClick={handleZoomIn} 
                        className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded active:bg-slate-200 transition-colors font-bold text-lg leading-none pb-1"
                        title="拡大"
                    >+</button>
                </div>
            )}
          </div>

          {/* Column 3: Delete Button and MiniMap - Right aligned, spread */}
          <div className="flex justify-between items-center pl-2">
            {/* 削除アイコン: 検査履歴とMAPの間に配置 */}
            <WithTooltip label="データ削除" className={isPreviewMode || isCompareMode ? 'invisible' : ''}>
                <button 
                className={`p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center`}
                aria-label="Delete"
                disabled={isPreviewMode || isCompareMode}
                onClick={() => setIsDeleteModalOpen(true)}
                >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                </button>
            </WithTooltip>

            <div className={`${measurementMethod === '1-point' || isPreviewMode || isCompareMode ? 'invisible pointer-events-none' : ''}`}>
                <MiniMap 
                current={currentQuadrant} 
                onSelect={setCurrentQuadrant} 
                />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex items-center justify-center overflow-auto relative p-1 md:p-2 bg-slate-100 print:bg-white print:p-0 print:block">
        {renderContent()}
      </main>

      {/* Save Confirmation Modal */}
      {isSaveConfirmModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] print:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-fade-in-up">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-3 text-indigo-600">
                        <div className="p-2 bg-indigo-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">保存確認</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed font-bold">
                        保存してプレビュー画面に移行しますか？
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
                    <button 
                        onClick={() => setIsSaveConfirmModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        いいえ
                    </button>
                    <button 
                        onClick={handleSaveAndPreview}
                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all active:scale-95"
                    >
                        はい
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Hidden on print) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] print:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-3 text-red-600">
                        <div className="p-2 bg-red-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">データをリセット</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        現在編集中のデータをリセットしますか？
                        <br/>
                        <span className="text-xs text-slate-400 mt-2 block">※保存されていない変更は失われます。</span>
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
                        リセット実行
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Compare Date Selection Modal */}
      {isCompareListOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-fade-in-up flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg text-slate-800">比較するデータを選択</h3>
                    <button onClick={() => setIsCompareListOpen(false)} className="text-slate-500 hover:text-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto p-2">
                    {markedDates.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">データが見つかりません</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {markedDates.map(date => {
                                const isCurrent = date === selectedDate;
                                const isSelected = compareTargetDates.includes(date);
                                
                                return (
                                    <button
                                        key={date}
                                        onClick={() => !isCurrent && handleCompareDateToggle(date)}
                                        disabled={isCurrent}
                                        className={`
                                            w-full text-left px-4 py-3 rounded-lg flex items-center justify-between border transition-all
                                            ${isCurrent 
                                                ? 'bg-slate-100 border-slate-200 cursor-default opacity-60' 
                                                : isSelected
                                                    ? 'bg-indigo-50 border-indigo-300 shadow-inner'
                                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Checkbox-like indicator */}
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                ${isCurrent ? 'border-slate-300 bg-slate-200' :
                                                  isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}
                                            `}>
                                                {(isSelected || isCurrent) && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3.5 h-3.5 ${isCurrent ? 'text-slate-400' : 'text-white'}`}>
                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`font-bold ${isCurrent ? 'text-slate-500' : isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {date.replace(/-/g, '/')}
                                            </span>
                                        </div>
                                        {isCurrent && <span className="text-xs font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded">表示中</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsCompareListOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button 
                        onClick={handleConfirmComparison}
                        disabled={compareTargetDates.length === 0}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all flex items-center gap-2
                            ${compareTargetDates.length === 0 
                                ? 'bg-slate-400 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                            }
                        `}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" />
                        </svg>
                        比較を表示 ({compareTargetDates.length})
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Custom Calendar Modal */}
      <CalendarModal 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={handleSelectDate}
        selectedDate={selectedDate}
        markedDates={markedDates}
      />

    </div>
  );
};

export default App;