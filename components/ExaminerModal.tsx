import React from 'react';

export interface Examiner {
    id: string;
    name: string;
    color: string;
}

interface ExaminerModalProps {
    isOpen: boolean;
    onClose: () => void;
    examiners: Examiner[];
    onSelect: (examiner: Examiner) => void;
    selectedId?: string;
}

const ExaminerModal: React.FC<ExaminerModalProps> = ({ isOpen, onClose, examiners, onSelect, selectedId }) => {
    if (!isOpen) return null;

    const getShortName = (name: string) => {
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
            return parts[0][0] + parts[1][0];
        }
        return name.substring(0, 2);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-fade-in-up">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        検査実施者を選択
                    </h3>
                    <button onPointerDown={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-4 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
                    {examiners.map((examiner) => {
                        const isSelected = selectedId === examiner.id;
                        return (
                            <button
                                key={examiner.id}
                                onPointerDown={() => onSelect(examiner)}
                                className={`
                                    w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 group
                                    ${isSelected 
                                        ? 'bg-blue-50 border-blue-500 shadow-sm' 
                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]'}
                                `}
                            >
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md transition-transform group-hover:scale-110
                                    ${examiner.color}
                                `}>
                                    {getShortName(examiner.name)}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className={`font-black text-lg ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                        {examiner.name}
                                    </div>
                                    <div className="text-xs text-slate-400 font-bold">
                                        歯科医師 / 歯科衛生士
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="bg-blue-500 text-white p-1 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold">
                    実施者の追加・編集は設定画面から行えます
                </div>
            </div>
        </div>
    );
};

export default ExaminerModal;
