import React, { useMemo, useState } from 'react';

export type ExaminerRole = 'none' | 'dentist' | 'hygienist';

export interface Examiner {
    id: string;
    name: string;
    color: string;
    role: ExaminerRole;
    order: number;
    hidden?: boolean;
}

export const NONE_EXAMINER_ID = 'none';

export const ROLE_LABELS: Record<ExaminerRole, string> = {
    none: '担当無し',
    dentist: '歯科医師',
    hygienist: '衛生士',
};

interface ExaminerModalProps {
    isOpen: boolean;
    onClose: () => void;
    examiners: Examiner[];
    onSelect: (examiner: Examiner) => void;
    selectedId?: string;
    onAdd: (input: { name: string; role: Exclude<ExaminerRole, 'none'> }) => Promise<void> | void;
    onUpdate: (id: string, updates: Partial<Pick<Examiner, 'name' | 'role'>>) => Promise<void> | void;
    onMove: (id: string, direction: 'up' | 'down') => Promise<void> | void;
    onToggleHidden: (id: string, hidden: boolean) => Promise<void> | void;
    onDelete: (id: string) => Promise<void> | void;
}

const roleOptions: Array<{ value: Exclude<ExaminerRole, 'none'>; label: string }> = [
    { value: 'dentist', label: '歯科医師' },
    { value: 'hygienist', label: '衛生士' },
];

