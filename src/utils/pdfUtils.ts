import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfMetaAndCover {
  totalPages: number;
  coverImageDataUrl?: string;
}

/**
 * Extracts total page count and renders Page 1 of a PDF to a lightweight JPEG data URL
 * so the Biblioteca displays real Apple Books-style cover art without bloating localStorage.
 */
export async function extractPdfMetaAndCover(
  arrayBuffer: ArrayBuffer,
  targetWidth = 320
): Promise<PdfMetaAndCover> {
  const task = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
  try {
    const doc = await task.promise;
    const totalPages = Math.max(1, doc.numPages);
    let coverImageDataUrl: string | undefined;

    try {
      const page = await doc.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, Math.max(0.25, targetWidth / Math.max(1, baseViewport.width)));
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;
        coverImageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (coverErr) {
      console.warn('Could not render PDF cover preview:', coverErr);
    }

    return { totalPages, coverImageDataUrl };
  } finally {
    void task.destroy();
  }
}

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extracts selectable PDF text intersecting a normalized [0..1] highlight rectangle on a page.
 */
export async function extractTextFromPageRect(
  page: pdfjsLib.PDFPageProxy,
  rect: NormalizedRect
): Promise<string> {
  try {
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const rx1 = rect.x * viewport.width;
    const ry1 = rect.y * viewport.height;
    const rx2 = (rect.x + rect.width) * viewport.width;
    const ry2 = (rect.y + rect.height) * viewport.height;

    const matched: { x: number; y: number; str: string }[] = [];

    for (const rawItem of textContent.items) {
      if (!('str' in rawItem) || !rawItem.str || !rawItem.str.trim()) continue;
      const item = rawItem as {
        str: string;
        transform: number[];
        width: number;
        height: number;
      };

      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontHeight = Math.hypot(tx[2], tx[3]) || item.height || 10;
      const itemX = tx[4];
      const itemY = tx[5] - fontHeight * 0.85;
      const itemW = Math.max(4, item.width || item.str.length * (fontHeight * 0.48));
      const itemH = Math.max(6, fontHeight * 1.15);

      const ix1 = itemX;
      const iy1 = itemY;
      const ix2 = itemX + itemW;
      const iy2 = itemY + itemH;

      const overlaps = ix1 <= rx2 + 4 && ix2 >= rx1 - 4 && iy1 <= ry2 + 4 && iy2 >= ry1 - 4;
      if (overlaps) {
        matched.push({ x: itemX, y: itemY, str: item.str });
      }
    }

    matched.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 8) return a.y - b.y;
      return a.x - b.x;
    });

    return matched
      .map((m) => m.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}
