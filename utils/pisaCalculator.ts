import { ToothData, SurfaceMeasurements } from '../types';

// ============================================================================
// 日本版 PESA 線形係数テーブル (Ueda et al. 2022)
// PESA = coefficient × mean PPD (mm²)
// 歯種は FDI の番号 1-8 に対応 (1=中切歯, 2=側切歯, ... 7=第二大臼歯, 8=第三大臼歯)
// 第三大臼歯(8番)は論文に含まれないため、第二大臼歯の係数を代用
// ============================================================================

const PESA_COEFFICIENTS: Record<'upper' | 'lower', Record<number, number>> = {
    upper: {
        1: 16.96, // 中切歯
        2: 17.54, // 側切歯
        3: 20.52, // 犬歯
        4: 20.90, // 第一小臼歯
        5: 19.98, // 第二小臼歯
        6: 33.72, // 第一大臼歯
        7: 31.10, // 第二大臼歯
        8: 31.10, // 第三大臼歯 (第二大臼歯の値を代用)
    },
    lower: {
        1: 12.70, // 中切歯
        2: 15.91, // 側切歯
        3: 20.13, // 犬歯
        4: 19.32, // 第一小臼歯
        5: 18.04, // 第二小臼歯
        6: 34.27, // 第一大臼歯
        7: 27.56, // 第二大臼歯
        8: 27.56, // 第三大臼歯 (第二大臼歯の値を代用)
    },
};

type Quadrant = 'UL' | 'UR' | 'LL' | 'LR';
type Jaw = 'upper' | 'lower';

/** 象限から上下顎を判定 */
function getJaw(quadrant: Quadrant): Jaw {
    return quadrant.startsWith('U') ? 'upper' : 'lower';
}

/** PESA係数を取得 */
function getPesaCoefficient(toothId: number, quadrant: Quadrant): number {
    const jaw = getJaw(quadrant);
    return PESA_COEFFICIENTS[jaw][toothId] ?? 0;
}

/** 6点のPPD値をフラットに取得 (buccal[0,1,2], lingual[0,1,2]) */
function getAllPPDValues(tooth: ToothData): (number | null)[] {
    return [
        ...tooth.pocketDepth.buccal,
        ...tooth.pocketDepth.lingual,
    ];
}

/** 6点のBOP値をフラットに取得 */
function getAllBOPValues(tooth: ToothData): boolean[] {
    return [
        ...tooth.bleeding.buccal,
        ...tooth.bleeding.lingual,
    ];
}

/** 歯ごとのPISA計算結果 */
export interface ToothPISAResult {
    toothId: number;
    quadrant: Quadrant;
    fdiNumber: string;      // FDI表記 (例: "11", "21", "46")
    isMissing: boolean;
    meanPPD: number;        // 平均PPD (mm)
    pesaCoefficient: number;// PESA係数
    pesa: number;           // PESA = coefficient × meanPPD (mm²)
    bopPositive: number;    // BOP陽性サイト数
    bopTotal: number;       // 全サイト数
    bopRatio: number;       // BOP陽性率 (0-1)
    pisa: number;           // PISA = PESA × bopRatio (mm²)
    unmeasuredSites: number;// 未入力サイト数
}

/** 全口腔PISA計算結果 */
export interface FullMouthPISAResult {
    totalPISA: number;                                  // 全口腔PISA合計 (mm²)
    totalPESA: number;                                  // 全口腔PESA合計 (mm²)
    totalBOPPositive: number;                           // 全BOP陽性数
    totalBOPSites: number;                              // 全サイト数
    totalBOPPercent: number;                             // BOP陽性率 (%)
    quadrantPISA: Record<Quadrant, number>;             // 象限別PISA
    teethResults: Record<Quadrant, ToothPISAResult[]>;  // 歯ごとの結果
    severity: 'healthy' | 'mild' | 'moderate' | 'severe'; // 重症度
    presentTeethCount: number;                           // 残存歯数
    totalUnmeasuredSites: number;                        // 全未入力サイト数
}

/** FDI歯式番号を算出 (象限番号 + 歯番号) */
function toFDI(toothId: number, quadrant: Quadrant): string {
    const quadrantNumber: Record<Quadrant, number> = {
        UR: 1, UL: 2, LL: 3, LR: 4,
    };
    return `${quadrantNumber[quadrant]}${toothId}`;
}

