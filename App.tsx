import React, { useState, useEffect, useCallback, useRef } from 'react';
import Tooth from './components/Tooth';
import DentalChartPrintView from './components/SixPointPrintView';
import PisaPreview from './components/PisaPreview';
import { ToothData, MeasurementMethod } from './types';
import { DentalDB } from './services/db';
import CalendarModal from './components/CalendarModal';
import SettingsModal from './components/SettingsModal';
import ExaminerModal, { Examiner } from './components/ExaminerModal';

const mockExaminers: Examiner[] = [
    { id: '1', name: '山田 太郎', color: 'bg-blue-600' },
    { id: '2', name: '鈴木 和子', color: 'bg-emerald-600' },
    { id: '3', name: '佐藤 健一', color: 'bg-amber-500' },
    { id: '4', name: '田中 美香', color: 'bg-rose-500' },
    { id: '5', name: '伊藤 隆', color: 'bg-indigo-600' },
];

// Helper to create a single tooth
const createTooth = (id: number): ToothData => ({
    id,
    mobility: 0,
    plaque: { distal: false, buccal: false, mesial: false, lingual: false, occlusal: false },
    pus: { buccal: [false, false, false], lingual: [false, false, false] },
    bleeding: { buccal: [false, false, false], lingual: [false, false, false] },
    pocketDepth: { buccal: [null, null, null], lingual: [null, null, null] },
    isMissing: false,
    isPrimary: false,
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

// Tooltip Component will be defined inside App to access showLabels state

// MiniMap Component for visual navigation
const MiniMap: React.FC<{ current: Quadrant; onSelect: (q: Quadrant) => void; disabled?: boolean }> = ({ current, onSelect, disabled }) => {
    const Quad = ({ q, label, rounded }: { q: Quadrant; label: string; rounded: string }) => {
        const isActive = current === q && !disabled;
        const japaneseLabel: Record<Quadrant, string> = { UR: '右上', UL: '左上', LR: '右下', LL: '左下' };
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
                {japaneseLabel[q]}
            </button>
        );
    };

    return (
        <div className="flex flex-col gap-[1px] bg-slate-200 p-[2px] rounded border border-slate-300 shadow-inner">
            <div className="flex gap-[1px]">
                {/* Visual Layout: Patient Right is Viewer Left (UR), Patient Left is Viewer Right (UL) */}
                <Quad q="UR" label="右上" rounded="rounded-tl-sm" />
                <Quad q="UL" label="左上" rounded="rounded-tr-sm" />
            </div>
            <div className="flex gap-[1px]">
                <Quad q="LR" label="右下" rounded="rounded-bl-sm" />
                <Quad q="LL" label="左下" rounded="rounded-br-sm" />
            </div>
        </div>
    );
};

const MethodSelector: React.FC<{ current: MeasurementMethod; onChange: (m: MeasurementMethod) => void }> = ({ current, onChange }) => {
    return (
        <div className="relative inline-block text-left h-9">
            <select
                value={current}
                onChange={(e) => onChange(e.target.value as MeasurementMethod)}
                className="
            cursor-pointer appearance-none h-full
            bg-slate-50 border border-slate-200 hover:bg-white
            text-slate-700 text-xs font-bold 
            rounded-lg shadow-inner
            pl-3 pr-8 py-0
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            transition-all
            flex items-center
        "
            >
                <option value="1-point">1点法</option>
                <option value="4-point">4点法</option>
                <option value="6-point">6点法</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
            </div>
        </div>
    );
};

// SideLabels Component to show Buccal/Lingual text and row titles
// Uses a single narrow column with pixel-exact heights matching each Tooth row
const SideLabels = ({ jaw, method }: { jaw: 'upper' | 'lower', method: MeasurementMethod }) => {
    if (method === '1-point') return null;

    const topSideText = jaw === 'upper' ? '頬側' : '舌側';
    const bottomSideText = jaw === 'upper' ? '口蓋側' : '頬側';

    // Exact heights matching Tooth.tsx rows (all border-box)
    const hPlaque = 70;     // PlaqueDiagram h-[70px]
    const hMobility = 28;   // Mobility row h-[28px]
    const hPus = 26;        // ThreePointToggle h-[26px]
    const hBleeding = 26;   // ThreePointToggle h-[26px]
    const hPD = 245;        // PocketDepthChart total: input(42+0.5) + 9cells(9×22.5)
    const hID = 52;         // Tooth ID h-[52px]

    // Simple label row with exact height
    const Label = ({ text, h }: { text: string, h: number }) => (
        <div style={{ height: `${h}px` }}
            className="flex items-center justify-center text-[10px] text-slate-500 font-bold whitespace-nowrap">
            {text}
        </div>
    );

    // Empty spacer with exact height
    const Spacer = ({ h }: { h: number }) => (
        <div style={{ height: `${h}px` }} />
    );

    // Vertical text label spanning PD area
    const SideText = ({ text }: { text: string }) => (
        <div style={{ height: `${hPD}px` }}
            className="flex items-center justify-center">
            <span className="[writing-mode:vertical-rl] tracking-[0.25em] text-base font-black text-slate-600">
                {text}
            </span>
        </div>
    );

    return (
        // border-transparent matches Tooth's outer border for pixel alignment
        <div className="flex flex-col shrink-0 w-[30px] select-none border border-transparent">
            {/* === TOP BLOCK === */}
            {jaw === 'upper' ? (
                <>
                    <Spacer h={hPlaque} />
                    <Label text="動揺" h={hMobility} />
                    <Label text="排膿" h={hPus} />
                    <Label text="出血" h={hBleeding} />
                    <SideText text={topSideText} />
                </>
            ) : (
                <>
                    <Label text="排膿" h={hPus} />
                    <Label text="出血" h={hBleeding} />
                    <SideText text={topSideText} />
                </>
            )}

            {/* === TOOTH ID SPACER (no label) === */}
            <Spacer h={hID} />

            {/* === BOTTOM BLOCK === */}
            {jaw === 'upper' ? (
                <>
                    <SideText text={bottomSideText} />
                    <Label text="出血" h={hBleeding} />
                    <Label text="排膿" h={hPus} />
                </>
            ) : (
                <>
                    <SideText text={bottomSideText} />
                    <Label text="出血" h={hBleeding} />
                    <Label text="排膿" h={hPus} />
                    <Label text="動揺" h={hMobility} />
                    <Spacer h={hPlaque} />
                </>
            )}
        </div>
    );
};

const App: React.FC = () => {
    const [currentQuadrant, setCurrentQuadrant] = useState<Quadrant>('UL');
    const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>('1-point');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Execution Time States
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [totalMinutes, setTotalMinutes] = useState<number>(0);

    // Examiner State
    const [selectedExaminer, setSelectedExaminer] = useState<Examiner>(mockExaminers[0]);
    const [isExaminerModalOpen, setIsExaminerModalOpen] = useState(false);

    // Time Helpers
    const formatTime = (date: Date) => {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    const addMinutesToTime = (timeStr: string, mins: number) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m + mins, 0, 0);
        return formatTime(date);
    };

    // Compute total minutes
    useEffect(() => {
        if (startTime && endTime) {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            let diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff < 0) diff += 24 * 60; // handle overnight crossing
            setTotalMinutes(diff);
        } else {
            setTotalMinutes(0);
        }
    }, [startTime, endTime]);

    const handleStartTimeChange = (newStart: string) => {
        setStartTime(newStart);
        // Requirement 3.2: When start time changes, end time should follow (Start + 15m)
        setEndTime(addMinutesToTime(newStart, 15));
        setIsDirty(true);
    };

    const handleEndTimeChange = (newEnd: string) => {
        setEndTime(newEnd);
        setIsDirty(true);
    };

    const handleNowClick = () => {
        const now = new Date();
        const newStart = formatTime(now);
        setStartTime(newStart);
        setEndTime(addMinutesToTime(newStart, 15));
        setIsDirty(true);
    };

    const handleAdd5Min = () => {
        setEndTime(addMinutesToTime(endTime, 5));
        setIsDirty(true);
    };

    // Preview Mode State
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isPisaPreview, setIsPisaPreview] = useState(false); // PISA Preview toggle
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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [markedDates, setMarkedDates] = useState<string[]>([]);
    const [isSaveConfirmModalOpen, setIsSaveConfirmModalOpen] = useState(false); // New modal for save confirmation

    // Dirty State (Unsaved Changes)
    const [isDirty, setIsDirty] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    // --- Icon Text Auto-hide Logic ---
    const [showLabels, setShowLabels] = useState(true);
    const labelTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetLabelTimer = useCallback(() => {
        setShowLabels(true);
        if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
        labelTimerRef.current = setTimeout(() => {
            setShowLabels(false);
        }, 2000);
    }, []);

    useEffect(() => {
        resetLabelTimer();
        const handleInteraction = () => resetLabelTimer();
        window.addEventListener('pointerdown', handleInteraction);
        return () => {
            if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
            window.removeEventListener('pointerdown', handleInteraction);
        };
    }, [resetLabelTimer]);

    // Helper component for auto-hiding text labels
    const AutoHideLabel = ({ children, className = "", delayClass = "" }: { children: React.ReactNode, className?: string, delayClass?: string }) => (
        <span className={`
            transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap inline-block
            ${showLabels ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
            ${className} ${delayClass}
        `}>
            {children}
        </span>
    );

    // Tooltip Component integrated with auto-hide state
    const WithTooltip: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => (
        <div className={`relative group flex items-center justify-center ${className}`}>
            {children}
            <div className={`
                absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-md shadow-xl 
                transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] opacity-0 translate-y-1
                ${showLabels ? 'group-hover:opacity-100 group-hover:translate-y-0' : ''}
            `}>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                {label}
            </div>
        </div>
    );

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
                if (record.startTime && record.endTime) {
                    setStartTime(record.startTime);
                    setEndTime(record.endTime);
                } else {
                    // Fallback if older record lacks time
                    const now = new Date();
                    setStartTime(formatTime(now));
                    setEndTime(formatTime(new Date(now.getTime() + 15 * 60000)));
                }
                setToast({ message: `${date.replace(/-/g, '/')} のデータを読み込みました`, type: 'info' });
            } else {
                // If no data exists for this date, reset to empty
                setAllTeethData({
                    '1-point': generateFullMouth(),
                    '4-point': generateFullMouth(),
                    '6-point': generateFullMouth(),
                });
                // Initialize default execution time
                const now = new Date();
                setStartTime(formatTime(now));
                setEndTime(formatTime(new Date(now.getTime() + 15 * 60000)));
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
                updatedAt: Date.now(),
                startTime,
                endTime
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

    // Load latest history data (including tooth status)
    const handleLoadLatestHistory = async () => {
        try {
            const dates = await DentalDB.getAllDates();
            if (dates.length === 0) {
                setToast({ message: '保存された検査データがありません', type: 'error' });
                return;
            }
            // Find the most recent date (dates are sorted descending)
            const latestDate = dates[0];
            const record = await DentalDB.getChart(latestDate);
            if (record) {
                setAllTeethData(record.data);
                setToast({ message: `${latestDate.replace(/-/g, '/')} の検査データを読み込みました`, type: 'info' });
                setIsDirty(true);
            } else {
                setToast({ message: '検査データの読み込みに失敗しました', type: 'error' });
            }
        } catch (error) {
            console.error('Failed to load latest history', error);
            setToast({ message: '検査データの読み込みに失敗しました', type: 'error' });
        }
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
                    className="w-full bg-transparent print:p-0 print:bg-white print:overflow-visible touch-pan-x touch-pan-y"
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
                            {/* Main Chart or PISA Preview */}
                            <div className="bg-white shadow-xl print:shadow-none w-full">
                                {isPisaPreview ? (
                                    <PisaPreview
                                        data={allTeethData['6-point']}
                                        date={selectedDate}
                                        method={'6-point'}
                                    />
                                ) : (
                                    <DentalChartPrintView
                                        data={allTeethData[measurementMethod]}
                                        date={selectedDate}
                                        method={measurementMethod}
                                    />
                                )}
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
                                            {isPisaPreview ? (
                                                <PisaPreview
                                                    data={dataForDate['6-point']}
                                                    date={date}
                                                    method={'6-point'}
                                                />
                                            ) : (
                                                <DentalChartPrintView
                                                    data={viewData}
                                                    date={date}
                                                    method={measurementMethod}
                                                />
                                            )}
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
            <div className="w-full h-full flex items-start justify-center gap-1 relative max-w-7xl mx-auto print:hidden">
                {/* LEFT CONTROLS COLUMN */}
                {measurementMethod !== '1-point' && (
                    <div className="flex flex-col gap-2 z-20 shrink-0 w-10 self-center">
                        {isLower && showLeftControls && <RedVerticalButton />}
                        <button
                            onClick={goLeft}
                            disabled={!showLeftControls}
                            className={`w-10 h-24 flex items-center justify-center bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 active:bg-blue-800 transition-opacity duration-300 ${showLeftControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
                        <div className="w-full min-h-full overflow-auto p-2 flex items-start justify-center touch-none select-none">
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
                            <div className="w-1/2 h-1/2 flex items-center justify-start bg-slate-100 p-0.5">
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col items-center overflow-auto">
                                    <div className="flex w-full h-full gap-[1px] items-start">
                                        {currentTeethData.UR.map(tooth => (
                                            <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('UR', t)} jaw="upper" method={measurementMethod} />
                                        ))}
                                        <SideLabels jaw="upper" method={measurementMethod} />
                                    </div>
                                </div>
                            </div>

                            <div className="w-1/2 h-1/2 flex items-center justify-end bg-slate-100 p-0.5">
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col items-center overflow-auto">
                                    <div className="flex w-full h-full gap-[1px] items-start">
                                        <SideLabels jaw="upper" method={measurementMethod} />
                                        {currentTeethData.UL.map(tooth => (
                                            <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('UL', t)} jaw="upper" method={measurementMethod} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="w-1/2 h-1/2 flex items-center justify-start bg-slate-100 p-0.5">
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col items-center overflow-auto">
                                    <div className="flex w-full h-full gap-[1px] items-start">
                                        {currentTeethData.LR.map(tooth => (
                                            <Tooth key={tooth.id} data={tooth} onUpdate={(t) => handleToothUpdate('LR', t)} jaw="lower" method={measurementMethod} />
                                        ))}
                                        <SideLabels jaw="lower" method={measurementMethod} />
                                    </div>
                                </div>
                            </div>

                            <div className="w-1/2 h-1/2 flex items-center justify-end bg-slate-100 p-0.5">
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full h-full flex flex-col items-center overflow-auto">
                                    <div className="flex w-full h-full gap-[1px] items-start">
                                        <SideLabels jaw="lower" method={measurementMethod} />
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
                            className={`w-10 h-24 flex items-center justify-center bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 active:bg-blue-800 transition-opacity duration-300 ${showRightControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
        <div className="h-[100dvh] w-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-slate-900 relative">
            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header - Compact (Hidden on print) */}
            <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-1 sticky top-0 z-50 shrink-0 print:hidden">
                {/* Patient Info Row & Execution Time */}
                <div className="max-w-full mx-auto mb-1 px-1 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-sm">
                        {/* Examiner Icon Button (Requirement: Header Examiner UI) */}
                        <WithTooltip label={`実施者: ${selectedExaminer.name}`}>
                            <button 
                                onClick={() => setIsExaminerModalOpen(true)}
                                className={`
                                    w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md active:scale-95 transition-all border-2 border-white
                                    ${selectedExaminer.color}
                                `}
                            >
                                {(() => {
                                    const parts = selectedExaminer.name.split(/\s+/);
                                    return parts.length >= 2 ? parts[0][0] + parts[1][0] : selectedExaminer.name.substring(0, 2);
                                })()}
                            </button>
                        </WithTooltip>

                        <div className="flex flex-col">
                            <span className="font-mono font-bold text-slate-400 text-xs leading-tight">000000001</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-800 text-xl leading-none">吉田 太郎</span>
                                <span className="text-slate-400 font-bold text-sm">様</span>
                            </div>
                        </div>
                        <span className="text-slate-500 text-sm font-bold ml-1">（1975/01/01　51歳）</span>
                    </div>

                    {/* Execution Time Controls & Preview Toggle */}
                    <div className="flex items-center gap-2">
                        {!isPreviewMode && !isCompareMode && (
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm">
                                {/* Requirement 2: Set Now Button */}
                                <button 
                                    onClick={handleNowClick} 
                                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700 text-[11px] font-bold hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95 transition-all"
                                >
                                    今
                                </button>
                                
                                <div className="flex items-center gap-1 px-1">
                                    <input 
                                        type="time" 
                                        value={startTime} 
                                        onChange={(e) => handleStartTimeChange(e.target.value)} 
                                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-[80px] text-center" 
                                    />
                                    <span className="text-slate-400 font-medium">〜</span>
                                    <input 
                                        type="time" 
                                        value={endTime} 
                                        onChange={(e) => handleEndTimeChange(e.target.value)} 
                                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-[80px] text-center" 
                                    />
                                </div>

                                {/* Requirement 2: Quick Add Button */}
                                <button 
                                    onClick={handleAdd5Min} 
                                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700 text-[11px] font-bold hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 active:scale-95 transition-all"
                                >
                                    +5分
                                </button>
                            </div>
                        )}
                        
                        {!isPreviewMode && !isCompareMode && (
                            /* Requirement 4: Validation Display */
                            <div className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm transition-all duration-300
                                ${totalMinutes >= 15 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                    : 'bg-orange-50 border-orange-200 text-orange-700 animate-pulse-slow'}
                            `}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 shrink-0">
                                    {totalMinutes >= 15 ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    )}
                                </svg>
                                <span className="text-[13px] font-black whitespace-nowrap">
                                    {totalMinutes}
                                    <AutoHideLabel>分</AutoHideLabel>
                                </span>
                                {totalMinutes < 15 && (
                                    <AutoHideLabel className="ml-1 text-[10px] font-bold opacity-80">
                                        15分未満です
                                    </AutoHideLabel>
                                )}
                            </div>
                        )}

                        <WithTooltip label={isPreviewMode ? "閉じる" : "プレビュー"}>
                            <button
                                className={`p-2 border rounded-lg shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center ${isPreviewMode ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
                                onClick={() => {
                                    if (isPreviewMode) {
                                        setIsPreviewMode(false); setIsPisaPreview(false); setIsCompareMode(false); setCompareTargetDates([]); setZoomLevel(0.7); setPreviewContentHeight(0);
                                    } else {
                                        if (isDirty) setIsSaveConfirmModalOpen(true); else setIsPreviewMode(true);
                                    }
                                }}
                            >
                                {isPreviewMode ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                )}
                            </button>
                        </WithTooltip>
                    </div>

                </div>
                {/* Controls Row */}
                {/* Controls Row - Improved for iPad balance */}
                <div className="max-w-full mx-auto flex items-center justify-between gap-3 px-1">
                    {/* Left Group */}
                    <div className="flex items-center gap-2 shrink-0 flex-1 justify-start">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center outline-none"
                            title="設定"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774a1.125 1.125 0 0 1 .12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.894.15c.542.09.94.56.94 1.109v1.094c0 .55-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 0 1-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.45.12l-.737-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.383.929-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.774-.773a1.125 1.125 0 0 1 1.45-.12l.738.527c.35.25.806.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        </button>
                        <MethodSelector current={measurementMethod} onChange={(m) => { setMeasurementMethod(m); if (m !== '6-point') setIsPisaPreview(false); }} />
                        <div className={`${measurementMethod === '1-point' || isPreviewMode || isCompareMode ? 'hidden' : 'block'}`}>
                            <MiniMap current={currentQuadrant} onSelect={setCurrentQuadrant} />
                        </div>
                    </div>

                    {/* Center Group */}
                    <div className="flex items-center gap-2 justify-center shrink-0">
                        <button
                            onClick={() => !isPreviewMode && !isCompareMode && setIsCalendarOpen(true)}
                            disabled={isPreviewMode || isCompareMode}
                            className={`bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-inner flex items-center gap-2 hover:bg-white active:bg-slate-100 transition-colors h-9 ${isPreviewMode || isCompareMode ? 'opacity-70 pointer-events-none' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500 shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                            </svg>
                            <AutoHideLabel className="ml-1">
                                {selectedDate.replace(/-/g, '/')}
                            </AutoHideLabel>
                        </button>
                        {!isPreviewMode && !isCompareMode && (
                            <WithTooltip label="直近の履歴">
                                <button
                                    onClick={handleLoadLatestHistory}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    <AutoHideLabel className="ml-1 text-xs font-bold">
                                        履歴
                                    </AutoHideLabel>
                                </button>
                            </WithTooltip>
                        )}
                    </div>

                    {/* Right Group */}
                    <div className="flex items-center gap-2 shrink-0 flex-1 justify-end">
                        {(isPreviewMode || isCompareMode) && (
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm h-9">
                                <button onClick={handleZoomOut} className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded active:bg-slate-200 transition-colors font-bold text-lg leading-none pb-1" title="縮小">−</button>
                                <span className="text-xs font-bold w-12 text-center text-slate-700 select-none">{Math.round(zoomLevel * 100)}%</span>
                                <button onClick={handleZoomIn} className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded active:bg-slate-200 transition-colors font-bold text-lg leading-none pb-1" title="拡大">+</button>
                            </div>
                        )}
                        {isPreviewMode && measurementMethod === '6-point' && (
                            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 shadow-inner h-9">
                                <button onClick={() => { setIsPisaPreview(false); }} className={`px-3 h-full rounded-md text-xs font-bold transition-all ${!isPisaPreview ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>チャート</button>
                                <button onClick={() => { setIsPisaPreview(true); }} className={`px-3 h-full rounded-md text-xs font-bold transition-all ${isPisaPreview ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}>PISA</button>
                            </div>
                        )}
                        {isPreviewMode && (
                            <WithTooltip label={isCompareMode ? "比較終了" : "比較モード"}>
                                <button
                                    className={`p-2 border rounded-lg shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center ${isCompareMode ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-200'}`}
                                    onClick={handleCompareClick}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" /></svg>
                                </button>
                            </WithTooltip>
                        )}
                        {/* Bulk Status (Edit Mode only) */}
                        {!isPreviewMode && !isCompareMode && (
                            <div className="flex items-center gap-1">
                                <WithTooltip label="全顎欠損">
                                    <button onClick={() => handleBulkStatusChange('all_missing')} className="h-9 px-2 text-[10px] font-bold bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">欠損</button>
                                </WithTooltip>
                                <WithTooltip label="全顎乳歯">
                                    <button onClick={() => handleBulkStatusChange('all_primary')} className="h-9 px-2 text-[10px] font-bold bg-white text-green-600 border border-slate-200 rounded-lg hover:bg-green-50 shadow-sm transition-colors">乳歯</button>
                                </WithTooltip>
                                <WithTooltip label="全て永久歯に戻す">
                                    <button onClick={() => handleBulkStatusChange('reset')} className="h-9 px-2 text-[10px] font-bold bg-white text-blue-600 border border-slate-200 rounded-lg hover:bg-blue-50 shadow-sm transition-colors">戻す</button>
                                </WithTooltip>
                            </div>
                        )}



                        {!isPreviewMode && (
                            <WithTooltip label="保存">
                                <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 h-9 flex items-center justify-center shadow-sm active:scale-95 transition-all" onClick={() => handleSave()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                                </button>
                            </WithTooltip>
                        )}

                        {!isPreviewMode && (
                            <WithTooltip label="データ削除">
                                <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 h-9 flex items-center justify-center shadow-sm active:scale-95 transition-all" onClick={() => setIsDeleteModalOpen(true)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                </button>
                            </WithTooltip>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full overflow-auto relative bg-slate-100 print:bg-white print:p-0 print:block">
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

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <ExaminerModal
                isOpen={isExaminerModalOpen}
                onClose={() => setIsExaminerModalOpen(false)}
                examiners={mockExaminers}
                onSelect={(examiner) => {
                    setSelectedExaminer(examiner);
                    setIsExaminerModalOpen(false);
                    setIsDirty(true);
                }}
                selectedId={selectedExaminer.id}
            />

        </div>
    );
};

export default App;