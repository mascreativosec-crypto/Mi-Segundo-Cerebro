import React, { useRef, useState } from 'react';
import { NoteInkPoint, NoteInkStroke } from '../../types';

export type NoteInkTool = 'text' | 'pen' | 'highlighter' | 'eraser';

interface NoteInkCanvasProps {
  strokes: NoteInkStroke[];
  activeTool: NoteInkTool;
  inkColor: string;
  inkWidth: number;
  pencilOnly: boolean;
  onAddStroke: (stroke: NoteInkStroke) => void;
  onEraseStrokeIds: (ids: string[]) => void;
}

function buildSmoothSvgPath(points: NoteInkPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${(p.x + 0.2).toFixed(1)} ${(p.y + 0.2).toFixed(1)}`;
  }
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    d += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

function getEffectiveStrokeWidth(stroke: NoteInkStroke): number {
  if (stroke.tool === 'highlighter') return stroke.width * 3.8;
  const pressures = stroke.points
    .map((p) => p.p)
    .filter((v): v is number => typeof v === 'number' && v > 0);
  if (pressures.length === 0) return stroke.width;
  const avgP = pressures.reduce((a, b) => a + b, 0) / pressures.length;
  // Subtle Apple Pencil pressure modulation (0.65x to 1.45x)
  const factor = Math.max(0.65, Math.min(1.45, 0.55 + avgP * 0.95));
  return Number((stroke.width * factor).toFixed(2));
}

function distanceToStroke(px: number, py: number, stroke: NoteInkStroke): number {
  let minDist = Infinity;
  for (let i = 0; i < stroke.points.length; i++) {
    const pt = stroke.points[i];
    const dx = pt.x - px;
    const dy = pt.y - py;
    const d = Math.hypot(dx, dy);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

export function renderInkStrokesToPngBase64(
  strokes: NoteInkStroke[],
  width: number,
  height: number
): string | null {
  if (strokes.length === 0) return null;
  const safeW = Math.max(400, Math.min(1400, Math.round(width)));
  const safeH = Math.max(300, Math.min(1800, Math.round(height)));
  const canvas = document.createElement('canvas');
  canvas.width = safeW;
  canvas.height = safeH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, safeW, safeH);

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1;
    ctx.lineWidth = getEffectiveStrokeWidth(stroke);

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const curr = stroke.points[i];
      const next = stroke.points[i + 1];
      ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
}

export const NoteInkCanvas: React.FC<NoteInkCanvasProps> = ({
  strokes,
  activeTool,
  inkColor,
  inkWidth,
  pencilOnly,
  onAddStroke,
  onEraseStrokeIds,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [liveStroke, setLiveStroke] = useState<NoteInkStroke | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const livePointsRef = useRef<NoteInkPoint[]>([]);
  const erasedDuringDragRef = useRef<Set<string>>(new Set());

  const isDrawingMode = activeTool !== 'text';

  const getLocalPoint = (e: PointerEvent | React.PointerEvent): NoteInkPoint => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, p: 0.5 };
    return {
      x: Number((e.clientX - rect.left).toFixed(1)),
      y: Number((e.clientY - rect.top).toFixed(1)),
      p: typeof e.pressure === 'number' && e.pressure > 0 ? Number(e.pressure.toFixed(2)) : 0.5,
    };
  };

  const eraseAtPoint = (pt: NoteInkPoint) => {
    const hitIds: string[] = [];
    for (const s of strokes) {
      if (erasedDuringDragRef.current.has(s.id)) continue;
      const threshold = s.tool === 'highlighter' ? 22 : 16;
      if (distanceToStroke(pt.x, pt.y, s) <= threshold) {
        hitIds.push(s.id);
        erasedDuringDragRef.current.add(s.id);
      }
    }
    if (hitIds.length > 0) {
      onEraseStrokeIds(hitIds);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingMode) return;
    // Palm rejection: if "Solo Apple Pencil" is active, ignore touch/fingers completely
    if (pencilOnly && e.pointerType === 'touch') return;
    // Ignore secondary mouse buttons
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    erasedDuringDragRef.current.clear();

    const pt = getLocalPoint(e);

    if (activeTool === 'eraser') {
      eraseAtPoint(pt);
      return;
    }

    livePointsRef.current = [pt];
    setLiveStroke({
      id: `ink_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tool: activeTool === 'highlighter' ? 'highlighter' : 'pen',
      color: inkColor,
      width: inkWidth,
      points: [pt],
    });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();

    const nativeEvent = e.nativeEvent as PointerEvent;
    const coalesced =
      typeof nativeEvent.getCoalescedEvents === 'function'
        ? nativeEvent.getCoalescedEvents()
        : [nativeEvent];
    const eventsToSample = coalesced.length > 0 ? coalesced : [nativeEvent];

    if (activeTool === 'eraser') {
      for (const ev of eventsToSample) {
        eraseAtPoint(getLocalPoint(ev));
      }
      return;
    }

    let appended = false;
    for (const ev of eventsToSample) {
      const pt = getLocalPoint(ev);
      const prev = livePointsRef.current[livePointsRef.current.length - 1];
      if (!prev || Math.hypot(pt.x - prev.x, pt.y - prev.y) >= 1.8) {
        livePointsRef.current.push(pt);
        appended = true;
      }
    }

    if (appended) {
      setLiveStroke((curr) =>
        curr ? { ...curr, points: [...livePointsRef.current] } : null
      );
    }
  };

  const finishPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore already-released capture
    }
    activePointerIdRef.current = null;
    erasedDuringDragRef.current.clear();

    if (liveStroke && livePointsRef.current.length > 0) {
      onAddStroke({
        ...liveStroke,
        points: [...livePointsRef.current],
      });
    }
    livePointsRef.current = [];
    setLiveStroke(null);
  };

  const allRendered = liveStroke ? [...strokes, liveStroke] : strokes;

  return (
    <svg
      ref={svgRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      className={`absolute inset-0 w-full h-full rounded-3xl ${
        isDrawingMode
          ? `pointer-events-auto z-25 ${
              pencilOnly ? 'touch-pan-y' : 'touch-none'
            } ${
              activeTool === 'eraser'
                ? 'cursor-cell'
                : 'cursor-crosshair'
            }`
          : 'pointer-events-none z-15'
      }`}
    >
      {allRendered.map((stroke) => {
        const pathData = buildSmoothSvgPath(stroke.points);
        const effWidth = getEffectiveStrokeWidth(stroke);
        return (
          <path
            key={stroke.id}
            d={pathData}
            fill="none"
            stroke={stroke.color}
            strokeWidth={effWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={stroke.tool === 'highlighter' ? 0.34 : 0.96}
            style={stroke.tool === 'highlighter' ? { mixBlendMode: 'multiply' } : undefined}
          />
        );
      })}
    </svg>
  );
};
