import React, { useState, useEffect, useCallback, useRef } from 'react';
import Tooth from './components/Tooth';
import DentalChartPrintView from './components/SixPointPrintView';
import { ToothData, MeasurementMethod, Quadrant } from './types';
import { DentalDB } from './services/db';
import CalendarModal from './components/CalendarModal';
import { generateFullMouth } from './utils/dentalUtils';
import * as Icons from './components/Icons';
import Toast from './components/common/Toast';
import WithTooltip from './components/common/WithTooltip';
import MiniMap from './components/common/MiniMap';
import MethodSelector from './components/common/MethodSelector';
import SideLabels from './components/common/SideLabels';
import EditorHeader from './components/EditorHeader';
import OnePointView from './components/OnePointView';
import EditorMain from './components/EditorMain';
import PreviewView from './components/PreviewView';


// --- Main Application ---

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

  const handleLoadHistory = async () => {
    // markedDates is sorted descending. Find the most recent date before selectedDate.
    const pastDates = markedDates.filter(d => d !== selectedDate);
    if (pastDates.length === 0) {
      setToast({ message: '過去のデータがありません', type: 'error' });
      return;
    }
    // pastDates is already sorted descending, so the first one is the most recent
    const latestPastDate = pastDates[0];
    try {
      const record = await DentalDB.getChart(latestPastDate);
      if (record) {
        setAllTeethData(record.data);
        setIsDirty(true);
        setToast({ message: `${latestPastDate.replace(/-/g, '/')} のデータを展開しました`, type: 'info' });
      } else {
        setToast({ message: '過去のデータがありません', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to load history data', error);
      setToast({ message: '履歴データの読み込みに失敗しました', type: 'error' });
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
  }, [isPreviewMode]); // Re-attach if modes change heavily, though observe persists usually

  // Editor Content Size for Zooming
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollContainerSize, setScrollContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScrollContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    resizeObserver.observe(scrollContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []); // Re-attach when mode changes (element might be recreated)

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

  // Bulk Status Update Handler
  const handleBulkStatusChange = (mode: 'all_missing' | 'all_primary' | 'reset') => {
    setAllTeethData(prev => {
      const currentData = prev[measurementMethod];
      const quadrants: Quadrant[] = ['UL', 'UR', 'LL', 'LR'];

      const newMethodData = { ...currentData };

      quadrants.forEach(quad => {
        newMethodData[quad] = newMethodData[quad].map(tooth => {
          let updates: Partial<ToothData> = {};

          if (mode === 'all_missing') {
            updates = { isMissing: true, isPrimary: false };
          } else if (mode === 'reset') {
            updates = { isMissing: false, isPrimary: false };
          } else if (mode === 'all_primary') {
            // 1-5 to Primary (A-E), 6-8 to Missing
            if (tooth.id <= 5) {
              updates = { isMissing: false, isPrimary: true };
            } else {
              updates = { isMissing: true, isPrimary: false };
            }
          }

          return { ...tooth, ...updates };
        });
      });

      return {
        ...prev,
        [measurementMethod]: newMethodData
      };
    });
    setIsDirty(true);
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
  // const handleTouchStart = (e: React.TouchEvent) => {
  //   if (e.touches.length === 2) {
  //     // Calculate initial distance
  //     const dist = Math.hypot(
  //       e.touches[0].clientX - e.touches[1].clientX,
  //       e.touches[0].clientY - e.touches[1].clientY
  //     );
  //     touchStartDist.current = dist;
  //     startZoomLevel.current = zoomLevel;
  //   }
  // };

  // const handleTouchMove = (e: React.TouchEvent) => {
  //   if (e.touches.length === 2 && touchStartDist.current > 0) {
  //     const dist = Math.hypot(
  //       e.touches[0].clientX - e.touches[1].clientX,
  //       e.touches[0].clientY - e.touches[1].clientY
  //     );
  //     const scale = dist / touchStartDist.current;
  //     // Apply scale to the initial zoom level
  //     const newZoom = Math.min(Math.max(startZoomLevel.current * scale, 0.3), 3.0);
  //     setZoomLevel(newZoom);
  //   }
  // };

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


  // Render content based on mode and method
  const renderContent = () => {
    if (isPreviewMode) {
      return (
        <PreviewView
          isCompareMode={isCompareMode}
          markedDates={markedDates}
          selectedDate={selectedDate}
          compareDates={compareTargetDates}
          comparisonData={comparisonData}
          teeth={currentTeethData}
          measurementMethod={measurementMethod}
          handleCompareDateToggle={handleCompareDateToggle}
          handleConfirmComparison={handleConfirmComparison}
          getTranslate={getTranslate}
        />
      );
    }

    if (measurementMethod === '1-point') {
      return (
        <OnePointView
          teeth={currentTeethData}
          handleToothUpdate={handleToothUpdate}
        />
      );
    }

    return (
      <EditorMain
        currentQuadrant={currentQuadrant}
        teeth={currentTeethData}
        handleToothUpdate={handleToothUpdate}
        measurementMethod={measurementMethod}
        goUp={goUp}
        goDown={goDown}
        goLeft={goLeft}
        goRight={goRight}
      />
    );
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-slate-900 relative">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <EditorHeader
        measurementMethod={measurementMethod}
        setMeasurementMethod={setMeasurementMethod}
        currentQuadrant={currentQuadrant}
        setCurrentQuadrant={setCurrentQuadrant}
        isPreviewMode={isPreviewMode}
        setIsPreviewMode={setIsPreviewMode}
        isCompareMode={isCompareMode}
        selectedDate={selectedDate}
        markedDates={markedDates}
        setIsCalendarOpen={setIsCalendarOpen}
        handleSave={handleSave}
        handleCompareClick={handleCompareClick}
        handleLoadHistory={handleLoadHistory}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        handleBulkStatusChange={handleBulkStatusChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex items-center justify-center overflow-hidden relative p-1 md:p-2 bg-slate-100 print:bg-white print:p-0 print:block">
        {renderContent()}
      </main>

      {/* Save Confirmation Modal */}
      {isSaveConfirmModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-fade-in-up">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3 text-indigo-600">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Icons.CheckCircleIcon />
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
                  <Icons.DeleteIcon />
                </div>
                <h3 className="font-bold text-lg text-slate-800">データをリセット</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                現在編集中のデータをリセットしますか？
                <br />
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
                <Icons.CloseIcon className="w-5 h-5" />
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
                              <Icons.CheckCircleIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-slate-400' : 'text-white'}`} />
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
                <Icons.CompareIcon className="w-4 h-4" />
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

    </div >
  );
};

export default App;