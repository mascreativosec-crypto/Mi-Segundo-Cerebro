/**
 * IndexedDB persistence for full PDF books uploaded to Biblioteca de Sabiduría.
 * Keeps large PDF binaries out of localStorage while persisting seamlessly across reloads.
 */

const DB_NAME = 'msc_4_0_pdf_books_db';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_files';

interface StoredPdfRecord {
  bookId: string;
  fileName: string;
  sizeBytes: number;
  data: ArrayBuffer;
  savedAt: string;
}

function openPdfDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'bookId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir almacenamiento local de PDFs'));
  });
}

export const PdfBookStorage = {
  async savePdf(bookId: string, file: File): Promise<{ fileName: string; sizeBytes: number; arrayBuffer: ArrayBuffer }> {
    const arrayBuffer = await file.arrayBuffer();
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredPdfRecord = {
        bookId,
        fileName: file.name,
        sizeBytes: file.size,
        data: arrayBuffer.slice(0),
        savedAt: new Date().toISOString(),
      };
      store.put(record);
      tx.oncomplete = () => {
        db.close();
        resolve({ fileName: file.name, sizeBytes: file.size, arrayBuffer });
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error('Error guardando PDF en biblioteca local'));
      };
    });
  },

  async getPdf(bookId: string): Promise<ArrayBuffer | null> {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(bookId);
      req.onsuccess = () => {
        db.close();
        const record = req.result as StoredPdfRecord | undefined;
        resolve(record?.data ? record.data.slice(0) : null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error || new Error('Error leyendo PDF guardado'));
      };
    });
  },

  async deletePdf(bookId: string): Promise<void> {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(bookId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error('Error eliminando PDF'));
      };
    });
  },
};
