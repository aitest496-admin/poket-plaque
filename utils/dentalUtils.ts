import { ToothData } from '../types';

/**
 * 歯の基本データを生成します。
 */
export const createTooth = (id: number): ToothData => ({
    id,
    isMissing: false,
    isPrimary: false,
    mobility: 0,
    pocketDepth: { buccal: [2, 2, 2], lingual: [2, 2, 2] },
    bleeding: { buccal: [false, false, false], lingual: [false, false, false] },
    pus: { buccal: [false, false, false], lingual: [false, false, false] },
    plaque: { distal: false, buccal: false, mesial: false, lingual: false, occlusal: false },
});

/**
 * 指定されたID範囲の歯データを生成します。
 */
export const generateTeeth = (ids: number[]): ToothData[] =>
    ids.map(id => createTooth(id));

/**
 * 全顎（1点, 4点, 6点法共通）の初期データを生成します。
 */
export const generateFullMouth = () => ({
    UL: generateTeeth([8, 7, 6, 5, 4, 3, 2, 1]),
    UR: generateTeeth([1, 2, 3, 4, 5, 6, 7, 8]),
    LL: generateTeeth([8, 7, 6, 5, 4, 3, 2, 1]),
    LR: generateTeeth([1, 2, 3, 4, 5, 6, 7, 8]),
});

/**
 * 歯のIDを表示用にフォーマットします（乳歯の場合はA-Eに変換）。
 */
export const formatToothId = (id: number, isPrimary?: boolean) => {
    if (!isPrimary) return id.toString();
    const map = ['A', 'B', 'C', 'D', 'E'];
    return map[id - 1] ?? id.toString();
};
