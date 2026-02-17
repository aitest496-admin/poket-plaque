import React from 'react';
import * as Icons from './Icons';
import WithTooltip from './common/WithTooltip';
import MiniMap from './common/MiniMap';
import MethodSelector from './common/MethodSelector';
import { MeasurementMethod, Quadrant } from '../types';

interface EditorHeaderProps {
    measurementMethod: MeasurementMethod;
    setMeasurementMethod: (m: MeasurementMethod) => void;
    currentQuadrant: Quadrant;
    setCurrentQuadrant: (q: Quadrant) => void;
    isPreviewMode: boolean;
    setIsPreviewMode: React.Dispatch<React.SetStateAction<boolean>>;
    isCompareMode: boolean;
    selectedDate: string;
    markedDates: string[];
    setIsCalendarOpen: (open: boolean) => void;
    handleSave: () => void;
    handleCompareClick: () => void;
    handleLoadHistory: () => void;
    setIsDeleteModalOpen: (open: boolean) => void;
    handleBulkStatusChange: (mode: 'all_missing' | 'all_primary' | 'reset') => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
    measurementMethod,
    setMeasurementMethod,
    currentQuadrant,
    setCurrentQuadrant,
    isPreviewMode,
    setIsPreviewMode,
    isCompareMode,
    selectedDate,
    markedDates,
    setIsCalendarOpen,
    handleSave,
    handleCompareClick,
    handleLoadHistory,
    setIsDeleteModalOpen,
    handleBulkStatusChange,
}) => {
    return (
        <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-2 sticky top-0 z-50 shrink-0 print:hidden">
            <div className="max-w-full mx-auto grid grid-cols-3 items-center gap-4">

                {/* Column 1: Tabs, Save, Compare, Preview */}
                <div className="flex items-center pr-2 gap-3">
                    <div className={`${measurementMethod === '1-point' || isPreviewMode ? 'hidden' : 'block'}`}>
                        <MiniMap
                            current={currentQuadrant}
                            onSelect={setCurrentQuadrant}
                        />
                    </div>

                    <MethodSelector current={measurementMethod} onChange={setMeasurementMethod} />

                    <div className="flex items-center gap-2">
                        {!isPreviewMode && (
                            <WithTooltip label="保存">
                                <button
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center"
                                    aria-label="Save"
                                    onClick={handleSave}
                                >
                                    <Icons.SaveIcon />
                                </button>
                            </WithTooltip>
                        )}

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
                                    <Icons.CompareIcon />
                                </button>
                            </WithTooltip>
                        )}

                        <WithTooltip label={isPreviewMode ? "プレビューを閉じる" : "プレビュー"}>
                            <button
                                className={`p-2 border rounded-lg shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center
                      ${isPreviewMode
                                        ? 'bg-slate-800 text-white border-slate-900 hover:bg-slate-700'
                                        : 'bg-white text-slate-600 border-slate-200 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50'
                                    }
                  `}
                                aria-label={isPreviewMode ? "Close Preview" : "Preview"}
                                onClick={() => setIsPreviewMode(prev => !prev)}
                            >
                                {isPreviewMode ? <Icons.CloseIcon /> : <Icons.PreviewIcon />}
                            </button>
                        </WithTooltip>
                    </div>
                </div>

                {/* Column 2: Date Picker and History */}
                <div className="flex justify-center items-center gap-3">
                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        disabled={isPreviewMode}
                        className={`bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-inner flex items-center gap-2 hover:bg-white active:bg-slate-100 transition-colors h-9 ${isPreviewMode ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                        <Icons.CalendarIcon />
                        {selectedDate.replace(/-/g, '/')}
                    </button>

                    {!isPreviewMode && (
                        <WithTooltip label="直近の過去データを展開">
                            <button
                                onClick={handleLoadHistory}
                                disabled={markedDates.filter(d => d < selectedDate).length === 0}
                                className={`p-2 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center gap-1
                  ${markedDates.filter(d => d < selectedDate).length === 0
                                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                                        : 'text-slate-600 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50'
                                    }
                `}
                                aria-label="Load History"
                            >
                                <Icons.HistoryIcon />
                                <span className="text-xs font-bold hidden sm:inline">履歴</span>
                            </button>
                        </WithTooltip>
                    )}
                </div>

                {/* Column 3: Bulk Status and Delete */}
                <div className="flex justify-end items-center pl-2 gap-3">
                    {!isPreviewMode && !isCompareMode && (
                        <div className="flex items-center gap-1">
                            <WithTooltip label="全顎を欠損にします">
                                <button
                                    onClick={() => handleBulkStatusChange('all_missing')}
                                    className="h-9 px-2 text-xs font-bold bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-colors"
                                >
                                    全顎欠損
                                </button>
                            </WithTooltip>
                            <WithTooltip label="1-5番を乳歯、6-8番を欠損にします">
                                <button
                                    onClick={() => handleBulkStatusChange('all_primary')}
                                    className="h-9 px-2 text-xs font-bold bg-white text-green-600 border border-slate-200 rounded-lg hover:bg-green-50 hover:text-green-700 shadow-sm transition-colors"
                                >
                                    全顎乳歯
                                </button>
                            </WithTooltip>
                            <WithTooltip label="全ての歯を永久歯に戻します">
                                <button
                                    onClick={() => handleBulkStatusChange('reset')}
                                    className="h-9 px-2 text-xs font-bold bg-white text-blue-600 border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-700 shadow-sm transition-colors"
                                >
                                    リセット
                                </button>
                            </WithTooltip>
                        </div>
                    )}

                    <WithTooltip label="データ削除" className={isPreviewMode || isCompareMode ? 'invisible' : ''}>
                        <button
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm active:scale-95 transition-all h-9 flex items-center justify-center"
                            aria-label="Delete"
                            disabled={isPreviewMode || isCompareMode}
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            <Icons.DeleteIcon />
                        </button>
                    </WithTooltip>
                </div>
            </div>
        </header>
    );
};

export default EditorHeader;
