import React, { useRef, useState } from 'react';
import { GripHorizontal, Trash2, Copy, X } from 'lucide-react';
import { NoteEmbeddedImage } from '../../types';

const EMBED_MAX_WIDTH = 960;
const EMBED_MAX_BYTES = 180 * 1024; // ~180 KB ceiling to keep backups & server fast

function estimateBytes(dataUrl: string): number {
  const b64 = dataUrl.split(',')[1] || '';
  return Math.round((b64.length * 3) / 4);
}

export async function compressEmbeddedNoteImage(
  file: File
): Promise<{ dataUrl: string; width: number; height: number; sizeKb: number }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona una imagen válida (JPG, PNG o WebP).');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('La imagen supera 15 MB. Elige un archivo más ligero.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
      el.src = objectUrl;
    });

    const natW = img.naturalWidth || img.width || 600;
    const natH = img.naturalHeight || img.height || 400;
    const scale = Math.min(1, EMBED_MAX_WIDTH / natW);
    const outW = Math.max(120, Math.round(natW * scale));
    const outH = Math.max(90, Math.round(natH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, outW, outH);

    let dataUrl = canvas.toDataURL('image/webp', 0.8);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    }

    let q = 0.72;
    while (estimateBytes(dataUrl) > EMBED_MAX_BYTES && q >= 0.42) {
      const mime = dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
      dataUrl = canvas.toDataURL(mime, q);
      q -= 0.12;
    }

    const displayW = Math.min(340, outW);
    const displayH = Math.round((displayW / outW) * outH);
    return {
      dataUrl,
      width: displayW,
      height: Math.max(100, displayH),
      sizeKb: Math.max(1, Math.round(estimateBytes(dataUrl) / 1024)),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface DraggableEmbeddedImageProps {
  image: NoteEmbeddedImage;
  isSelected: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onUpdate: (patch: Partial<NoteEmbeddedImage>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const DraggableEmbeddedImage: React.FC<DraggableEmbeddedImageProps> = ({
  image,
  isSelected,
  canvasRef,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
}) => {
  const [liveGeo, setLiveGeo] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const dragRef = useRef<{
    mode: 'drag' | 'resize';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    aspect: number;
  } | null>(null);

  const curX = liveGeo ? liveGeo.x : image.x;
  const curY = liveGeo ? liveGeo.y : image.y;
  const curW = liveGeo ? liveGeo.width : image.width;
  const curH = liveGeo ? liveGeo.height : image.height;

  const beginInteraction = (mode: 'drag' | 'resize', e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    onSelect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: image.x,
      origY: image.y,
      origW: image.width,
      origH: image.height,
      aspect: image.width / Math.max(60, image.height),
    };
  };

  const handleMove = (e: React.PointerEvent<HTMLElement>) => {
    const st = dragRef.current;
    if (!st) return;
    e.stopPropagation();

    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    const boundsW = canvasRef.current?.clientWidth || 860;
    const boundsH = Math.max(canvasRef.current?.scrollHeight || 640, 560);

    if (st.mode === 'drag') {
      const nextX = Math.max(8, Math.min(st.origX + dx, Math.max(8, boundsW - st.origW - 8)));
      const nextY = Math.max(8, Math.min(st.origY + dy, Math.max(8, boundsH - 48)));
      setLiveGeo({ x: Math.round(nextX), y: Math.round(nextY), width: st.origW, height: st.origH });
    } else {
      const maxW = Math.max(140, boundsW - st.origX - 12);
      const nextW = Math.max(140, Math.min(st.origW + dx, maxW));
      const nextH = Math.max(90, Math.round(nextW / st.aspect));
      setLiveGeo({ x: st.origX, y: st.origY, width: Math.round(nextW), height: nextH });
    }
  };

  const handleEnd = (e: React.PointerEvent<HTMLElement>) => {
    const st = dragRef.current;
    if (!st) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore already released
    }
    dragRef.current = null;
    if (liveGeo) {
      onUpdate(liveGeo);
      setLiveGeo(null);
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        transform: `translate3d(${curX}px, ${curY}px, 0)`,
        width: `${curW}px`,
      }}
      className={`pointer-events-auto absolute top-0 left-0 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/15 shadow-xl select-none transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500 z-30' : 'z-20 hover:shadow-2xl'
      }`}
    >
      {/* Floating Actions Bar when Selected */}
      {isSelected && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute right-0 flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/95 text-white border border-white/15 shadow-xl z-40 ${
            curY < 48 ? '-bottom-10' : '-top-10'
          }`}
        >
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicar imagen"
            className="p-1 rounded hover:bg-white/15 text-slate-200 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar imagen"
            className="p-1 rounded hover:bg-rose-500/30 text-rose-300 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Drag Bar */}
      <div
        onPointerDown={(e) => beginInteraction('drag', e)}
        onPointerMove={handleMove}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
        title="Arrastra para mover imagen"
        className="h-6 px-2 rounded-t-2xl bg-slate-100/90 dark:bg-white/[0.06] flex items-center justify-between cursor-grab active:cursor-grabbing touch-none"
      >
        <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-slate-400 hover:text-rose-500 cursor-pointer"
          title="Quitar imagen"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Image Frame */}
      <div className="relative overflow-hidden bg-slate-100 dark:bg-black/40">
        <img
          src={image.dataUrl}
          alt={image.caption || 'Imagen incrustada en nota'}
          draggable={false}
          style={{ height: `${curH}px` }}
          className="w-full object-contain pointer-events-none block"
        />
      </div>

      {/* Optional Editable Caption */}
      <div className="px-2.5 py-1.5 flex items-center gap-1">
        <input
          type="text"
          value={image.caption || ''}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Pie de foto opcional..."
          className="w-full bg-transparent text-[11px] text-slate-600 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none select-text"
        />
      </div>

      {/* Aspect-Preserving Resize Handle */}
      <div
        onPointerDown={(e) => beginInteraction('resize', e)}
        onPointerMove={handleMove}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
        title="Arrastra para redimensionar"
        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize touch-none flex items-end justify-end p-1"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-slate-400" aria-hidden="true">
          <path d="M9 1L1 9M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