/** 重症度判定 */
function getSeverity(pisa: number): 'healthy' | 'mild' | 'moderate' | 'severe' {
    if (pisa < 200) return 'healthy';
    if (pisa < 500) return 'mild';
    if (pisa < 1000) return 'moderate';
    return 'severe';
}

/** 歯ごとのPISAを計算 */
export function calculateToothPISA(tooth: ToothData, quadrant: Quadrant): ToothPISAResult {
    const fdiNumber = toFDI(tooth.id, quadrant);
    const pesaCoefficient = getPesaCoefficient(tooth.id, quadrant);

    // 欠損歯は全てゼロ
    if (tooth.isMissing) {
        return {
            toothId: tooth.id,
            quadrant,
            fdiNumber,
            isMissing: true,
            meanPPD: 0,
            pesaCoefficient,
            pesa: 0,
            bopPositive: 0,
            bopTotal: 0,
            bopRatio: 0,
            pisa: 0,
        };
    }

    // PPD値の収集
    const ppdValues = getAllPPDValues(tooth);
    const validPPDs = ppdValues.filter((v): v is number => v !== null && v > 0);
    const meanPPD = validPPDs.length > 0
        ? validPPDs.reduce((sum, v) => sum + v, 0) / validPPDs.length
        : 0;

    // PESA計算
    const pesa = pesaCoefficient * meanPPD;

    // BOP計算
    const bopValues = getAllBOPValues(tooth);
    const bopTotal = bopValues.length;  // 常に6
    const bopPositive = bopValues.filter(v => v === true).length;
    const bopRatio = bopTotal > 0 ? bopPositive / bopTotal : 0;

    // PISA計算
    const pisa = pesa * bopRatio;

    // 未入力サイト数
    const unmeasuredSites = ppdValues.filter(v => v === null).length;

    return {
        toothId: tooth.id,
        quadrant,
        fdiNumber,
        isMissing: false,
        meanPPD: Math.round(meanPPD * 100) / 100,
        pesaCoefficient,
        pesa: Math.round(pesa * 100) / 100,
        bopPositive,
        bopTotal,
        bopRatio: Math.round(bopRatio * 1000) / 1000,
        pisa: Math.round(pisa * 100) / 100,
        unmeasuredSites,
    };
}

/** 全口腔PISAを計算 */
export function calculateFullMouthPISA(
    data: { UL: ToothData[]; UR: ToothData[]; LL: ToothData[]; LR: ToothData[] }
): FullMouthPISAResult {
    const quadrants: Quadrant[] = ['UR', 'UL', 'LR', 'LL'];
    const teethResults: Record<Quadrant, ToothPISAResult[]> = {
        UR: [], UL: [], LR: [], LL: [],
    };
    const quadrantPISA: Record<Quadrant, number> = {
        UR: 0, UL: 0, LR: 0, LL: 0,
    };

    let totalPISA = 0;
    let totalPESA = 0;
    let totalBOPPositive = 0;
    let totalBOPSites = 0;
    let presentTeethCount = 0;
    let totalUnmeasuredSites = 0;

    for (const q of quadrants) {
        const teeth = data[q];
        for (const tooth of teeth) {
            const result = calculateToothPISA(tooth, q);
            teethResults[q].push(result);
            quadrantPISA[q] += result.pisa;
            totalPISA += result.pisa;
            totalPESA += result.pesa;
            totalBOPPositive += result.bopPositive;
            totalBOPSites += result.bopTotal;
            if (!result.isMissing) {
                presentTeethCount++;
                totalUnmeasuredSites += (result as any).unmeasuredSites || 0;
            }
        }
    }

    // 象限値を丸める
    for (const q of quadrants) {
        quadrantPISA[q] = Math.round(quadrantPISA[q] * 100) / 100;
    }

    return {
        totalPISA: Math.round(totalPISA * 100) / 100,
        totalPESA: Math.round(totalPESA * 100) / 100,
        totalBOPPositive,
        totalBOPSites,
        totalBOPPercent: totalBOPSites > 0
            ? Math.round((totalBOPPositive / totalBOPSites) * 1000) / 10
            : 0,
        quadrantPISA,
        teethResults,
        severity: getSeverity(totalPISA),
        presentTeethCount,
        totalUnmeasuredSites,
    };
}