const ExaminerModal: React.FC<ExaminerModalProps> = ({
    isOpen,
    onClose,
    examiners,
    onSelect,
    selectedId,
    onAdd,
    onUpdate,
    onMove,
    onToggleHidden,
    onDelete,
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<Exclude<ExaminerRole, 'none'>>('hygienist');
    const [formError, setFormError] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const sortedExaminers = useMemo(
        () => [...examiners].sort((a, b) => a.order - b.order),
        [examiners]
    );

    if (!isOpen) return null;

    const getShortName = (name: string, id: string) => {
        if (id === NONE_EXAMINER_ID) return 'なし';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return parts[0][0] + parts[1][0];
        }
        return name.substring(0, 2);
    };

    const visibleExaminers = isEditMode
        ? sortedExaminers
        : sortedExaminers.filter((examiner) => !examiner.hidden);

    const editableExaminers = sortedExaminers.filter((examiner) => examiner.id !== NONE_EXAMINER_ID);

    const runWithBusy = async (id: string, task: () => Promise<void> | void) => {
        setBusyId(id);
        try {
            await task();
        } finally {
            setBusyId(null);
        }
    };

    const handleAdd = async () => {
        const trimmedName = newName.trim();
        if (!trimmedName) {
            setFormError('名前を入力してください');
            return;
        }

        setFormError('');
        await runWithBusy('add', async () => {
            await onAdd({ name: trimmedName, role: newRole });
            setNewName('');
            setNewRole('hygienist');
            setIsAdding(false);
        });
    };

    const handleNameBlur = async (examiner: Examiner, value: string) => {
        const trimmed = value.trim();
        if (!trimmed || trimmed === examiner.name) return;
        await runWithBusy(examiner.id, () => onUpdate(examiner.id, { name: trimmed }));
    };

    const handleRoleChange = async (examiner: Examiner, value: ExaminerRole) => {
        if (value === 'none' || value === examiner.role) return;
        await runWithBusy(examiner.id, () => onUpdate(examiner.id, { role: value }));
    };

    const handleClose = () => {
        setIsEditMode(false);
        setIsAdding(false);
        setFormError('');
        setPendingDeleteId(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-fade-in-up">
                <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 min-w-0 flex-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-blue-600 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        <span className="truncate">検査実施者を選択</span>
                    </h3>

                    <div className="flex items-center gap-2">
                        <button
                            onPointerDown={() => {
                                setIsAdding((prev) => !prev);
                                setFormError('');
                            }}
                            className="w-9 h-9 rounded-lg bg-blue-600 text-white font-black text-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
                            title="新規担当者追加"
                            aria-label="新規担当者追加"
                        >
                            +
                        </button>
                        <button
                            onPointerDown={() => {
                                setIsEditMode((prev) => !prev);
                                setPendingDeleteId(null);
                            }}
                            className={`h-9 px-3 rounded-lg border text-xs font-black shadow-sm active:scale-95 transition-all ${
                                isEditMode
                                    ? 'bg-slate-800 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {isEditMode ? '完了' : '編集'}
                        </button>
                        <button onPointerDown={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all" aria-label="閉じる">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {isAdding && (
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                        <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-center">
                            <input
                                value={newName}
                                onChange={(event) => setNewName(event.target.value)}
                                placeholder="名前"
                                className="h-11 px-3 rounded-lg border border-blue-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                            <select
                                value={newRole}
                                onChange={(event) => setNewRole(event.target.value as Exclude<ExaminerRole, 'none'>)}
                                className="h-11 px-3 rounded-lg border border-blue-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            >
                                {roleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <button
                                onPointerDown={handleAdd}
                                disabled={busyId === 'add'}
                                className="h-11 px-4 rounded-lg bg-blue-600 text-white text-sm font-black shadow-sm hover:bg-blue-700 disabled:bg-blue-300 active:scale-95 transition-all"
                            >
                                追加
                            </button>
                        </div>
                        {formError && <div className="mt-2 text-xs font-bold text-red-600">{formError}</div>}
                    </div>
                )}

                <div className="p-4 grid grid-cols-1 gap-2 max-h-[64vh] overflow-y-auto">
                    {visibleExaminers.map((examiner) => {
                        const isSelected = selectedId === examiner.id;
                        const isNone = examiner.id === NONE_EXAMINER_ID;
                        const editableIndex = editableExaminers.findIndex((item) => item.id === examiner.id);
                        const canMoveUp = editableIndex > 0;
                        const canMoveDown = editableIndex >= 0 && editableIndex < editableExaminers.length - 1;

                        if (isEditMode) {
                            return (
                                <div
                                    key={examiner.id}
                                    className={`rounded-xl border-2 p-3 transition-all ${
                                        examiner.hidden ? 'bg-slate-50 border-dashed border-slate-300 opacity-80' : 'bg-white border-slate-100'
                                    }`}
                                >
                                    <div className="grid grid-cols-[52px_1fr_126px_168px] gap-3 items-center">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md ${examiner.color}`}>
                                            {getShortName(examiner.name, examiner.id)}
                                        </div>

                                        <div className="min-w-0">
                                            <input
                                                defaultValue={examiner.name}
                                                disabled={isNone}
                                                onBlur={(event) => handleNameBlur(examiner, event.target.value)}
                                                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-black text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                            />
                                            <div className="mt-1 text-[10px] font-bold text-slate-400">
                                                {isNone ? '先頭固定・削除不可' : examiner.hidden ? '非表示中' : '一覧に表示中'}
                                            </div>
                                        </div>

                                        <select
                                            value={examiner.role}
                                            disabled={isNone}
                                            onChange={(event) => handleRoleChange(examiner, event.target.value as ExaminerRole)}
                                            className="h-10 px-2 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        >
                                            {isNone && <option value="none">担当無し</option>}
                                            {roleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>

                                        <div className="grid grid-cols-4 gap-1">
                                            <button
                                                onPointerDown={() => canMoveUp && runWithBusy(examiner.id, () => onMove(examiner.id, 'up'))}
                                                disabled={isNone || !canMoveUp || busyId === examiner.id}
                                                className="h-9 rounded-lg border border-slate-200 text-xs font-black text-slate-600 disabled:text-slate-300 disabled:bg-slate-50 hover:bg-slate-100"
                                                title="上へ"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onPointerDown={() => canMoveDown && runWithBusy(examiner.id, () => onMove(examiner.id, 'down'))}
                                                disabled={isNone || !canMoveDown || busyId === examiner.id}
                                                className="h-9 rounded-lg border border-slate-200 text-xs font-black text-slate-600 disabled:text-slate-300 disabled:bg-slate-50 hover:bg-slate-100"
                                                title="下へ"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                onPointerDown={() => !isNone && runWithBusy(examiner.id, () => onToggleHidden(examiner.id, !examiner.hidden))}
                                                disabled={isNone || busyId === examiner.id}
                                                className={`h-9 rounded-lg border text-[10px] font-black disabled:text-slate-300 disabled:bg-slate-50 ${
                                                    examiner.hidden
                                                        ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {examiner.hidden ? '再表示' : '非表示'}
                                            </button>
                                            <button
                                                onPointerDown={() => !isNone && setPendingDeleteId(examiner.id)}
                                                disabled={isNone || busyId === examiner.id}
                                                className="h-9 rounded-lg border border-red-200 text-[10px] font-black text-red-600 disabled:text-slate-300 disabled:bg-slate-50 hover:bg-red-50"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>

                                    {pendingDeleteId === examiner.id && (
                                        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                                            <div className="text-xs font-bold text-red-800 leading-relaxed">
                                                この担当者を削除します。過去にこの担当者が実施した検査は、すべて「担当無し」に変更されます。
                                            </div>
                                            <div className="mt-3 flex justify-end gap-2">
                                                <button
                                                    onPointerDown={() => setPendingDeleteId(null)}
                                                    className="h-9 px-3 rounded-lg bg-white border border-red-200 text-xs font-black text-slate-700"
                                                >
                                                    キャンセル
                                                </button>
                                                <button
                                                    onPointerDown={() => runWithBusy(examiner.id, async () => {
                                                        await onDelete(examiner.id);
                                                        setPendingDeleteId(null);
                                                    })}
                                                    className="h-9 px-3 rounded-lg bg-red-600 text-white text-xs font-black shadow-sm hover:bg-red-700"
                                                >
                                                    削除する
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }

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
                                    {getShortName(examiner.name, examiner.id)}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className={`font-black text-lg ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                        {examiner.name}
                                    </div>
                                    <div className="text-xs text-slate-400 font-bold">
                                        {ROLE_LABELS[examiner.role]}
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
                    担当無しは先頭固定です。非表示はマスタに残り、削除は過去検査を担当無しへ変更します。
                </div>
            </div>
        </div>
    );
};

export default ExaminerModal;
