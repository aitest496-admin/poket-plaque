import { ToothData, MeasurementMethod } from "../types";

const DB_NAME = 'SmartPerioChartDB';
const DB_VERSION = 2; // Bumped for examiner store
const STORE_NAME = 'charts';
const EXAMINER_STORE = 'examiners';

export interface ChartRecord {
  date: string; // Key
  data: Record<MeasurementMethod, { UL: ToothData[]; UR: ToothData[]; LL: ToothData[]; LR: ToothData[] }>;
  updatedAt: number;
  startTime?: string;
  endTime?: string;
  examinerId?: string;
  examinerName?: string;
  examinerColor?: string;
  examinerRole?: 'none' | 'dentist' | 'hygienist';
}

export interface ExaminerRecord {
  id: string;
  name: string;
  role: 'none' | 'dentist' | 'hygienist'; // 担当無し / 歯科医師 / 衛生士
  color: string;
  order: number; // for sorting
  hidden: boolean; // hidden from list but preserved in master
}

// Open Database Helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(EXAMINER_STORE)) {
        db.createObjectStore(EXAMINER_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const DentalDB = {
  // Save chart data for a specific date
  saveChart: async (record: ChartRecord): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Get chart data by date
  getChart: async (date: string): Promise<ChartRecord | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(date);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Get all saved dates (for history)
  getAllDates: async (): Promise<string[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        // Sort dates descending
        const dates = (request.result as string[]).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        resolve(dates);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // Get all chart records
  getAllCharts: async (): Promise<ChartRecord[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as ChartRecord[]);
      request.onerror = () => reject(request.error);
    });
  },

  // Delete chart data
  deleteChart: async (date: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(date);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // ---- Examiner CRUD ----

  getAllExaminers: async (): Promise<ExaminerRecord[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EXAMINER_STORE], 'readonly');
      const store = transaction.objectStore(EXAMINER_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result as ExaminerRecord[]).sort((a, b) => a.order - b.order);
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  },

  saveExaminer: async (examiner: ExaminerRecord): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EXAMINER_STORE], 'readwrite');
      const store = transaction.objectStore(EXAMINER_STORE);
      const request = store.put(examiner);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  saveAllExaminers: async (examiners: ExaminerRecord[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EXAMINER_STORE], 'readwrite');
      const store = transaction.objectStore(EXAMINER_STORE);

      // Clear and re-insert
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        let count = examiners.length;
        if (count === 0) { resolve(); return; }
        examiners.forEach((ex) => {
          const req = store.put(ex);
          req.onsuccess = () => { count--; if (count === 0) resolve(); };
          req.onerror = () => reject(req.error);
        });
      };
      clearReq.onerror = () => reject(clearReq.error);
    });
  },

  deleteExaminer: async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EXAMINER_STORE], 'readwrite');
      const store = transaction.objectStore(EXAMINER_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Replace examinerId in all chart records that reference a deleted examiner
  reassignExaminerInCharts: async (deletedId: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getAllReq = store.getAll();

      getAllReq.onsuccess = () => {
        const records = getAllReq.result as ChartRecord[];
        let pending = 0;
        records.forEach((record) => {
          if (record.examinerId === deletedId) {
            record.examinerId = 'none';
            record.examinerName = '担当無し';
            record.examinerColor = 'bg-slate-400';
            record.examinerRole = 'none';
            pending++;
            const putReq = store.put(record);
            putReq.onsuccess = () => { pending--; if (pending === 0) resolve(); };
            putReq.onerror = () => reject(putReq.error);
          }
        });
        if (pending === 0) resolve();
      };
      getAllReq.onerror = () => reject(getAllReq.error);
    });
  }
};
