export interface Plaque {
    distal: boolean;
    buccal: boolean; // or Labial
    mesial: boolean;
    lingual: boolean; // or Palatal
    occlusal: boolean;
}

export type MeasurementTriple<T> = [T, T, T];

export interface SurfaceMeasurements<T> {
    buccal: MeasurementTriple<T>;
    lingual: MeasurementTriple<T>;
}

export interface ToothData {
    id: number; // 1-8
    mobility: number;
    plaque: Plaque;

    // 6-point measurements split into buccal/lingual triples
    pus: SurfaceMeasurements<boolean>;
    bleeding: SurfaceMeasurements<boolean>;
    pocketDepth: SurfaceMeasurements<number | null>;

    isMissing?: boolean; // Indicates if the tooth is missing
    isPrimary?: boolean; // New: Indicates if the tooth is a primary tooth
}

export enum Surface {
    Distal = 'distal',
    Buccal = 'buccal',
    Mesial = 'mesial',
    Lingual = 'lingual',
    Occlusal = 'occlusal',
}

export type MeasurementPoint = 0 | 1 | 2; // 0: Left, 1: Center, 2: Right

export type MeasurementMethod = '1-point' | '4-point' | '6-point';

export type Quadrant = 'UL' | 'UR' | 'LL' | 'LR';