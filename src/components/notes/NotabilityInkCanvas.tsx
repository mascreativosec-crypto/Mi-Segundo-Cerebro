import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { NoteInkPoint, NoteInkStroke, NoteShapeItem } from '../../types';

export type InkToolMode = 'none' | 'pen' | 'highlighter' | 'shape' | 'eraser';

export interface NotabilityInkCanvasHandle {
  exportInkPngBase64: () => string | null;
}

interface NotabilityInkCanvasProps {
  tool: InkToolMode;
  shapeKind: NoteShapeItem['kind'];
  color: string;
  strokeWidth: number;
  onlyApplePencil: boolean;
  strokes: NoteInkStroke[];
  shapes: NoteShapeItem[];
  onChangeStrokes: (next: NoteInkStroke[]) => void;
  onChangeShapes: (next: NoteShapeItem[]) => void;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const rx = Math.abs(x2 - x1) / 2;
  const ry = Math.abs(y2 - y1) / 2;
  const outerR = Math.max(8, Math.min(rx, ry));
  const innerR = outerR * 0.44;
  const spikes = 5;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawShape(ctx: CanvasRenderingContext2D, shape: NoteShapeItem) {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;
  ctx.lineWidth = shape.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const { x1, y1, x2, y2 } = shape;
  if (shape.kind === 'rect') {
    const rx = Math.min(x1, x2);
    const ry = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rx, ry, w, h, 8);
    } else {
      ctx.rect(rx, ry, w, h);
    }
    ctx.stroke();
  } else if (shape.kind === 'ellipse') {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = Math.max(2, Math.abs(x2 - x1) / 2);
    const ry = Math.max(2, Math.abs(y2 - y1) / 2);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape.kind === 'line') {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else if (shape.kind === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = Math.max(12, shape.width * 4);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  } else if (shape.kind === 'star') {
    drawStar(ctx, x1, y1, x2, y2);
  }
  ctx.restore();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: NoteInkStroke) {
  if (!stroke.points.length) return;
  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.34 : 1;

  if (stroke.points.length === 1) {
    const pt = stroke.points[0];
    const radius = Math.max(1, (stroke.width * (pt.p || 0.6)) / 2);
    ctx.fillStyle = stroke.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Smooth pressure-aware segments for Apple Pencil / stylus
  for (let i = 1; i < stroke.points.length; i++) {
    const prev = stroke.points[i - 1];
    const curr = stroke.points[i];
    const pressure = curr.p && curr.p > 0 ? Math.max(0.35, Math.min(1.6, curr.p * 1.4)) : 1;
    ctx.lineWidth = stroke.tool === 'highlighter' ? stroke.width * 3.8 : stroke.width * pressure;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();
  }
  ctx.restore();
}

function distancePointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export const NotabilityInkCanvas = forwardRef<
  NotabilityInkCanvasHandle,
  NotabilityInkCanvasProps
>(
  (
    {
      tool,
      shapeKind,
      color,
      strokeWidth,
      onlyApplePencil,
      strokes,
      shapes,
      onChangeStrokes,
      onChangeShapes,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const activeStrokeRef = useRef<NoteInkStroke | null>(null);
    const activeShapeRef = useRef<NoteShapeItem | null>(null);
    const isPointerDownRef = useRef(false);

    // ResizeObserver keeps canvas aligned with container on window/sidebar resize
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const updateSize = () => {
        const rect = parent.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        setCanvasSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      };

      updateSize();
      const observer = new ResizeObserver(updateSize);
      observer.observe(parent);
      return () => observer.disconnect();
    }, []);

    const redraw = () => {
      const canvas = canvasRef.current;
      if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== canvasSize.width * dpr || canvas.height !== canvasSize.height * dpr) {
        canvas.width = canvasSize.width * dpr;
        canvas.height = canvasSize.height * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      for (const s of strokes) drawStroke(ctx, s);
      for (const sh of shapes) drawShape(ctx, sh);
      if (activeStrokeRef.current) drawStroke(ctx, activeStrokeRef.current);
      if (activeShapeRef.current) drawShape(ctx, activeShapeRef.current);
    };

    useEffect(() => {
      redraw();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [strokes, shapes, canvasSize]);

    useImperativeHandle(ref, () => ({
      exportInkPngBase64: () => {
        if (strokes.length === 0 && shapes.length === 0) return null;
        const off = document.createElement('canvas');
        const w = Math.max(600, canvasSize.width || 800);
        const h = Math.max(400, canvasSize.height || 600);
        off.width = w;
        off.height = h;
        const ctx = off.getContext('2d');
        if (!ctx) return null;
        // High-contrast white background for maximum handwriting OCR accuracy
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        for (const s of strokes) {
          const ocrStroke: NoteInkStroke = {
            ...s,
            color:
              s.color.toLowerCase() === '#ffffff' || s.color.toLowerCase() === '#f8fafc'
                ? '#0f172a'
                : s.color,
          };
          drawStroke(ctx, ocrStroke);
        }
        for (const sh of shapes) {
          const ocrShape: NoteShapeItem = {
            ...sh,
            color:
              sh.color.toLowerCase() === '#ffffff' || sh.color.toLowerCase() === '#f8fafc'
                ? '#0f172a'
                : sh.color,
          };
          drawShape(ctx, ocrShape);
        }
        const dataUrl = off.toDataURL('image/png');
        return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      },
    }));

    const getCoords = (e: React.PointerEvent<HTMLCanvasElement>): NoteInkPoint => {
      const rect = e.currentTarget.getBoundingClientRect();
      return {
        x: Math.round((e.clientX - rect.left) * 10) / 10,
        y: Math.round((e.clientY - rect.top) * 10) / 10,
        p: e.pointerType === 'pen' ? e.pressure || 0.5 : 0.65,
      };
    };

    const eraseAt = (pt: NoteInkPoint) => {
      const hitRadius = 18;
      const filteredStrokes = strokes.filter((stroke) => {
        for (let i = 0; i < stroke.points.length; i++) {
          const sp = stroke.points[i];
          if (Math.hypot(sp.x - pt.x, sp.y - pt.y) <= hitRadius) return false;
        }
        return true;
      });
      if (filteredStrokes.length !== strokes.length) {
        onChangeStrokes(filteredStrokes);
      }

      const filteredShapes = shapes.filter((sh) => {
        const minX = Math.min(sh.x1, sh.x2) - hitRadius;
        const maxX = Math.max(sh.x1, sh.x2) + hitRadius;
        const minY = Math.min(sh.y1, sh.y2) - hitRadius;
        const maxY = Math.max(sh.y1, sh.y2) + hitRadius;
        if (sh.kind === 'line' || sh.kind === 'arrow') {
          return distancePointToSegment(pt.x, pt.y, sh.x1, sh.y1, sh.x2, sh.y2) > hitRadius;
        }
        const nearBox = pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY;
        return !nearBox;
      });
      if (filteredShapes.length !== shapes.length) {
        onChangeShapes(filteredShapes);
      }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (tool === 'none') return;
      // Palm rejection on iPad: if onlyApplePencil is active, ignore finger touch
      if (onlyApplePencil && e.pointerType === 'touch') return;

      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      isPointerDownRef.current = true;
      const pt = getCoords(e);

      if (tool === 'eraser') {
        eraseAt(pt);
        return;
      }

      if (tool === 'pen' || tool === 'highlighter') {
        activeStrokeRef.current = {
          id: `ink_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          tool,
          color,
          width: strokeWidth,
          points: [pt],
        };
        redraw();
      } else if (tool === 'shape') {
        activeShapeRef.current = {
          id: `shp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          kind: shapeKind,
          x1: pt.x,
          y1: pt.y,
          x2: pt.x,
          y2: pt.y,
          color,
          width: strokeWidth,
        };
        redraw();
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isPointerDownRef.current || tool === 'none') return;
      if (onlyApplePencil && e.pointerType === 'touch') return;
      e.preventDefault();
      const pt = getCoords(e);

      if (tool === 'eraser') {
        eraseAt(pt);
        return;
      }

      if ((tool === 'pen' || tool === 'highlighter') && activeStrokeRef.current) {
        const pts = activeStrokeRef.current.points;
        const last = pts[pts.length - 1];
        if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 1.5) {
          pts.push(pt);
          redraw();
        }
      } else if (tool === 'shape' && activeShapeRef.current) {
        activeShapeRef.current = {
          ...activeShapeRef.current,
          x2: pt.x,
          y2: pt.y,
        };
        redraw();
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore if already released
      }

      if (activeStrokeRef.current) {
        const finished = activeStrokeRef.current;
        activeStrokeRef.current = null;
        onChangeStrokes([...strokes, finished]);
      }
      if (activeShapeRef.current) {
        const finished = activeShapeRef.current;
        activeShapeRef.current = null;
        if (Math.hypot(finished.x2 - finished.x1, finished.y2 - finished.y1) > 4) {
          onChangeShapes([...shapes, finished]);
        } else {
          redraw();
        }
      }
    };

    const isInteractive = tool !== 'none';

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: '100%',
          height: '100%',
          touchAction: isInteractive ? 'none' : 'auto',
        }}
        className={`absolute inset-0 z-20 ${
          isInteractive
            ? tool === 'eraser'
              ? 'cursor-cell pointer-events-auto'
              : 'cursor-crosshair pointer-events-auto'
            : 'pointer-events-none'
        }`}
      />
    );
  }
);

NotabilityInkCanvas.displayName = 'NotabilityInkCanvas';
