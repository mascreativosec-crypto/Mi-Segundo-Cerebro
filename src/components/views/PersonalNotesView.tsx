import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  NotebookPen,
  Plus,
  Search,
  Pin,
  Trash2,
  CalendarPlus,
  Wallet,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  X,
  ArrowUpRight,
  Clock,
  Tag,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  ListChecks,
  List,
  Pilcrow,
  Check,
  LayoutGrid,
  FileText,
  Square,
  StickyNote,
  GripHorizontal,
  Copy,
  SlidersHorizontal,
  Palette,
  Highlighter,
  Type,
  Mic,
  MicOff,
  ImagePlus,
  PenTool,
  Eraser,
  Undo2,
  Link2,
  Building2,
  FolderKanban,
  FlaskConical,
  CheckSquare,
  Wand2,
  Loader2,
  Download,
  FileAudio,
  BookOpen,
  User,
} from 'lucide-react';
import { AppStoreData, DEFAULT_EXPENSE_CATEGORIES } from '../../services/storage';
import {
  BusinessTask,
  FinancialTransaction,
  NoteEmbeddedImage,
  NoteFloatingBox,
  NoteFloatingBoxColor,
  NoteFloatingBoxKind,
  NoteFontFamily,
  NoteFontSize,
  NoteInkStroke,
  NotePaperStyle,
  NotePaperTone,
  NoteReminderItem,
  NotesStudioAction,
  PersonalNote,
  StrategicDecision,
} from '../../types';
import {
  extractSmartItemsFromNote,
  parseNoteLineSegments,
  SmartSegment,
} from '../../utils/noteSmartParser';
import { fetchJsonWithTimeout } from '../../utils/fetchWithTimeout';
import {
  NoteInkCanvas,
  NoteInkTool,
  renderInkStrokesToPngBase64,
} from '../notes/NoteInkCanvas';
import {
  compressEmbeddedNoteImage,
  DraggableEmbeddedImage,
} from '../notes/DraggableEmbeddedImage';
import {
  DecisionDraftPayload,
  ManualDecisionModal,
  MeetingAudioStudioModal,
  TopicAssistantModal,
} from '../notes/NotesCommandModals';

interface PersonalNotesViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onNavigate?: (view: string) => void;
  initialNoteId?: string | null;
  onClearInitialNoteId?: () => void;
  initialStudioAction?: NotesStudioAction | null;
  onClearInitialStudioAction?: () => void;
  onEditorFullscreenChange?: (isFullscreen: boolean) => void;
}

type BlockKind = 'h1' | 'h2' | 'checklist' | 'bullet' | 'paragraph';

interface ParsedBlock {
  kind: BlockKind;
  checked: boolean;
  body: string;
}

const CATEGORY_META: Record<
  PersonalNote['category'],
  { label: string; accent: string }
> = {
  bitacora: {
    label: 'Bitácora / Acta',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  planificacion_anual: {
    label: 'Planificación Anual',
    accent: 'text-purple-600 dark:text-purple-400',
  },
  general: {
    label: 'General',
    accent: 'text-slate-600 dark:text-slate-300',
  },
  ideas: {
    label: 'Ideas',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  finanzas: {
    label: 'Finanzas',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  personal: {
    label: 'Personal',
    accent: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
};

const PAPER_STYLES: Array<{ id: NotePaperStyle; label: string }> = [
  { id: 'dotted', label: 'Puntos' },
  { id: 'lined', label: 'Rayada' },
  { id: 'grid', label: 'Cuadrícula' },
  { id: 'cornell', label: 'Cornell' },
  { id: 'blank', label: 'Blanca' },
];

const PAPER_TONES: Array<{
  id: NotePaperTone;
  label: string;
  swatchClass: string;
}> = [
  {
    id: 'system',
    label: 'Sistema',
    swatchClass: 'bg-gradient-to-br from-white to-slate-800 border-slate-400',
  },
  {
    id: 'paper_cream',
    label: 'Papel Crema',
    swatchClass: 'bg-[#fbf7ee] border-amber-300',
  },
  {
    id: 'paper_night',
    label: 'Pizarra',
    swatchClass: 'bg-[#0f172a] border-slate-600',
  },
];

const FONT_FAMILIES: Array<{
  id: NoteFontFamily;
  label: string;
  cssFamily: string;
  sample: string;
}> = [
  { id: 'sans', label: 'Moderna', cssFamily: "'Plus Jakarta Sans', system-ui, sans-serif", sample: 'Aa' },
  { id: 'serif', label: 'Editorial', cssFamily: "'Lora', Georgia, serif", sample: 'Aa' },
  { id: 'handwriting', label: 'Manuscrita', cssFamily: "'Caveat', cursive", sample: 'Aa' },
  { id: 'geometric', label: 'Geométrica', cssFamily: "'Outfit', sans-serif", sample: 'Aa' },
  { id: 'mono', label: 'Técnica', cssFamily: "'JetBrains Mono', monospace", sample: 'Aa' },
];

const FONT_SIZES: Array<{
  id: NoteFontSize;
  label: string;
  bodyClass: string;
  h1Class: string;
  h2Class: string;
}> = [
  {
    id: 'sm',
    label: 'S',
    bodyClass: 'text-[13px] leading-[26px]',
    h1Class: 'text-lg sm:text-xl',
    h2Class: 'text-sm sm:text-base',
  },
  {
    id: 'md',
    label: 'M',
    bodyClass: 'text-sm sm:text-[15px] leading-[28px]',
    h1Class: 'text-xl sm:text-2xl',
    h2Class: 'text-base sm:text-lg',
  },
  {
    id: 'lg',
    label: 'L',
    bodyClass: 'text-base sm:text-[17px] leading-[30px]',
    h1Class: 'text-2xl sm:text-[1.75rem]',
    h2Class: 'text-lg sm:text-xl',
  },
  {
    id: 'xl',
    label: 'XL',
    bodyClass: 'text-lg sm:text-[19px] leading-[33px]',
    h1Class: 'text-2xl sm:text-3xl',
    h2Class: 'text-xl sm:text-2xl',
  },
];

const TEXT_COLOR_SWATCHES: Array<{
  id: string;
  label: string;
  dot: string;
  lightCls: string;
  defaultCls: string;
}> = [
  { id: 'blue', label: 'Azul', dot: 'bg-blue-500', lightCls: 'text-blue-700', defaultCls: 'text-blue-600 dark:text-blue-400' },
  { id: 'purple', label: 'Morado', dot: 'bg-purple-500', lightCls: 'text-purple-700', defaultCls: 'text-purple-600 dark:text-purple-400' },
  { id: 'rose', label: 'Rojo / Coral', dot: 'bg-rose-500', lightCls: 'text-rose-700', defaultCls: 'text-rose-600 dark:text-rose-400' },
  { id: 'emerald', label: 'Verde', dot: 'bg-emerald-500', lightCls: 'text-emerald-700', defaultCls: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'amber', label: 'Ámbar', dot: 'bg-amber-500', lightCls: 'text-amber-700', defaultCls: 'text-amber-600 dark:text-amber-400' },
  { id: 'slate', label: 'Grafito', dot: 'bg-slate-500', lightCls: 'text-slate-600', defaultCls: 'text-slate-500 dark:text-slate-400' },
];

const HIGHLIGHT_SWATCHES: Array<{
  id: string;
  label: string;
  dot: string;
  cls: string;
}> = [
  { id: 'yellow', label: 'Amarillo', dot: 'bg-yellow-300', cls: 'bg-yellow-300/65 dark:bg-yellow-400/30 text-inherit rounded px-0.5' },
  { id: 'mint', label: 'Menta', dot: 'bg-emerald-300', cls: 'bg-emerald-300/55 dark:bg-emerald-400/28 text-inherit rounded px-0.5' },
  { id: 'sky', label: 'Celeste', dot: 'bg-sky-300', cls: 'bg-sky-300/55 dark:bg-sky-400/28 text-inherit rounded px-0.5' },
  { id: 'pink', label: 'Rosa', dot: 'bg-pink-300', cls: 'bg-pink-300/55 dark:bg-pink-400/28 text-inherit rounded px-0.5' },
  { id: 'lavender', label: 'Lavanda', dot: 'bg-purple-300', cls: 'bg-purple-300/55 dark:bg-purple-400/30 text-inherit rounded px-0.5' },
];

const INK_COLORS = [
  { id: '#1e293b', label: 'Tinta oscura' },
  { id: '#38bdf8', label: 'Azul cielo' },
  { id: '#6366f1', label: 'Índigo' },
  { id: '#a855f7', label: 'Morado' },
  { id: '#f43f5e', label: 'Coral' },
  { id: '#eab308', label: 'Amarillo' },
  { id: '#10b981', label: 'Esmeralda' },
];

const FLOATING_COLORS: Record<
  NoteFloatingBoxColor,
  {
    label: string;
    dot: string;
    stickyBg: string;
    stickyHeader: string;
    stickyBorder: string;
    stickyText: string;
    rectBg: string;
    rectBorder: string;
    rectText: string;
  }
> = {
  amber: {
    label: 'Amarillo',
    dot: 'bg-amber-400',
    stickyBg: 'bg-amber-100/95 dark:bg-amber-200/95',
    stickyHeader: 'bg-amber-300/65',
    stickyBorder: 'border-amber-300/90',
    stickyText: 'text-amber-950 placeholder:text-amber-800/50',
    rectBg: 'bg-amber-500/12',
    rectBorder: 'border-amber-500/75',
    rectText: 'text-amber-900 dark:text-amber-200 placeholder:text-amber-500/60',
  },
  blue: {
    label: 'Azul',
    dot: 'bg-sky-400',
    stickyBg: 'bg-sky-100/95 dark:bg-sky-200/95',
    stickyHeader: 'bg-sky-300/65',
    stickyBorder: 'border-sky-300/90',
    stickyText: 'text-sky-950 placeholder:text-sky-800/50',
    rectBg: 'bg-sky-500/12',
    rectBorder: 'border-sky-500/75',
    rectText: 'text-sky-900 dark:text-sky-200 placeholder:text-sky-500/60',
  },
  purple: {
    label: 'Morado',
    dot: 'bg-purple-400',
    stickyBg: 'bg-purple-100/95 dark:bg-purple-200/95',
    stickyHeader: 'bg-purple-300/65',
    stickyBorder: 'border-purple-300/90',
    stickyText: 'text-purple-950 placeholder:text-purple-800/50',
    rectBg: 'bg-purple-500/12',
    rectBorder: 'border-purple-500/75',
    rectText: 'text-purple-900 dark:text-purple-200 placeholder:text-purple-500/60',
  },
  rose: {
    label: 'Rosa',
    dot: 'bg-rose-400',
    stickyBg: 'bg-rose-100/95 dark:bg-rose-200/95',
    stickyHeader: 'bg-rose-300/65',
    stickyBorder: 'border-rose-300/90',
    stickyText: 'text-rose-950 placeholder:text-rose-800/50',
    rectBg: 'bg-rose-500/12',
    rectBorder: 'border-rose-500/75',
    rectText: 'text-rose-900 dark:text-rose-200 placeholder:text-rose-500/60',
  },
  emerald: {
    label: 'Menta',
    dot: 'bg-emerald-400',
    stickyBg: 'bg-emerald-100/95 dark:bg-emerald-200/95',
    stickyHeader: 'bg-emerald-300/65',
    stickyBorder: 'border-emerald-300/90',
    stickyText: 'text-emerald-950 placeholder:text-emerald-800/50',
    rectBg: 'bg-emerald-500/12',
    rectBorder: 'border-emerald-500/75',
    rectText: 'text-emerald-900 dark:text-emerald-200 placeholder:text-emerald-500/60',
  },
  slate: {
    label: 'Grafito',
    dot: 'bg-slate-400',
    stickyBg: 'bg-slate-100/95 dark:bg-slate-200/95',
    stickyHeader: 'bg-slate-300/70',
    stickyBorder: 'border-slate-300/90',
    stickyText: 'text-slate-900 placeholder:text-slate-600/50',
    rectBg: 'bg-slate-500/10',
    rectBorder: 'border-slate-500/70',
    rectText: 'text-slate-800 dark:text-slate-200 placeholder:text-slate-400',
  },
};

const NEW_YEAR_TEMPLATE = (year: number) => `# Planificación de mi Nuevo Año ${year}

Palabra guía del año: **PROPÓSITO, ENFOQUE Y PROSPERIDAD**.
*Haz clic en cualquier línea para escribir en tiempo real.*

## 1. Checklist de Fechas Clave
- [ ] 01/01/${year}: Definir mis __3 objetivos centrales__ y ritual de arranque del año.
- [ ] 15 de enero de ${year}: Revisar hábitos de salud, presupuesto y agenda semanal.
- [ ] 31 de marzo de ${year}: Auditoría trimestral Q1 y ajustes de prioridades.
- [ ] 30 de junio de ${year}: Evaluación de medio año en mis 5 Pilares.
- [ ] 15 de diciembre de ${year}: Cierre del año, gratitud y diseño del próximo ciclo.

## 2. Metas Financieras del Año
- [ ] **Meta mensual:** generar un ingreso de $4,500 adicionales con disciplina.
- [ ] **Fondo de libertad:** ahorrar $1,000 cada mes sin excusas.
- [ ] **Crecimiento y formación:** gasto de $150 en libros, mentoría o salud.
- [ ] **Portafolio a largo plazo:** invertir $400 mensuales de forma automática.

## 3. Hábitos Innegociables
- **Salud:** proteger mi energía física, sueño y entrenamiento 4x por semana.
- **Relaciones:** tiempo de calidad en familia y conversaciones con intención.`;

function parseLineToBlock(rawLine: string): ParsedBlock {
  const checkMatch = rawLine.match(/^\s*-\s*\[([ xX])\]\s?(.*)$/);
  if (checkMatch) {
    return {
      kind: 'checklist',
      checked: checkMatch[1].toLowerCase() === 'x',
      body: checkMatch[2],
    };
  }
  if (rawLine.startsWith('# ')) {
    return { kind: 'h1', checked: false, body: rawLine.slice(2) };
  }
  if (rawLine.startsWith('## ')) {
    return { kind: 'h2', checked: false, body: rawLine.slice(3) };
  }
  const bulletMatch = rawLine.match(/^\s*[-•*]\s+(.*)$/);
  if (bulletMatch) {
    return { kind: 'bullet', checked: false, body: bulletMatch[1] };
  }
  return { kind: 'paragraph', checked: false, body: rawLine };
}

function serializeBlock(block: ParsedBlock): string {
  switch (block.kind) {
    case 'h1':
      return `# ${block.body}`;
    case 'h2':
      return `## ${block.body}`;
    case 'checklist':
      return `- [${block.checked ? 'x' : ' '}] ${block.body}`;
    case 'bullet':
      return `- ${block.body}`;
    default:
      return block.body;
  }
}

function formatReadableDate(iso: string): string {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return dt.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortUpdated(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

function cleanLineForTitle(line: string): string {
  return line
    .replace(/^#+\s*/, '')
    .replace(/^\s*-\s*\[[ xX]\]\s*/, '')
    .replace(/^[-•*]\s*/, '')
    .replace(/\{[ch]:[a-z]+\}|\{\/[ch]\}/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim()
    .slice(0, 90);
}

// Pure React inline tokenizer supporting **bold**, __underline__, *italic*, {c:color}...{/c}, {h:bg}...{/h}
interface FormattedRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  highlight?: string;
}

function tokenizeRichRuns(input: string): FormattedRun[] {
  const runs: FormattedRun[] = [];
  const regex =
    /(\{c:([a-z]+)\}([\s\S]*?)\{\/c\}|\{h:([a-z]+)\}([\s\S]*?)\{\/h\}|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIdx) {
      runs.push({ text: input.slice(lastIdx, match.index) });
    }
    const token = match[0];
    if (match[2] && match[3] !== undefined) {
      runs.push({ text: match[3], color: match[2] });
    } else if (match[4] && match[5] !== undefined) {
      runs.push({ text: match[5], highlight: match[4] });
    } else if (token.startsWith('**') && token.endsWith('**')) {
      runs.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('__') && token.endsWith('__')) {
      runs.push({ text: token.slice(2, -2), underline: true });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      runs.push({ text: token.slice(1, -1), italic: true });
    } else {
      runs.push({ text: token });
    }
    lastIdx = match.index + token.length;
  }
  if (lastIdx < input.length) {
    runs.push({ text: input.slice(lastIdx) });
  }
  return runs.length > 0 ? runs : [{ text: input }];
}

function getPaperPatternStyle(
  style: NotePaperStyle,
  tone: NotePaperTone,
  scale: 'full' | 'mini' = 'full'
): React.CSSProperties {
  const isNight = tone === 'paper_night';
  const isCream = tone === 'paper_cream';
  const dotColor = isNight
    ? 'rgba(148, 163, 184, 0.28)'
    : isCream
    ? 'rgba(120, 100, 72, 0.28)'
    : 'rgba(100, 116, 139, 0.28)';
  const lineColor = isNight
    ? 'rgba(148, 163, 184, 0.16)'
    : isCream
    ? 'rgba(146, 120, 84, 0.22)'
    : 'rgba(100, 116, 139, 0.18)';
  const marginColor = isNight
    ? 'rgba(244, 63, 94, 0.38)'
    : 'rgba(225, 29, 72, 0.32)';

  const step = scale === 'mini' ? 10 : 24;
  const lineStep = scale === 'mini' ? 11 : 28;
  const cornellOffset = scale === 'mini' ? 18 : 68;

  switch (style) {
    case 'dotted':
      return {
        backgroundImage: `radial-gradient(circle, ${dotColor} ${scale === 'mini' ? '0.9px' : '1.35px'}, transparent ${scale === 'mini' ? '0.9px' : '1.35px'})`,
        backgroundSize: `${step}px ${step}px`,
      };
    case 'lined':
      return {
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${lineStep - 1}px, ${lineColor} ${lineStep - 1}px, ${lineColor} ${lineStep}px)`,
      };
    case 'grid':
      return {
        backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${step}px ${step}px`,
      };
    case 'cornell':
      return {
        backgroundImage: `linear-gradient(to right, transparent ${cornellOffset}px, ${marginColor} ${cornellOffset}px, ${marginColor} ${cornellOffset + 1.5}px, transparent ${cornellOffset + 1.5}px), repeating-linear-gradient(to bottom, transparent 0px, transparent ${lineStep - 1}px, ${lineColor} ${lineStep - 1}px, ${lineColor} ${lineStep}px)`,
      };
    case 'blank':
    default:
      return {};
  }
}

function getPaperSurfaceClasses(tone: NotePaperTone) {
  if (tone === 'paper_cream') {
    return {
      sheet: 'bg-[#fbf7ee] border-amber-200/90 shadow-xl shadow-black/15',
      heading: 'text-stone-900',
      subheading: 'text-stone-800',
      body: 'text-stone-700',
      muted: 'text-stone-400',
      titleInput: 'text-stone-900 placeholder:text-stone-400',
      divider: 'border-amber-900/12',
      checkedText: 'line-through text-stone-400',
      checkboxIdle: 'border-stone-400/80 bg-white/80 hover:border-blue-600',
      rowHover: 'hover:bg-amber-900/[0.04]',
      rowFocused: 'bg-blue-500/[0.08]',
    };
  }
  if (tone === 'paper_night') {
    return {
      sheet: 'bg-[#0d1422] border-slate-700/80 shadow-2xl shadow-black/45',
      heading: 'text-white',
      subheading: 'text-slate-100',
      body: 'text-slate-200',
      muted: 'text-slate-500',
      titleInput: 'text-white placeholder:text-slate-500',
      divider: 'border-white/10',
      checkedText: 'line-through text-slate-500',
      checkboxIdle: 'border-slate-600 bg-black/30 hover:border-sky-400',
      rowHover: 'hover:bg-white/[0.035]',
      rowFocused: 'bg-blue-500/[0.11]',
    };
  }
  return {
    sheet:
      'bg-white/95 dark:bg-[#0f1624]/92 border-slate-200/90 dark:border-white/[0.09] shadow-xl dark:shadow-2xl',
    heading: 'text-slate-900 dark:text-white',
    subheading: 'text-slate-900 dark:text-slate-100',
    body: 'text-slate-700 dark:text-slate-200',
    muted: 'text-slate-400 dark:text-slate-500',
    titleInput: 'text-slate-900 dark:text-white placeholder:text-slate-400',
    divider: 'border-slate-200/80 dark:border-white/[0.08]',
    checkedText: 'line-through text-slate-400 dark:text-slate-500',
    checkboxIdle:
      'border-slate-300 dark:border-slate-600 bg-white dark:bg-black/30 hover:border-blue-500',
    rowHover: 'hover:bg-slate-200/40 dark:hover:bg-white/[0.025]',
    rowFocused: 'bg-blue-500/[0.06] dark:bg-white/[0.045]',
  };
}

// ============================================================================
// Live Editable Block (Real-time Colors, Highlights, Typography, Smart Links)
// ============================================================================
interface LiveEditableBlockProps {
  block: ParsedBlock;
  paperTone: NotePaperTone;
  fontSize: NoteFontSize;
  isHandwritingFont: boolean;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChangeBody: (newBody: string) => void;
  onToggleCheck: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onClickDate: (segment: Extract<SmartSegment, { type: 'date' }>, lineContext: string) => void;
  onClickFinance: (segment: Extract<SmartSegment, { type: 'finance' }>, lineContext: string) => void;
  registerTextarea: (el: HTMLTextAreaElement | null) => void;
}

const LiveEditableBlock: React.FC<LiveEditableBlockProps> = ({
  block,
  paperTone,
  fontSize,
  isHandwritingFont,
  isFocused,
  onFocus,
  onBlur,
  onChangeBody,
  onToggleCheck,
  onKeyDown,
  onClickDate,
  onClickFinance,
  registerTextarea,
}) => {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const surface = getPaperSurfaceClasses(paperTone);
  const sizeSpec = FONT_SIZES.find((s) => s.id === fontSize) || FONT_SIZES[1];

  const setRef = (el: HTMLTextAreaElement | null) => {
    localRef.current = el;
    registerTextarea(el);
  };

  useLayoutEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 26)}px`;
  }, [block.body, block.kind, fontSize, isHandwritingFont, isFocused]);

  const handBoost = isHandwritingFont ? 'text-[1.22em]' : '';

  const typographyClass =
    block.kind === 'h1'
      ? `${sizeSpec.h1Class} ${handBoost} font-extrabold tracking-tight leading-snug ${surface.heading}`
      : block.kind === 'h2'
      ? `${sizeSpec.h2Class} ${handBoost} font-bold tracking-tight leading-snug ${surface.subheading}`
      : `${sizeSpec.bodyClass} ${handBoost} font-normal ${surface.body}`;

  const checkedTextClass =
    block.kind === 'checklist' && block.checked ? surface.checkedText : '';

  const liveSegments = useMemo(() => parseNoteLineSegments(block.body), [block.body]);
  const firstDateSeg = useMemo(
    () =>
      liveSegments.find(
        (s): s is Extract<SmartSegment, { type: 'date' }> => s.type === 'date'
      ),
    [liveSegments]
  );
  const firstFinanceSeg = useMemo(
    () =>
      liveSegments.find(
        (s): s is Extract<SmartSegment, { type: 'finance' }> => s.type === 'finance'
      ),
    [liveSegments]
  );

  const isLightPaper = paperTone === 'paper_cream';
  const dateColorClass = isLightPaper
    ? 'text-sky-700 decoration-sky-600/90 hover:text-sky-800 hover:bg-sky-500/12'
    : 'text-sky-600 dark:text-sky-400 decoration-sky-500/90 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-500/12';
  const financeColorClass = isLightPaper
    ? 'text-purple-700 decoration-purple-600/90 hover:text-purple-800 hover:bg-purple-500/12'
    : 'text-purple-600 dark:text-purple-400 decoration-purple-500/90 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-500/12';

  const renderRichUnfocused = () => {
    if (!block.body) {
      return (
        <span className={`${surface.muted} opacity-75 select-none`}>
          {block.kind === 'h1'
            ? 'Título grande...'
            : block.kind === 'h2'
            ? 'Subtítulo...'
            : block.kind === 'checklist'
            ? 'Elemento de checklist...'
            : block.kind === 'bullet'
            ? 'Elemento de lista...'
            : '\u00A0'}
        </span>
      );
    }

    const runs = tokenizeRichRuns(block.body);
    return runs.map((run, rIdx) => {
      const smartParts = parseNoteLineSegments(run.text);
      const colorSpec = run.color
        ? TEXT_COLOR_SWATCHES.find((c) => c.id === run.color)
        : undefined;
      const highlightSpec = run.highlight
        ? HIGHLIGHT_SWATCHES.find((h) => h.id === run.highlight)
        : undefined;

      const runClasses = [
        run.bold ? `font-bold ${run.color ? '' : surface.heading}` : '',
        run.italic ? 'italic' : '',
        run.underline ? 'underline decoration-current/65 underline-offset-[3px]' : '',
        colorSpec ? (isLightPaper ? colorSpec.lightCls : colorSpec.defaultCls) : '',
        highlightSpec ? highlightSpec.cls : '',
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <span key={rIdx} className={runClasses}>
          {smartParts.map((seg, sIdx) => {
            if (seg.type === 'date') {
              return (
                <button
                  key={sIdx}
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickDate(seg, block.body);
                  }}
                  title={`Agregar "${seg.text}" al Calendario`}
                  className={`inline font-semibold underline decoration-2 underline-offset-[3px] rounded px-0.5 transition-colors cursor-pointer ${dateColorClass}`}
                >
                  {seg.text}
                </button>
              );
            }
            if (seg.type === 'finance') {
              return (
                <button
                  key={sIdx}
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickFinance(seg, block.body);
                  }}
                  title={`Registrar ${
                    seg.financeType === 'income'
                      ? 'ingreso'
                      : seg.financeType === 'investment'
                      ? 'ahorro / inversión'
                      : 'gasto'
                  } en Finanzas`}
                  className={`inline font-semibold underline decoration-2 underline-offset-[3px] rounded px-0.5 transition-colors cursor-pointer tabular-nums ${financeColorClass}`}
                >
                  {seg.text}
                </button>
              );
            }
            return <React.Fragment key={sIdx}>{seg.text}</React.Fragment>;
          })}
        </span>
      );
    });
  };

  const renderLiveBackdrop = () => {
    if (!block.body) {
      return (
        <span className={`${surface.muted} opacity-70`}>
          {block.kind === 'h1'
            ? 'Título grande...'
            : block.kind === 'h2'
            ? 'Subtítulo...'
            : block.kind === 'checklist'
            ? 'Escribe una tarea del checklist...'
            : block.kind === 'bullet'
            ? 'Escribe un punto...'
            : 'Escribe aquí... (fechas en azul, gastos/ingresos en morado)'}
        </span>
      );
    }

    return liveSegments.map((seg, idx) => {
      if (seg.type === 'date') {
        return (
          <span
            key={idx}
            className={`underline decoration-2 underline-offset-[3px] bg-sky-500/12 rounded-[3px] ${dateColorClass}`}
          >
            {seg.text}
          </span>
        );
      }
      if (seg.type === 'finance') {
        return (
          <span
            key={idx}
            className={`underline decoration-2 underline-offset-[3px] bg-purple-500/14 rounded-[3px] ${financeColorClass}`}
          >
            {seg.text}
          </span>
        );
      }
      return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
    });
  };

  return (
    <div
      className={`group flex items-start gap-2.5 rounded-xl px-2 py-0.5 -mx-2 transition-colors ${
        block.kind === 'h1'
          ? 'pt-2 pb-1'
          : block.kind === 'h2'
          ? `pt-3 pb-1 border-b ${surface.divider}`
          : ''
      } ${isFocused ? surface.rowFocused : surface.rowHover}`}
    >
      {block.kind === 'checklist' && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck();
          }}
          aria-label={block.checked ? 'Desmarcar elemento' : 'Marcar completado'}
          className={`mt-[4px] w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            block.checked
              ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 border-blue-500 text-white shadow-xs'
              : surface.checkboxIdle
          }`}
        >
          {block.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>
      )}

      {block.kind === 'bullet' && (
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-blue-400 mt-[12px] ml-1.5 mr-1 shrink-0" />
      )}

      <div className="relative flex-1 min-w-0">
        {isFocused ? (
          <div className="relative w-full">
            <div
              aria-hidden="true"
              className={`w-full whitespace-pre-wrap break-words pointer-events-none ${typographyClass} ${checkedTextClass}`}
            >
              {renderLiveBackdrop()}
              {'\u200B'}
            </div>
            <textarea
              ref={setRef}
              rows={1}
              value={block.body}
              onChange={(e) => onChangeBody(e.target.value)}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              spellCheck
              className={`absolute inset-0 w-full h-full resize-none overflow-hidden bg-transparent text-transparent caret-blue-600 dark:caret-sky-400 selection:bg-blue-500/25 focus:outline-none whitespace-pre-wrap break-words ${typographyClass}`}
            />
          </div>
        ) : (
          <div
            role="textbox"
            tabIndex={0}
            onClick={onFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFocus();
              }
            }}
            className={`w-full whitespace-pre-wrap break-words cursor-text min-h-[26px] ${typographyClass} ${checkedTextClass}`}
          >
            {renderRichUnfocused()}
          </div>
        )}
      </div>

      {isFocused && (firstDateSeg || firstFinanceSeg) && (
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          {firstDateSeg && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onClickDate(firstDateSeg, block.body)}
              className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1 cursor-pointer"
              title="Agregar fecha al calendario"
            >
              <CalendarPlus className="w-3 h-3" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
          )}
          {firstFinanceSeg && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onClickFinance(firstFinanceSeg, block.body)}
              className="px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 cursor-pointer"
              title="Registrar en Finanzas Personales"
            >
              <Wallet className="w-3 h-3" />
              <span className="hidden sm:inline">Finanzas</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Draggable & Resizable Floating Sticky Note / Rectangle
// ============================================================================
interface DraggableNoteBoxProps {
  box: NoteFloatingBox;
  isSelected: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onUpdate: (patch: Partial<NoteFloatingBox>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const DraggableNoteBox: React.FC<DraggableNoteBoxProps> = ({
  box,
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

  const interactionRef = useRef<{
    mode: 'drag' | 'resize';
    startPointerX: number;
    startPointerY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const currentX = liveGeo ? liveGeo.x : box.x;
  const currentY = liveGeo ? liveGeo.y : box.y;
  const currentW = liveGeo ? liveGeo.width : box.width;
  const currentH = liveGeo ? liveGeo.height : box.height;
  const palette = FLOATING_COLORS[box.color] || FLOATING_COLORS.amber;

  const beginInteraction = (mode: 'drag' | 'resize', e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    onSelect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    interactionRef.current = {
      mode,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      origX: box.x,
      origY: box.y,
      origW: box.width,
      origH: box.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const state = interactionRef.current;
    if (!state) return;
    e.stopPropagation();

    const dx = e.clientX - state.startPointerX;
    const dy = e.clientY - state.startPointerY;
    const boundsW = canvasRef.current?.clientWidth || 860;
    const boundsH = Math.max(canvasRef.current?.scrollHeight || 640, 560);

    if (state.mode === 'drag') {
      const nextX = Math.max(8, Math.min(state.origX + dx, Math.max(8, boundsW - state.origW - 8)));
      const nextY = Math.max(8, Math.min(state.origY + dy, Math.max(8, boundsH - 48)));
      setLiveGeo({ x: Math.round(nextX), y: Math.round(nextY), width: state.origW, height: state.origH });
    } else {
      const maxW = Math.max(160, boundsW - state.origX - 8);
      const nextW = Math.max(160, Math.min(state.origW + dx, maxW));
      const nextH = Math.max(84, Math.min(state.origH + dy, 540));
      setLiveGeo({ x: state.origX, y: state.origY, width: Math.round(nextW), height: Math.round(nextH) });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const state = interactionRef.current;
    if (!state) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore already released
    }
    interactionRef.current = null;
    if (liveGeo) {
      onUpdate(liveGeo);
      setLiveGeo(null);
    }
  };

  const isSticky = box.kind === 'sticky';

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        transform: `translate3d(${currentX}px, ${currentY}px, 0)`,
        width: `${currentW}px`,
        height: `${currentH}px`,
      }}
      className={`pointer-events-auto absolute top-0 left-0 flex flex-col rounded-2xl transition-shadow select-none ${
        isSticky
          ? `${palette.stickyBg} border ${palette.stickyBorder} shadow-lg shadow-black/20`
          : `${palette.rectBg} backdrop-blur-md border-2 ${
              box.borderStyle === 'dashed' ? 'border-dashed' : 'border-solid'
            } ${palette.rectBorder} shadow-md`
      } ${
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent z-30'
          : 'z-20 hover:shadow-xl'
      }`}
    >
      {isSelected && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute left-0 flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/95 text-white border border-white/15 shadow-xl z-40 ${
            currentY < 52 ? '-bottom-11' : '-top-11'
          }`}
        >
          {(Object.keys(FLOATING_COLORS) as NoteFloatingBoxColor[]).map((cKey) => (
            <button
              key={cKey}
              type="button"
              onClick={() => onUpdate({ color: cKey })}
              title={FLOATING_COLORS[cKey].label}
              className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                FLOATING_COLORS[cKey].dot
              } ${box.color === cKey ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'}`}
            />
          ))}

          {!isSticky && (
            <>
              <div className="w-px h-3.5 bg-white/20 mx-0.5" />
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    borderStyle: box.borderStyle === 'dashed' ? 'solid' : 'dashed',
                  })
                }
                title="Cambiar borde sólido / punteado"
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-200 hover:bg-white/15 cursor-pointer whitespace-nowrap"
              >
                {box.borderStyle === 'dashed' ? 'Sólido' : 'Punteado'}
              </button>
            </>
          )}

          <div className="w-px h-3.5 bg-white/20 mx-0.5" />
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicar"
            className="p-1 rounded hover:bg-white/15 text-slate-200 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar"
            className="p-1 rounded hover:bg-rose-500/30 text-rose-300 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      <div
        onPointerDown={(e) => beginInteraction('drag', e)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Arrastra para mover"
        className={`h-7 px-2.5 rounded-t-[14px] flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing touch-none shrink-0 ${
          isSticky ? palette.stickyHeader : 'bg-black/[0.04] dark:bg-white/[0.06]'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripHorizontal
            className={`w-3.5 h-3.5 shrink-0 opacity-60 ${
              isSticky ? palette.stickyText : palette.rectText
            }`}
          />
          <input
            type="text"
            value={box.title || ''}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={isSticky ? 'Nota rápida' : 'Rectángulo'}
            className={`w-full bg-transparent text-[11px] font-bold focus:outline-none truncate select-text ${
              isSticky ? palette.stickyText : palette.rectText
            }`}
          />
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Quitar"
          className={`p-0.5 rounded opacity-60 hover:opacity-100 cursor-pointer ${
            isSticky ? palette.stickyText : palette.rectText
          }`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <textarea
        value={box.text}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder={
          isSticky
            ? 'Escribe tu idea o recordatorio aquí...'
            : 'Escribe dentro del rectángulo o déjalo como marco visual...'
        }
        className={`flex-1 w-full resize-none bg-transparent px-3 py-2 text-xs leading-relaxed focus:outline-none select-text ${
          isSticky ? palette.stickyText : palette.rectText
        }`}
      />

      <div
        onPointerDown={(e) => beginInteraction('resize', e)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Arrastra para cambiar tamaño"
        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize touch-none flex items-end justify-end p-1"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`opacity-50 ${isSticky ? palette.stickyText : palette.rectText}`}
          aria-hidden="true"
        >
          <path d="M9 1L1 9M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

const CORE_AREA_TAGS = ['Personal', 'Empresarial', 'Aprendizaje'];

function resolveNoteTags(note: PersonalNote): string[] {
  if (Array.isArray(note.tags)) {
    return note.tags;
  }
  const derived: string[] = [];
  if (note.scopeTags?.includes('business')) derived.push('Empresarial');
  if (note.scopeTags?.includes('personal')) derived.push('Personal');
  if (note.category === 'bitacora') derived.push('Bitácora');
  else if (note.category === 'finanzas') derived.push('Finanzas');
  else if (note.category === 'ideas') derived.push('Ideas');
  else if (note.category === 'planificacion_anual') derived.push('Planificación');
  if (derived.length === 0) derived.push('Personal');
  return Array.from(new Set(derived));
}

// ============================================================================
// Main PersonalNotesView — Complete Notability Studio + Cross-Module Links
// ============================================================================
type ToolbarPopover = 'paper' | 'font' | 'color' | 'highlight' | 'links' | 'tags' | null;

export const PersonalNotesView: React.FC<PersonalNotesViewProps> = ({
  data,
  onUpdateData,
  onNavigate,
  initialNoteId,
  onClearInitialNoteId,
  initialStudioAction,
  onClearInitialStudioAction,
  onEditorFullscreenChange,
}) => {
  const notes = data.personalNotes || [];
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    initialNoteId || notes[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'editor' | 'library'>(
    initialNoteId ? 'editor' : 'library'
  );
  const [libraryLayout, setLibraryLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [showInlineTagInput, setShowInlineTagInput] = useState<boolean>(false);

  // Integrated Studios: AI Topic Assistant, Meeting Audio Processor, Manual Decision / Bitácora
  const [showTopicAssistant, setShowTopicAssistant] = useState(false);
  const [showMeetingStudio, setShowMeetingStudio] = useState(false);
  const [showManualDecision, setShowManualDecision] = useState(false);
  const [decisionDraft, setDecisionDraft] = useState<DecisionDraftPayload | null>(null);
  const [pendingMeetingAction, setPendingMeetingAction] = useState<NotesStudioAction | null>(null);

  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(null);
  const [pendingFocus, setPendingFocus] = useState<{ index: number; caret?: number } | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState<ToolbarPopover>(null);

  // Apple Pencil / Freehand Ink State
  const [inkTool, setInkTool] = useState<NoteInkTool>('text');
  const [inkColor, setInkColor] = useState<string>('#7c3aed');
  const [inkWidth, setInkWidth] = useState<number>(3);
  const [pencilOnly, setPencilOnly] = useState<boolean>(false);
  const [isRunningOcr, setIsRunningOcr] = useState<boolean>(false);

  // Voice Dictation State
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [isTranscribingDictation, setIsTranscribingDictation] = useState<boolean>(false);
  const [dictationInterim, setDictationInterim] = useState<string>('');
  const speechRecRef = useRef<any>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);

  // Note Link Search inside "Enlazar" Popover
  const [linkSearch, setLinkSearch] = useState<string>('');

  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
  const paperCanvasRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Action feedback toast
  const [actionToast, setActionToast] = useState<{
    text: string;
    targetView?: string;
    targetLabel?: string;
  } | null>(null);

  // Calendar quick-add modal state
  const [calendarModal, setCalendarModal] = useState<{
    title: string;
    date: string;
    time: string;
    addReminder: boolean;
    sourceText: string;
  } | null>(null);

  // Finance quick-add modal state
  const [financeModal, setFinanceModal] = useState<{
    type: 'expense' | 'income' | 'investment';
    amount: string;
    description: string;
    category: string;
    date: string;
    bankAccountId: string;
    sourceText: string;
  } | null>(null);

  // Sync fullscreen canvas mode with App layout: library shows sidebar, opened note expands fullscreen
  useEffect(() => {
    onEditorFullscreenChange?.(viewMode === 'editor');
    return () => {
      onEditorFullscreenChange?.(false);
    };
  }, [viewMode, onEditorFullscreenChange]);

  // Open specific note when jumped from Projects, Tasks, or Personal Experiments
  useEffect(() => {
    if (initialNoteId) {
      setSelectedNoteId(initialNoteId);
      setViewMode('editor');
      setOpenPopover(null);
      setSelectedBoxId(null);
      setSelectedImageId(null);
      onClearInitialNoteId?.();
    }
  }, [initialNoteId, onClearInitialNoteId]);

  // Open Meeting Audio Studio when launched from Mobile Quick Action Sheet (Grabar Junta / Subir Audio)
  useEffect(() => {
    if (initialStudioAction) {
      setPendingMeetingAction(initialStudioAction);
      setShowMeetingStudio(true);
      onClearInitialStudioAction?.();
    }
  }, [initialStudioAction, onClearInitialStudioAction]);

  // Close popovers on outside click
  useEffect(() => {
    if (!openPopover) return;
    const handleOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openPopover]);

  // Cleanup dictation on unmount
  useEffect(() => {
    return () => {
      try {
        speechRecRef.current?.stop();
      } catch {
        // ignore
      }
      if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
        try {
          mediaRecRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const triggerToast = (text: string, targetView?: string, targetLabel?: string) => {
    setActionToast({ text, targetView, targetLabel });
    setTimeout(() => {
      setActionToast((prev) => (prev?.text === text ? null : prev));
    }, 5500);
  };

  // Dynamic catalog of area tags: core areas (Personal, Empresarial, Aprendizaje) + every custom tag used across notes
  const allCatalogTags = useMemo(() => {
    const map = new Map<string, string>();
    CORE_AREA_TAGS.forEach((t) => map.set(t.toLowerCase(), t));
    notes.forEach((n) => {
      resolveNoteTags(n).forEach((t) => {
        const clean = t.trim();
        if (clean && !map.has(clean.toLowerCase())) {
          map.set(clean.toLowerCase(), clean);
        }
      });
    });
    return Array.from(map.values());
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...notes]
      .filter((note) => {
        const noteTags = resolveNoteTags(note);
        if (selectedTagFilter !== 'all') {
          const matchesTag = noteTags.some(
            (t) => t.toLowerCase() === selectedTagFilter.toLowerCase()
          );
          if (!matchesTag) return false;
        }
        if (!q) return true;
        return (
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          noteTags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [notes, searchQuery, selectedTagFilter]);

  const activeNote =
    notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || notes[0] || null;

  const activePaperStyle: NotePaperStyle = activeNote?.paperStyle || 'dotted';
  const activePaperTone: NotePaperTone = activeNote?.paperTone || 'system';
  const activeFontFamily: NoteFontFamily = activeNote?.fontFamily || 'sans';
  const activeFontSize: NoteFontSize = activeNote?.fontSize || 'md';
  const activeFloatingBoxes: NoteFloatingBox[] = activeNote?.floatingBoxes || [];
  const activeEmbeddedImages: NoteEmbeddedImage[] = activeNote?.embeddedImages || [];
  const activeInkStrokes: NoteInkStroke[] = activeNote?.inkStrokes || [];

  const activeFontSpec =
    FONT_FAMILIES.find((f) => f.id === activeFontFamily) || FONT_FAMILIES[0];

  const blocks = useMemo(() => {
    if (!activeNote) return [];
    return activeNote.content.split('\n').map(parseLineToBlock);
  }, [activeNote]);

  const checklistStats = useMemo(() => {
    const items = blocks.filter((b) => b.kind === 'checklist');
    const done = items.filter((b) => b.checked).length;
    return { total: items.length, done };
  }, [blocks]);

  const detectedItems = useMemo(
    () => (activeNote ? extractSmartItemsFromNote(activeNote.content) : { dates: [], finances: [] }),
    [activeNote]
  );

  const expenseCategories = useMemo(() => {
    const list = data.personalFinances?.expenseCategories;
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_EXPENSE_CATEGORIES;
  }, [data.personalFinances?.expenseCategories]);

  const bankAccounts = data.personalFinances?.bankAccounts || [];

  // Resolved linked entities for activeNote
  const activeLinksSummary = useMemo(() => {
    if (!activeNote) return [];
    const items: Array<{
      id: string;
      kind: 'project' | 'business' | 'task' | 'experiment';
      label: string;
      targetView: string;
    }> = [];
    for (const pid of activeNote.linkedProjectIds || []) {
      const p = data.projects.find((pr) => pr.id === pid);
      if (p) items.push({ id: pid, kind: 'project', label: p.name, targetView: 'business' });
    }
    for (const bid of activeNote.linkedBusinessIds || []) {
      const b = data.businesses.find((bz) => bz.id === bid);
      if (b) items.push({ id: bid, kind: 'business', label: b.name, targetView: 'business' });
    }
    for (const tid of activeNote.linkedTaskIds || []) {
      const t = data.tasks.find((tk) => tk.id === tid);
      if (t) {
        items.push({
          id: tid,
          kind: 'task',
          label: t.title,
          targetView: t.scope === 'business' ? 'business' : 'tasks_general',
        });
      }
    }
    for (const eid of activeNote.linkedExperimentIds || []) {
      const ex = (data.personalExperiments || []).find((e) => e.id === eid);
      if (ex) {
        items.push({
          id: eid,
          kind: 'experiment',
          label: ex.title,
          targetView: 'personal_experiments',
        });
      }
    }
    return items;
  }, [activeNote, data.projects, data.businesses, data.tasks, data.personalExperiments]);

  // Apply deferred focus
  useEffect(() => {
    if (!pendingFocus) return;
    setFocusedBlockIndex(pendingFocus.index);
    const raf = requestAnimationFrame(() => {
      const el = textareaRefs.current[pendingFocus.index];
      if (el) {
        el.focus();
        const pos =
          pendingFocus.caret !== undefined ? pendingFocus.caret : el.value.length;
        el.setSelectionRange(pos, pos);
      }
      setPendingFocus(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [pendingFocus, blocks.length]);

  const updateActiveNote = (patch: Partial<PersonalNote>) => {
    if (!activeNote) return;
    const nowIso = new Date().toISOString();
    onUpdateData((prev) => ({
      ...prev,
      personalNotes: (prev.personalNotes || []).map((n) =>
        n.id === activeNote.id ? { ...n, ...patch, updatedAt: nowIso } : n
      ),
    }));
  };

  const commitBlocks = (nextBlocks: ParsedBlock[]) => {
    updateActiveNote({ content: nextBlocks.map(serializeBlock).join('\n') });
  };

  const handleOpenNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setFocusedBlockIndex(null);
    setSelectedBoxId(null);
    setSelectedImageId(null);
    setOpenPopover(null);
    setInkTool('text');
    setViewMode('editor');
  };

  const handleCreateNote = () => {
    const nowIso = new Date().toISOString();
    const initialTags =
      selectedTagFilter !== 'all' ? [selectedTagFilter] : ['Personal'];
    const newNote: PersonalNote = {
      id: `pnote_${Date.now()}`,
      title: 'Nueva Nota',
      category: 'general',
      tags: initialTags,
      scopeTags: initialTags.some((t) => t.toLowerCase() === 'empresarial')
        ? ['business']
        : ['personal'],
      pinned: false,
      paperStyle: 'lined',
      paperTone: 'system',
      fontFamily: 'sans',
      fontSize: 'md',
      floatingBoxes: [],
      embeddedImages: [],
      inkStrokes: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      content: `# Título de tu nota\n\n- [ ] Escribe tu primer pendiente (ej: próximo lunes revisar prioridades)\n- [ ] Anota un gasto o ingreso (ej: gasto de $50 o ingreso de $500)`,
    };
    onUpdateData((prev) => ({
      ...prev,
      personalNotes: [newNote, ...(prev.personalNotes || [])],
    }));
    setSelectedNoteId(newNote.id);
    setSelectedBoxId(null);
    setSelectedImageId(null);
    setOpenPopover(null);
    setInkTool('text');
    setViewMode('editor');
    setPendingFocus({ index: 2 });
  };

  const handleNoteCreatedByAssistant = (newNote: PersonalNote) => {
    onUpdateData((prev) => ({
      ...prev,
      personalNotes: [newNote, ...(prev.personalNotes || [])],
    }));
    setShowTopicAssistant(false);
    setSelectedNoteId(newNote.id);
    setSelectedBoxId(null);
    setSelectedImageId(null);
    setOpenPopover(null);
    setInkTool('text');
    setViewMode('editor');
    setFocusedBlockIndex(null);
    triggerToast(`Nota "${newNote.title}" creada por el Asistente IA.`);
  };

  const handleAppendSummaryToNote = (
    noteId: string,
    summaryMarkdown: string,
    summaryMeta: {
      executiveSummary: string;
      context: string;
      resolution: string;
      keyPoints: string[];
      actionItems: string[];
      expectedImpact: string;
    }
  ) => {
    const nowIso = new Date().toISOString();
    onUpdateData((prev) => ({
      ...prev,
      personalNotes: (prev.personalNotes || []).map((n) => {
        if (n.id !== noteId) return n;
        const baseContent = (n.content || '').trimEnd();
        return {
          ...n,
          content: `${baseContent}\n\n${summaryMarkdown}`,
          decisionMeta: {
            ...(n.decisionMeta || {}),
            context: n.decisionMeta?.context || summaryMeta.context,
            decision: n.decisionMeta?.decision || summaryMeta.resolution,
            keyPoints:
              n.decisionMeta?.keyPoints && n.decisionMeta.keyPoints.length > 0
                ? n.decisionMeta.keyPoints
                : summaryMeta.keyPoints,
            expectedOutcome:
              n.decisionMeta?.expectedOutcome || summaryMeta.expectedImpact,
          },
          updatedAt: nowIso,
        };
      }),
    }));
    setShowTopicAssistant(false);
    setSelectedNoteId(noteId);
    setSelectedBoxId(null);
    setSelectedImageId(null);
    setOpenPopover(null);
    setInkTool('text');
    setViewMode('editor');
    setFocusedBlockIndex(null);
    triggerToast('Resumen de Bitácora IA insertado en la nota.');
  };

  const handleExportActiveNoteMarkdown = () => {
    if (!activeNote) {
      handleExportAllNotesMarkdown();
      return;
    }
    const noteTags = resolveNoteTags(activeNote).join(', ');
    const lines: string[] = [
      `# ${activeNote.title || 'Sin título'}`,
      `- **Etiquetas:** ${noteTags}`,
      `- **Actualizada:** ${activeNote.updatedAt.split('T')[0]}`,
      '',
      activeNote.content,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeSlug = (activeNote.title || 'nota')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    a.href = url;
    a.download = `${safeSlug || 'nota'}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast(`Nota "${activeNote.title || 'Sin título'}" exportada (.md).`);
  };

  const handleSaveBitacoraNote = (newNote: PersonalNote, decisionRecord: StrategicDecision) => {
    const expId = decisionRecord.experimentId;
    onUpdateData((prev) => ({
      ...prev,
      personalNotes: [newNote, ...(prev.personalNotes || [])],
      strategicDecisions: [decisionRecord, ...(prev.strategicDecisions || [])],
      personalExperiments: expId
        ? (prev.personalExperiments || []).map((exp) =>
            exp.id === expId
              ? {
                  ...exp,
                  linkedDecisionIds: Array.from(
                    new Set([...(exp.linkedDecisionIds || []), decisionRecord.id])
                  ),
                }
              : exp
          )
        : prev.personalExperiments,
    }));
    setShowMeetingStudio(false);
    setShowManualDecision(false);
    setDecisionDraft(null);
    setSelectedNoteId(newNote.id);
    setSelectedBoxId(null);
    setSelectedImageId(null);
    setOpenPopover(null);
    setInkTool('text');
    setViewMode('editor');
    setFocusedBlockIndex(null);
    triggerToast(`Bitácora "${newNote.title}" guardada y vinculada en tus Notas Generales.`);
  };

  const handleExportAllNotesMarkdown = () => {
    const lines: string[] = [
      '# Notas Generales & Bitácora Ejecutiva — Mi Segundo Cerebro 4.0',
      `Exportado el: ${new Date().toISOString().split('T')[0]}`,
      '',
    ];
    notes.forEach((n, idx) => {
      const noteTags = resolveNoteTags(n).join(', ');
      lines.push(`## ${idx + 1}. ${n.title || 'Sin título'}`);
      lines.push(`- **Etiquetas:** ${noteTags}`);
      lines.push(`- **Actualizada:** ${n.updatedAt.split('T')[0]}`);
      lines.push('');
      lines.push(n.content);
      lines.push('\n---\n');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Notas_Bitacora_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Bitácora y notas exportadas en Markdown (.md).');
  };

  const toggleActiveNoteTag = (tag: string) => {
    if (!activeNote) return;
    const clean = tag.trim().replace(/^#/, '');
    if (!clean) return;
    const current = resolveNoteTags(activeNote);
    const exists = current.some((t) => t.toLowerCase() === clean.toLowerCase());
    const next = exists
      ? current.filter((t) => t.toLowerCase() !== clean.toLowerCase())
      : [...current, clean];
    const nextScope: ('personal' | 'business')[] = [];
    if (next.some((t) => t.toLowerCase() === 'personal')) nextScope.push('personal');
    if (next.some((t) => t.toLowerCase() === 'empresarial')) nextScope.push('business');
    updateActiveNote({
      tags: next,
      scopeTags: nextScope.length > 0 ? nextScope : activeNote.scopeTags,
    });
  };

  const handleAddCustomTagToActiveNote = () => {
    if (!activeNote) return;
    const clean = newTagInput.trim().replace(/^#/, '');
    if (!clean) return;
    const current = resolveNoteTags(activeNote);
    if (!current.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      toggleActiveNoteTag(clean);
    }
    setNewTagInput('');
    setShowInlineTagInput(false);
  };

  const handleDeleteNote = (noteId: string) => {
    const remaining = notes.filter((n) => n.id !== noteId);
    onUpdateData((prev) => ({
      ...prev,
      personalNotes: (prev.personalNotes || []).filter((n) => n.id !== noteId),
    }));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(remaining[0]?.id || '');
      setFocusedBlockIndex(null);
      setSelectedBoxId(null);
      setSelectedImageId(null);
      if (remaining.length === 0) {
        setViewMode('library');
      }
    }
  };

  // Toggle links between current Note and Projects / Businesses / Tasks / Experiments
  const toggleNoteEntityLink = (
    field: 'linkedProjectIds' | 'linkedBusinessIds' | 'linkedTaskIds' | 'linkedExperimentIds',
    entityId: string
  ) => {
    if (!activeNote) return;
    const current = new Set(activeNote[field] || []);
    if (current.has(entityId)) current.delete(entityId);
    else current.add(entityId);
    updateActiveNote({ [field]: Array.from(current) } as Partial<PersonalNote>);
  };

  // Floating Boxes (Sticky Notes & Rectangles)
  const handleAddFloatingBox = (kind: NoteFloatingBoxKind) => {
    if (!activeNote) return;
    setInkTool('text');
    const canvasW = paperCanvasRef.current?.clientWidth || 720;
    const count = activeFloatingBoxes.length;
    const boxW = kind === 'sticky' ? 230 : 250;
    const boxH = kind === 'sticky' ? 165 : 130;
    const defaultX = Math.max(
      16,
      Math.min(
        canvasW - boxW - 24 - (count % 3) * 26,
        Math.max(16, canvasW - boxW - 16)
      )
    );
    const defaultY = 24 + (count % 4) * 34;

    const newBox: NoteFloatingBox = {
      id: `fbox_${Date.now()}`,
      kind,
      x: Math.round(defaultX),
      y: Math.round(defaultY),
      width: Math.min(boxW, Math.max(180, canvasW - 32)),
      height: boxH,
      color: kind === 'sticky' ? 'amber' : 'blue',
      borderStyle: kind === 'rect' ? 'solid' : undefined,
      title: kind === 'sticky' ? 'Nota rápida' : 'Bloque destacado',
      text: '',
    };

    updateActiveNote({ floatingBoxes: [...activeFloatingBoxes, newBox] });
    setSelectedImageId(null);
    setSelectedBoxId(newBox.id);
    setOpenPopover(null);
  };

  const handleUpdateFloatingBox = (boxId: string, patch: Partial<NoteFloatingBox>) => {
    if (!activeNote) return;
    updateActiveNote({
      floatingBoxes: activeFloatingBoxes.map((b) =>
        b.id === boxId ? { ...b, ...patch } : b
      ),
    });
  };

  const handleDuplicateFloatingBox = (boxId: string) => {
    if (!activeNote) return;
    const orig = activeFloatingBoxes.find((b) => b.id === boxId);
    if (!orig) return;
    const clone: NoteFloatingBox = {
      ...orig,
      id: `fbox_${Date.now()}`,
      x: orig.x + 22,
      y: orig.y + 22,
    };
    updateActiveNote({ floatingBoxes: [...activeFloatingBoxes, clone] });
    setSelectedBoxId(clone.id);
  };

  const handleDeleteFloatingBox = (boxId: string) => {
    if (!activeNote) return;
    updateActiveNote({
      floatingBoxes: activeFloatingBoxes.filter((b) => b.id !== boxId),
    });
    if (selectedBoxId === boxId) setSelectedBoxId(null);
  };

  const handleSelectFloatingBox = (boxId: string) => {
    setSelectedImageId(null);
    setSelectedBoxId(boxId);
    if (
      activeFloatingBoxes.length > 1 &&
      activeFloatingBoxes[activeFloatingBoxes.length - 1]?.id !== boxId
    ) {
      const target = activeFloatingBoxes.find((b) => b.id === boxId);
      if (target) {
        updateActiveNote({
          floatingBoxes: [...activeFloatingBoxes.filter((b) => b.id !== boxId), target],
        });
      }
    }
  };

  // Embedded Images (Auto-Compressed, Movable & Resizable)
  const handlePickEmbeddedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeNote) return;

    try {
      const { dataUrl, width, height, sizeKb } = await compressEmbeddedNoteImage(file);
      const canvasW = paperCanvasRef.current?.clientWidth || 720;
      const count = activeEmbeddedImages.length;
      const clampedW = Math.min(width, Math.max(160, canvasW - 40));
      const clampedH = Math.round((clampedW / width) * height);
      const newImg: NoteEmbeddedImage = {
        id: `nimg_${Date.now()}`,
        dataUrl,
        x: Math.max(16, Math.min(canvasW - clampedW - 24, 32 + (count % 3) * 28)),
        y: 36 + (count % 4) * 36,
        width: clampedW,
        height: clampedH,
        caption: '',
      };
      setInkTool('text');
      updateActiveNote({
        embeddedImages: [...activeEmbeddedImages, newImg],
      });
      setSelectedBoxId(null);
      setSelectedImageId(newImg.id);
      triggerToast(`Imagen incrustada (${sizeKb} KB optimizada). Arrástrala donde necesites.`);
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'No se pudo incrustar la imagen.');
    }
  };

  const handleUpdateEmbeddedImage = (imgId: string, patch: Partial<NoteEmbeddedImage>) => {
    if (!activeNote) return;
    updateActiveNote({
      embeddedImages: activeEmbeddedImages.map((im) =>
        im.id === imgId ? { ...im, ...patch } : im
      ),
    });
  };

  const handleDuplicateEmbeddedImage = (imgId: string) => {
    if (!activeNote) return;
    const orig = activeEmbeddedImages.find((im) => im.id === imgId);
    if (!orig) return;
    const clone: NoteEmbeddedImage = {
      ...orig,
      id: `nimg_${Date.now()}`,
      x: orig.x + 24,
      y: orig.y + 24,
    };
    updateActiveNote({ embeddedImages: [...activeEmbeddedImages, clone] });
    setSelectedImageId(clone.id);
  };

  const handleDeleteEmbeddedImage = (imgId: string) => {
    if (!activeNote) return;
    updateActiveNote({
      embeddedImages: activeEmbeddedImages.filter((im) => im.id !== imgId),
    });
    if (selectedImageId === imgId) setSelectedImageId(null);
  };

  // Apple Pencil Ink Stroke Handlers + AI Handwriting OCR
  const handleAddInkStroke = (stroke: NoteInkStroke) => {
    if (!activeNote) return;
    updateActiveNote({ inkStrokes: [...activeInkStrokes, stroke] });
  };

  const handleEraseInkStrokeIds = (ids: string[]) => {
    if (!activeNote || ids.length === 0) return;
    const idSet = new Set(ids);
    updateActiveNote({
      inkStrokes: activeInkStrokes.filter((s) => !idSet.has(s.id)),
    });
  };

  const handleUndoInkStroke = () => {
    if (!activeNote || activeInkStrokes.length === 0) return;
    updateActiveNote({
      inkStrokes: activeInkStrokes.slice(0, -1),
    });
  };

  const handleClearAllInk = () => {
    if (!activeNote || activeInkStrokes.length === 0) return;
    updateActiveNote({ inkStrokes: [] });
  };

  const handleConvertHandwritingToText = async () => {
    if (!activeNote || activeInkStrokes.length === 0) return;
    const rect = paperCanvasRef.current?.getBoundingClientRect();
    const base64 = renderInkStrokesToPngBase64(
      activeInkStrokes,
      rect?.width || 800,
      rect?.height || 640
    );
    if (!base64) return;

    setIsRunningOcr(true);
    try {
      const { ok, data: resData } = await fetchJsonWithTimeout<{
        text?: string;
        error?: string;
      }>(
        '/api/gemini/handwriting-ocr',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: 'image/png' }),
        },
        30000
      );

      if (!ok || !resData.text) {
        triggerToast(resData.error || 'No se pudo transcribir el texto manuscrito.');
        return;
      }

      const appendedContent = activeNote.content.trim()
        ? `${activeNote.content}\n\n${resData.text}`
        : resData.text;
      updateActiveNote({ content: appendedContent });
      setInkTool('text');
      triggerToast('Escritura a mano convertida a texto editable.');
    } catch {
      triggerToast('Error de conexión al convertir manuscrito con IA.');
    } finally {
      setIsRunningOcr(false);
    }
  };

  // Voice Dictation (Web Speech API real-time + MediaRecorder/Gemini universal fallback)
  const appendDictatedText = (spoken: string) => {
    const clean = spoken.trim();
    if (!clean || !activeNote) return;

    const targetIdx =
      focusedBlockIndex !== null && focusedBlockIndex < blocks.length
        ? focusedBlockIndex
        : blocks.length - 1;

    if (targetIdx >= 0 && blocks[targetIdx]) {
      const curr = blocks[targetIdx];
      const separator = curr.body.trim() ? ' ' : '';
      const next = blocks.map((b, i) =>
        i === targetIdx ? { ...b, body: `${b.body}${separator}${clean}` } : b
      );
      commitBlocks(next);
      setPendingFocus({
        index: targetIdx,
        caret: `${curr.body}${separator}${clean}`.length,
      });
    } else {
      const next: ParsedBlock[] = [
        ...blocks,
        { kind: 'paragraph', checked: false, body: clean },
      ];
      commitBlocks(next);
      setPendingFocus({ index: next.length - 1, caret: clean.length });
    }
  };

  const stopDictation = () => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    }
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      try {
        mediaRecRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsDictating(false);
    setDictationInterim('');
  };

  const startMediaRecorderDictation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      mediaChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) mediaChunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(mediaChunksRef.current, { type: mimeType });
        mediaRecRef.current = null;
        if (blob.size < 400) {
          setIsDictating(false);
          return;
        }
        setIsTranscribingDictation(true);
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = String(reader.result || '');
              resolve(res.includes(',') ? res.split(',')[1] : res);
            };
            reader.onerror = () => reject(new Error('Error leyendo audio'));
            reader.readAsDataURL(blob);
          });
          const { ok, data: resData } = await fetchJsonWithTimeout<{
            text?: string;
            error?: string;
          }>(
            '/api/gemini/dictate-audio',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64, mimeType }),
            },
            30000
          );
          if (ok && resData.text) {
            appendDictatedText(resData.text);
            triggerToast('Dictado transcrito e insertado en tu nota.');
          } else {
            triggerToast(resData.error || 'No se pudo transcribir el dictado.');
          }
        } catch {
          triggerToast('Error al procesar el dictado de voz.');
        } finally {
          setIsTranscribingDictation(false);
          setIsDictating(false);
        }
      };

      mediaRecRef.current = recorder;
      recorder.start();
      setIsDictating(true);
      setDictationInterim('Grabando voz... toca "Detener" para insertar texto');
    } catch {
      triggerToast('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
    }
  };

  const handleToggleDictation = () => {
    if (isDictating) {
      stopDictation();
      return;
    }

    const SpeechRecCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecCtor) {
      try {
        const rec = new SpeechRecCtor();
        rec.lang = 'es-ES';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event: any) => {
          let interim = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              finalTranscript += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }
          }
          setDictationInterim(interim);
          if (finalTranscript.trim()) {
            appendDictatedText(finalTranscript);
          }
        };

        rec.onerror = (ev: any) => {
          if (ev?.error === 'not-allowed') {
            triggerToast('Permiso de micrófono denegado en el navegador.');
            stopDictation();
          } else {
            // Fallback to Gemini audio dictation on speech API failure
            stopDictation();
            void startMediaRecorderDictation();
          }
        };

        rec.onend = () => {
          speechRecRef.current = null;
          setIsDictating(false);
          setDictationInterim('');
        };

        speechRecRef.current = rec;
        rec.start();
        setIsDictating(true);
        setInkTool('text');
        return;
      } catch {
        // Fallback below
      }
    }

    void startMediaRecorderDictation();
  };

  // Block Kind & Inline Formatting
  const applyBlockKind = (kind: BlockKind) => {
    if (!activeNote) return;
    setInkTool('text');
    const targetIdx =
      focusedBlockIndex !== null && focusedBlockIndex < blocks.length
        ? focusedBlockIndex
        : blocks.length;

    const next = [...blocks];
    if (targetIdx >= next.length) {
      next.push({ kind, checked: false, body: '' });
      commitBlocks(next);
      setPendingFocus({ index: next.length - 1, caret: 0 });
      return;
    }

    const current = next[targetIdx];
    const nextKind: BlockKind = current.kind === kind && kind !== 'paragraph' ? 'paragraph' : kind;
    next[targetIdx] = {
      ...current,
      kind: nextKind,
      checked: nextKind === 'checklist' ? current.checked : false,
    };
    commitBlocks(next);
    setPendingFocus({ index: targetIdx });
  };

  const applyInlineTokens = (openTag: string, closeTag: string, sampleLabel: string) => {
    if (!activeNote) return;
    setInkTool('text');
    const targetIdx =
      focusedBlockIndex !== null && focusedBlockIndex < blocks.length
        ? focusedBlockIndex
        : blocks.length - 1;

    if (targetIdx < 0) {
      const snippet = `${openTag}${sampleLabel}${closeTag}`;
      commitBlocks([{ kind: 'paragraph', checked: false, body: snippet }]);
      setPendingFocus({ index: 0, caret: openTag.length + sampleLabel.length });
      return;
    }

    const el = textareaRefs.current[targetIdx];
    const current = blocks[targetIdx];
    const body = current.body;
    const start = el ? el.selectionStart : body.length;
    const end = el ? el.selectionEnd : body.length;
    const selected = body.slice(start, end);

    let newBody: string;
    let nextCaret: number;

    if (selected) {
      if (
        selected.startsWith(openTag) &&
        selected.endsWith(closeTag) &&
        selected.length > openTag.length + closeTag.length
      ) {
        const unwrapped = selected.slice(openTag.length, -closeTag.length);
        newBody = body.slice(0, start) + unwrapped + body.slice(end);
        nextCaret = start + unwrapped.length;
      } else {
        const wrapped = `${openTag}${selected}${closeTag}`;
        newBody = body.slice(0, start) + wrapped + body.slice(end);
        nextCaret = start + wrapped.length;
      }
    } else {
      const snippet = `${openTag}${sampleLabel}${closeTag}`;
      newBody = body.slice(0, start) + snippet + body.slice(end);
      nextCaret = start + openTag.length + sampleLabel.length;
    }

    const next = blocks.map((b, i) => (i === targetIdx ? { ...b, body: newBody } : b));
    commitBlocks(next);
    setPendingFocus({ index: targetIdx, caret: nextCaret });
  };

  const applyInlineWrapper = (marker: '**' | '*' | '__', sampleLabel: string) => {
    applyInlineTokens(marker, marker, sampleLabel);
  };

  const applyTextColor = (colorId: string) => {
    applyInlineTokens(`{c:${colorId}}`, '{/c}', 'texto en color');
    setOpenPopover(null);
  };

  const applyTextHighlight = (highlightId: string) => {
    applyInlineTokens(`{h:${highlightId}}`, '{/h}', 'texto resaltado');
    setOpenPopover(null);
  };

  const insertSmartSnippet = (snippet: string, asChecklist = false) => {
    if (!activeNote) return;
    setInkTool('text');
    const next = [...blocks];
    if (
      focusedBlockIndex !== null &&
      focusedBlockIndex < next.length &&
      next[focusedBlockIndex].body.trim() === ''
    ) {
      next[focusedBlockIndex] = {
        ...next[focusedBlockIndex],
        kind: asChecklist ? 'checklist' : next[focusedBlockIndex].kind,
        body: snippet,
      };
      commitBlocks(next);
      setPendingFocus({ index: focusedBlockIndex, caret: snippet.length });
      return;
    }

    const insertAt =
      focusedBlockIndex !== null && focusedBlockIndex < next.length
        ? focusedBlockIndex + 1
        : next.length;
    next.splice(insertAt, 0, {
      kind: asChecklist ? 'checklist' : 'paragraph',
      checked: false,
      body: snippet,
    });
    commitBlocks(next);
    setPendingFocus({ index: insertAt, caret: snippet.length });
  };

  const handleBlockKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    const el = e.currentTarget;
    const current = blocks[idx];

    if (e.metaKey || e.ctrlKey) {
      const lowerKey = e.key.toLowerCase();
      if (lowerKey === 'b') {
        e.preventDefault();
        applyInlineWrapper('**', 'negrita');
        return;
      }
      if (lowerKey === 'i') {
        e.preventDefault();
        applyInlineWrapper('*', 'cursiva');
        return;
      }
      if (lowerKey === 'u') {
        e.preventDefault();
        applyInlineWrapper('__', 'subrayado');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const caret = el.selectionStart;
      const before = current.body.slice(0, caret);
      const after = current.body.slice(caret);

      if (
        (current.kind === 'checklist' || current.kind === 'bullet') &&
        current.body.trim() === ''
      ) {
        const next = blocks.map((b, i) =>
          i === idx ? { kind: 'paragraph' as BlockKind, checked: false, body: '' } : b
        );
        commitBlocks(next);
        setPendingFocus({ index: idx, caret: 0 });
        return;
      }

      const nextKind: BlockKind =
        current.kind === 'checklist'
          ? 'checklist'
          : current.kind === 'bullet'
          ? 'bullet'
          : 'paragraph';

      const next = [...blocks];
      next[idx] = { ...current, body: before };
      next.splice(idx + 1, 0, { kind: nextKind, checked: false, body: after });
      commitBlocks(next);
      setPendingFocus({ index: idx + 1, caret: 0 });
      return;
    }

    if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0) {
      if (current.kind !== 'paragraph') {
        e.preventDefault();
        const next = blocks.map((b, i) =>
          i === idx ? { kind: 'paragraph' as BlockKind, checked: false, body: b.body } : b
        );
        commitBlocks(next);
        setPendingFocus({ index: idx, caret: 0 });
        return;
      }
      if (idx > 0) {
        e.preventDefault();
        const prevBlock = blocks[idx - 1];
        const mergeCaret = prevBlock.body.length;
        const next = [...blocks];
        next[idx - 1] = { ...prevBlock, body: prevBlock.body + current.body };
        next.splice(idx, 1);
        commitBlocks(next);
        setPendingFocus({ index: idx - 1, caret: mergeCaret });
      }
      return;
    }

    if (e.key === 'ArrowUp' && el.selectionStart === 0 && idx > 0) {
      e.preventDefault();
      setPendingFocus({ index: idx - 1 });
      return;
    }

    if (
      e.key === 'ArrowDown' &&
      el.selectionStart === current.body.length &&
      idx < blocks.length - 1
    ) {
      e.preventDefault();
      setPendingFocus({ index: idx + 1, caret: 0 });
    }
  };

  const openDateModal = (
    segment: Extract<SmartSegment, { type: 'date' }>,
    lineContext: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCalendarModal({
      title: cleanLineForTitle(lineContext) || `Compromiso: ${segment.text}`,
      date: segment.isoDate || todayStr,
      time: '09:00',
      addReminder: true,
      sourceText: segment.text,
    });
  };

  const openFinanceModal = (
    segment: Extract<SmartSegment, { type: 'finance' }>,
    lineContext: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const fType = segment.financeType || 'expense';
    const defaultCat =
      fType === 'income'
        ? 'Ingresos Personales / Honorarios'
        : fType === 'investment'
        ? 'Inversiones / Ahorro'
        : expenseCategories[0] || 'Otros Gastos Personales';

    setFinanceModal({
      type: fType,
      amount: String(segment.amount || ''),
      description: cleanLineForTitle(lineContext) || segment.text,
      category: defaultCat,
      date: todayStr,
      bankAccountId: bankAccounts[0]?.id || '',
      sourceText: segment.text,
    });
  };

  const handleConfirmCalendarAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarModal || !calendarModal.title.trim()) return;

    const newTask: BusinessTask = {
      id: `task_note_${Date.now()}`,
      title: calendarModal.title.trim(),
      description: activeNote
        ? `Creado desde nota: "${activeNote.title}"${calendarModal.time ? ` (${calendarModal.time})` : ''}`
        : undefined,
      scope: 'personal',
      pillar: 'intelectual',
      priority: 'important',
      status: 'todo',
      isDelegated: false,
      dueDate: calendarModal.date,
      estimatedMinutes: 30,
      tags: ['Nota Personal', 'Calendario'],
    };

    const newReminder: NoteReminderItem | null = calendarModal.addReminder
      ? {
          id: `nr_note_${Date.now()}`,
          title: calendarModal.title.trim(),
          content: activeNote
            ? `Agendado desde tu nota "${activeNote.title}" (${calendarModal.sourceText}).`
            : `Agendado para ${calendarModal.date}`,
          category: 'tarea',
          originModule: 'personal',
          targetView: 'tasks_general',
          reminderDate: calendarModal.date,
          reminderTime: calendarModal.time || '09:00',
          showInMiDia: true,
          completed: false,
          pinned: false,
          source: 'user',
          createdAt: new Date().toISOString(),
        }
      : null;

    onUpdateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
      notesReminders: newReminder
        ? [newReminder, ...(prev.notesReminders || [])]
        : prev.notesReminders,
      personalNotes: activeNote
        ? (prev.personalNotes || []).map((n) =>
            n.id === activeNote.id
              ? { ...n, linkedTaskIds: Array.from(new Set([...(n.linkedTaskIds || []), newTask.id])) }
              : n
          )
        : prev.personalNotes,
    }));

    const savedDate = formatReadableDate(calendarModal.date);
    setCalendarModal(null);
    triggerToast(
      `Agendado en tu calendario para el ${savedDate} y enlazado a esta nota.`,
      'tasks_general',
      'Ver en Calendario'
    );
  };

  const handleConfirmFinanceAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeModal) return;
    const numericAmount = Number(financeModal.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

    const newTx: FinancialTransaction = {
      id: `tx_note_${Date.now()}`,
      type: financeModal.type,
      category: financeModal.category.trim() || 'Otros Gastos Personales',
      amount: numericAmount,
      date: financeModal.date,
      description: financeModal.description.trim() || financeModal.sourceText,
      scope: 'personal',
      bankAccountId: financeModal.bankAccountId || undefined,
    };

    onUpdateData((prev) => {
      const prevFin = prev.personalFinances;
      const updatedBanks = (prevFin.bankAccounts || []).map((ba) => {
        if (ba.id !== financeModal.bankAccountId) return ba;
        const delta = financeModal.type === 'income' ? numericAmount : -numericAmount;
        return { ...ba, currentBalance: Math.max(0, ba.currentBalance + delta) };
      });

      return {
        ...prev,
        personalFinances: {
          ...prevFin,
          monthlyExpenses:
            financeModal.type === 'expense'
              ? prevFin.monthlyExpenses + numericAmount
              : prevFin.monthlyExpenses,
          monthlyIncome:
            financeModal.type === 'income'
              ? prevFin.monthlyIncome + numericAmount
              : prevFin.monthlyIncome,
          investmentsTotal:
            financeModal.type === 'investment'
              ? prevFin.investmentsTotal + numericAmount
              : prevFin.investmentsTotal,
          bankAccounts: updatedBanks,
          transactions: [newTx, ...(prevFin.transactions || [])],
        },
      };
    });

    const typeLabel =
      financeModal.type === 'income'
        ? 'Ingreso'
        : financeModal.type === 'investment'
        ? 'Ahorro / Inversión'
        : 'Gasto';
    setFinanceModal(null);
    triggerToast(
      `${typeLabel} de $${numericAmount.toLocaleString('en-US')} registrado en Finanzas.`,
      'personal_finances',
      'Ver en Finanzas'
    );
  };

  const activeBlockKind: BlockKind | null =
    focusedBlockIndex !== null && blocks[focusedBlockIndex]
      ? blocks[focusedBlockIndex].kind
      : null;

  const paperSurface = getPaperSurfaceClasses(activePaperTone);
  const paperPattern = getPaperPatternStyle(activePaperStyle, activePaperTone, 'full');
  const isDrawingActive = inkTool !== 'text';

  // Filtered entities for the "Enlazar" popover
  const qLink = linkSearch.trim().toLowerCase();
  const filteredLinkProjects = data.projects.filter(
    (p) => !qLink || p.name.toLowerCase().includes(qLink)
  );
  const filteredLinkBusinesses = data.businesses.filter(
    (b) => !qLink || b.name.toLowerCase().includes(qLink)
  );
  const filteredLinkTasks = data.tasks
    .filter((t) => !qLink || t.title.toLowerCase().includes(qLink))
    .slice(0, 16);
  const filteredLinkExperiments = (data.personalExperiments || []).filter(
    (ex) => !qLink || ex.title.toLowerCase().includes(qLink)
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Hidden Image File Input for Embedded Images */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePickEmbeddedImage}
        className="hidden"
      />

      {/* =================================================================== */}
      {/* VIEW A: NOTABILITY LIBRARY / HISTORY (GRID THUMBNAILS OR LIST VIEW) */}
      {/* =================================================================== */}
      {viewMode === 'library' ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-1 sm:px-3 py-2 space-y-5 max-w-6xl mx-auto w-full">
          <div className="p-4 sm:p-5 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/70 border border-violet-500/20 dark:border-violet-400/15 shadow-lg space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/25 shrink-0">
                  <NotebookPen className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Notas Generales &amp; Bitácora
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {notes.length} {notes.length === 1 ? 'nota guardada' : 'notas guardadas'} · Actas por voz IA, decisiones, dibujo y libretas vinculadas
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTopicAssistant(true)}
                  className="px-3.5 py-2 rounded-xl bg-violet-500/12 hover:bg-violet-500/20 border border-violet-500/30 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Asistente IA</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-fuchsia-600/25 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[2.5] text-white" />
                  <span>Nueva Nota</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-white/[0.07]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por título, etiqueta o contenido..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Unified Dynamic Area / Tag Filter Bar + Grid/List Toggle */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTagFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedTagFilter === 'all'
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Todas
                  </button>
                  {allCatalogTags.map((tag) => {
                    const isActive =
                      selectedTagFilter.toLowerCase() === tag.toLowerCase();
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTagFilter(isActive ? 'all' : tag)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                          isActive
                            ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300'
                        }`}
                      >
                        <Tag className="w-3 h-3 opacity-75" />
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 shrink-0"
                  role="group"
                  aria-label="Modo de visualización de notas"
                >
                  <button
                    type="button"
                    onClick={() => setLibraryLayout('grid')}
                    title="Vista en íconos / hojas"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      libraryLayout === 'grid'
                        ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Íconos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryLayout('list')}
                    title="Vista en lista"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      libraryLayout === 'list'
                        ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lista</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="py-16 px-6 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] text-center space-y-3">
              <NotebookPen className="w-10 h-10 text-violet-500 mx-auto" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                No se encontraron notas con ese filtro
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Crea una hoja libre, pídele al Asistente IA una nota sobre cualquier tema específico o procesa una reunión por voz.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTopicAssistant(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Crear con Asistente IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMeetingStudio(true)}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>Procesar Reunión IA</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-bold cursor-pointer"
                >
                  Nueva Nota Libre
                </button>
              </div>
            </div>
          ) : libraryLayout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
              {filteredNotes.map((note) => {
                const smart = extractSmartItemsFromNote(note.content);
                const noteStyle: NotePaperStyle = note.paperStyle || 'dotted';
                const noteTone: NotePaperTone = note.paperTone || 'system';
                const noteSurface = getPaperSurfaceClasses(noteTone);
                const miniPattern = getPaperPatternStyle(noteStyle, noteTone, 'mini');
                const previewLines = note.content
                  .split('\n')
                  .map((l) => cleanLineForTitle(l))
                  .filter((l) => l && l !== note.title)
                  .slice(0, 4);
                const catInfo = CATEGORY_META[note.category] || CATEGORY_META.general;
                const linkCount =
                  (note.linkedProjectIds?.length || 0) +
                  (note.linkedBusinessIds?.length || 0) +
                  (note.linkedTaskIds?.length || 0) +
                  (note.linkedExperimentIds?.length || 0);

                return (
                  <div
                    key={note.id}
                    onClick={() => handleOpenNote(note.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenNote(note.id);
                      }
                    }}
                    className="group relative flex flex-col rounded-2xl backdrop-blur-xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/[0.08] hover:border-blue-500/50 shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                  >
                    <div
                      style={miniPattern}
                      className={`relative h-36 p-3.5 border-b ${noteSurface.divider} ${noteSurface.sheet} shadow-none overflow-hidden`}
                    >
                      <div className="space-y-1.5 pointer-events-none">
                        <p className={`text-xs font-extrabold line-clamp-1 ${noteSurface.heading}`}>
                          {note.title || 'Sin título'}
                        </p>
                        {previewLines.length > 0 ? (
                          previewLines.map((line, i) => (
                            <p
                              key={i}
                              className={`text-[10px] leading-snug line-clamp-1 opacity-85 ${noteSurface.body}`}
                            >
                              {line}
                            </p>
                          ))
                        ) : (
                          <p className={`text-[10px] italic ${noteSurface.muted}`}>
                            Hoja lista para escribir...
                          </p>
                        )}
                      </div>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateData((prev) => ({
                              ...prev,
                              personalNotes: (prev.personalNotes || []).map((n) =>
                                n.id === note.id ? { ...n, pinned: !n.pinned } : n
                              ),
                            }));
                          }}
                          title={note.pinned ? 'Quitar fijado' : 'Fijar nota'}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md border transition-colors cursor-pointer ${
                            note.pinned
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-900/70 text-white border-white/15 hover:bg-indigo-600'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          title="Eliminar nota"
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-900/70 text-white border border-white/15 hover:bg-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {note.title || 'Sin título'}
                        </h2>
                        {note.pinned && (
                          <Pin className="w-3.5 h-3.5 text-violet-500 shrink-0 fill-current" />
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {resolveNoteTags(note).map((tg, idx) => (
                          <React.Fragment key={tg}>
                            {idx > 0 && <span aria-hidden="true">·</span>}
                            <span className="text-violet-600 dark:text-violet-400 font-semibold">
                              #{tg}
                            </span>
                          </React.Fragment>
                        ))}
                        <span aria-hidden="true">·</span>
                        <span>{formatShortUpdated(note.updatedAt)}</span>
                        {linkCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-violet-600 dark:text-violet-400 font-semibold">
                              {linkCount} {linkCount === 1 ? 'enlace' : 'enlaces'}
                            </span>
                          </>
                        )}
                        {smart.dates.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-sky-600 dark:text-sky-400 font-semibold">
                              {smart.dates.length} fechas
                            </span>
                          </>
                        )}
                        {smart.finances.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              {smart.finances.length} montos
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl backdrop-blur-xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/[0.08] shadow-lg divide-y divide-slate-200/70 dark:divide-white/[0.06] overflow-hidden mb-6">
              {filteredNotes.map((note) => {
                const smart = extractSmartItemsFromNote(note.content);
                const noteStyle: NotePaperStyle = note.paperStyle || 'dotted';
                const noteTone: NotePaperTone = note.paperTone || 'system';
                const noteSurface = getPaperSurfaceClasses(noteTone);
                const miniPattern = getPaperPatternStyle(noteStyle, noteTone, 'mini');
                const previewLine =
                  note.content
                    .split('\n')
                    .map((l) => cleanLineForTitle(l))
                    .find((l) => l && l !== note.title) || 'Hoja vacía';
                const catInfo = CATEGORY_META[note.category] || CATEGORY_META.general;
                const linkCount =
                  (note.linkedProjectIds?.length || 0) +
                  (note.linkedBusinessIds?.length || 0) +
                  (note.linkedTaskIds?.length || 0) +
                  (note.linkedExperimentIds?.length || 0);

                return (
                  <div
                    key={note.id}
                    onClick={() => handleOpenNote(note.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenNote(note.id);
                      }
                    }}
                    className="group flex items-center gap-3.5 px-4 py-3 hover:bg-blue-500/[0.06] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div
                      style={miniPattern}
                      className={`w-10 h-12 rounded-lg border shrink-0 flex items-center justify-center ${noteSurface.sheet} shadow-xs`}
                    >
                      <FileText className={`w-4 h-4 opacity-50 ${noteSurface.heading}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {note.title || 'Sin título'}
                        </h2>
                        {note.pinned && (
                          <Pin className="w-3 h-3 text-indigo-500 shrink-0 fill-current" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {previewLine}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                        {resolveNoteTags(note).map((tg, idx) => (
                          <React.Fragment key={tg}>
                            {idx > 0 && <span aria-hidden="true">·</span>}
                            <span className="text-violet-600 dark:text-violet-400 font-semibold">
                              #{tg}
                            </span>
                          </React.Fragment>
                        ))}
                        <span aria-hidden="true">·</span>
                        <span>{formatShortUpdated(note.updatedAt)}</span>
                        {linkCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-violet-600 dark:text-violet-400 font-semibold">
                              {linkCount} {linkCount === 1 ? 'enlace' : 'enlaces'}
                            </span>
                          </>
                        )}
                        {smart.dates.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-sky-600 dark:text-sky-400 font-semibold">
                              {smart.dates.length} fechas
                            </span>
                          </>
                        )}
                        {smart.finances.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              {smart.finances.length} montos
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateData((prev) => ({
                            ...prev,
                            personalNotes: (prev.personalNotes || []).map((n) =>
                              n.id === note.id ? { ...n, pinned: !n.pinned } : n
                            ),
                          }));
                        }}
                        title={note.pinned ? 'Quitar fijado' : 'Fijar arriba'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          note.pinned
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/12'
                            : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        title="Eliminar nota"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* =================================================================== */
        /* VIEW B: FULL-WIDTH NOTABILITY STUDIO (FIXED DOCK + INK + LINKS)    */
        /* =================================================================== */
        <div className="flex-1 flex flex-col min-h-0">
          {/* ALWAYS-FIXED TOP CHROME & DOCK */}
          <div
            ref={dockRef}
            className="sticky top-0 z-30 shrink-0 space-y-2 pb-2 bg-slate-100/88 dark:bg-[#080b11]/90 backdrop-blur-xl"
          >
            {/* Row 1: Back to Library ("← Notas") + Category + Link to Projects/Tasks/Experiments + Actions */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/88 dark:bg-slate-900/82 border border-slate-200/80 dark:border-white/[0.09] shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    stopDictation();
                    setViewMode('library');
                    setSelectedBoxId(null);
                    setSelectedImageId(null);
                    setOpenPopover(null);
                    setInkTool('text');
                  }}
                  className="h-9 px-3 -ml-1 rounded-xl bg-violet-500/12 hover:bg-violet-500/20 border border-violet-500/30 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>Notas</span>
                  <span className="text-[11px] opacity-75 tabular-nums">({notes.length})</span>
                </button>

                {activeNote && (
                  <>
                    {/* Unified Note Area Tags Trigger */}
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPopover((p) => (p === 'tags' ? null : 'tags'))
                      }
                      className={`h-9 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                        openPopover === 'tags' || resolveNoteTags(activeNote).length > 0
                          ? 'bg-violet-500/12 border-violet-500/30 text-violet-700 dark:text-violet-300'
                          : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                      title="Asignar o crear etiquetas de área para esta nota"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Etiquetas</span>
                      {resolveNoteTags(activeNote).length > 0 && (
                        <span className="tabular-nums text-[11px]">
                          ({resolveNoteTags(activeNote).length})
                        </span>
                      )}
                    </button>

                    {/* Cross-Module Linker Trigger */}
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPopover((p) => (p === 'links' ? null : 'links'))
                      }
                      className={`h-9 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                        openPopover === 'links' || activeLinksSummary.length > 0
                          ? 'bg-violet-500/15 border-violet-500/35 text-violet-700 dark:text-violet-300'
                          : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Enlazar esta nota a Proyectos, Negocios, Tareas o Experimentos"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Enlazar</span>
                      {activeLinksSummary.length > 0 && (
                        <span className="tabular-nums text-[11px]">
                          ({activeLinksSummary.length})
                        </span>
                      )}
                    </button>
                  </>
                )}

                {checklistStats.total > 0 && (
                  <span className="hidden xl:inline text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                    Checklist {checklistStats.done}/{checklistStats.total}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMeetingStudio(true)}
                  title="Procesar Reunión IA / Grabar Audio a Bitácora"
                  className="h-9 px-2.5 rounded-xl bg-violet-500/12 hover:bg-violet-500/20 border border-violet-500/30 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <FileAudio className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Reunión IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDecisionDraft(null);
                    setShowManualDecision(true);
                  }}
                  title="Registrar Bitácora / Decisión estructurada"
                  className="h-9 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-violet-500/12 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Bitácora</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTopicAssistant(true)}
                  title="Asistente IA: resumir esta nota o crear una nueva por tema"
                  className="h-9 px-2.5 rounded-xl bg-violet-500/12 hover:bg-violet-500/20 border border-violet-500/30 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Asistente IA</span>
                </button>

                {activeNote && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportActiveNoteMarkdown}
                      title="Exportar esta nota en Markdown (.md)"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateActiveNote({ pinned: !activeNote.pinned })}
                      title={activeNote.pinned ? 'Quitar fijado' : 'Fijar arriba'}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                        activeNote.pinned
                          ? 'bg-violet-500/15 border-violet-500/35 text-violet-600 dark:text-violet-400'
                          : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Pin className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(activeNote.id)}
                      title="Eliminar nota"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleCreateNote}
                  title="Crear nueva nota"
                  className="h-9 px-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-fuchsia-600/25 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Nueva</span>
                </button>
              </div>
            </div>

            {/* Row 2: ALWAYS-FIXED NOTABILITY TOOL DOCK */}
            {activeNote && (
              <div className="relative">
                <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white/94 dark:bg-slate-900/94 backdrop-blur-2xl border border-slate-200/85 dark:border-white/[0.11] shadow-md overflow-x-auto no-scrollbar">
                  {/* Text Structure */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockKind('h1')}
                    title="Título grande"
                    className={`h-8 px-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                      activeBlockKind === 'h1'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockKind('h2')}
                    title="Subtítulo"
                    className={`h-8 px-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                      activeBlockKind === 'h2'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockKind('paragraph')}
                    title="Texto normal"
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      activeBlockKind === 'paragraph'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Pilcrow className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockKind('checklist')}
                    title="Checklist interactivo"
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      activeBlockKind === 'checklist'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <ListChecks className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockKind('bullet')}
                    title="Lista con viñetas"
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      activeBlockKind === 'bullet'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>

                  <div className="w-px h-5 bg-slate-300 dark:bg-white/12 mx-0.5 shrink-0" />

                  {/* Inline Bold, Italic, Underline, Text Color, Highlight */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyInlineWrapper('**', 'negrita')}
                    title="Negrita (Ctrl/Cmd + B)"
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Bold className="w-3.5 h-3.5 stroke-[2.6]" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyInlineWrapper('*', 'cursiva')}
                    title="Cursiva (Ctrl/Cmd + I)"
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Italic className="w-3.5 h-3.5 stroke-[2.4]" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyInlineWrapper('__', 'subrayado')}
                    title="Subrayado (Ctrl/Cmd + U)"
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Underline className="w-3.5 h-3.5 stroke-[2.4]" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setOpenPopover((p) => (p === 'color' ? null : 'color'))}
                    title="Color del texto"
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      openPopover === 'color'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      setOpenPopover((p) => (p === 'highlight' ? null : 'highlight'))
                    }
                    title="Resaltar texto"
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      openPopover === 'highlight'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setOpenPopover((p) => (p === 'font' ? null : 'font'))}
                    title="Tipografía y tamaño de fuente"
                    className={`h-8 px-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                      openPopover === 'font'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Aa</span>
                  </button>

                  <div className="w-px h-5 bg-slate-300 dark:bg-white/12 mx-0.5 shrink-0" />

                  {/* Apple Pencil / Freehand Ink Toggle */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setOpenPopover(null);
                      setInkTool((prev) => (prev === 'text' ? 'pen' : 'text'));
                    }}
                    title="Modo Apple Pencil / Dibujo libre sobre la hoja"
                    className={`h-8 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                      isDrawingActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                        : 'bg-blue-500/12 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{isDrawingActive ? 'Dibujando' : 'Lápiz'}</span>
                  </button>

                  {/* Voice Dictation Toggle */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={isTranscribingDictation}
                    onClick={handleToggleDictation}
                    title={isDictating ? 'Detener dictado' : 'Dictar por voz en tiempo real'}
                    className={`h-8 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                      isDictating
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-rose-500/12 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {isTranscribingDictation ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isDictating ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isTranscribingDictation
                        ? 'Transcribiendo...'
                        : isDictating
                        ? 'Detener'
                        : 'Dictar'}
                    </span>
                  </button>

                  {/* Embed Image */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => imageInputRef.current?.click()}
                    title="Incrustar imagen movible y redimensionable"
                    className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/12 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Imagen</span>
                  </button>

                  {/* Movable Rectangle & Sticky Note */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleAddFloatingBox('rect')}
                    title="Insertar rectángulo movible"
                    className="h-8 px-2.5 rounded-xl bg-indigo-500/12 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Square className="w-3.5 h-3.5 stroke-[2.3]" />
                    <span className="hidden lg:inline">Rectángulo</span>
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleAddFloatingBox('sticky')}
                    title="Insertar nota adhesiva movible"
                    className="h-8 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <StickyNote className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span className="hidden lg:inline">Nota</span>
                  </button>

                  {/* Paper Style Customization */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setOpenPopover((p) => (p === 'paper' ? null : 'paper'))}
                    title="Personalizar hoja (Puntos, Rayada, Cuadrícula, Cornell, Blanca)"
                    className={`h-8 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                      openPopover === 'paper'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-white/12'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Hoja</span>
                  </button>

                  <div className="w-px h-5 bg-slate-300 dark:bg-white/12 mx-0.5 shrink-0" />

                  {/* Smart Inserts */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      insertSmartSnippet(
                        `${new Date().toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}: `,
                        true
                      )
                    }
                    className="h-8 px-2 rounded-xl bg-sky-500/12 hover:bg-sky-500/20 text-[11px] font-bold text-sky-700 dark:text-sky-300 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    + Fecha
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertSmartSnippet('Gasto de $100 en ', true)}
                    className="h-8 px-2 rounded-xl bg-purple-500/12 hover:bg-purple-500/20 text-[11px] font-bold text-purple-700 dark:text-purple-300 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    + Gasto
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertSmartSnippet('Ingreso de $500 por ', true)}
                    className="h-8 px-2 rounded-xl bg-purple-500/12 hover:bg-purple-500/20 text-[11px] font-bold text-purple-700 dark:text-purple-300 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    + Ingreso
                  </button>
                </div>

                {/* APPLE PENCIL / FREEHAND INK SUB-BAR (Visible when Drawing Mode is Active) */}
                {isDrawingActive && (
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-blue-600/[0.08] dark:bg-blue-500/[0.12] border border-blue-500/30 shadow-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInkTool('pen')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                          inkTool === 'pen'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Pluma</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInkTool('highlighter')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                          inkTool === 'highlighter'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Highlighter className="w-3.5 h-3.5" />
                        <span>Resaltador</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInkTool('eraser')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                          inkTool === 'eraser'
                            ? 'bg-rose-600 text-white'
                            : 'bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Borrador</span>
                      </button>

                      <div className="w-px h-4 bg-blue-500/25 mx-1" />

                      {/* Ink Color Swatches */}
                      <div className="flex items-center gap-1.5">
                        {INK_COLORS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setInkColor(c.id);
                              if (inkTool === 'eraser') setInkTool('pen');
                            }}
                            title={c.label}
                            style={{ backgroundColor: c.id }}
                            className={`w-5 h-5 rounded-full border border-white/60 cursor-pointer transition-transform ${
                              inkColor === c.id ? 'ring-2 ring-blue-500 scale-110' : 'opacity-85'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="w-px h-4 bg-blue-500/25 mx-1" />

                      {/* Stroke Widths */}
                      <div className="flex items-center gap-1">
                        {[
                          { w: 2, label: 'Fino' },
                          { w: 3.5, label: 'Medio' },
                          { w: 6, label: 'Grueso' },
                        ].map((sw) => (
                          <button
                            key={sw.w}
                            type="button"
                            onClick={() => setInkWidth(sw.w)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              inkWidth === sw.w
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                : 'bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {sw.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Palm Rejection Toggle for iPad */}
                      <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pencilOnly}
                          onChange={(e) => setPencilOnly(e.target.checked)}
                          className="accent-blue-600 rounded"
                        />
                        <span>Solo Apple Pencil</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleUndoInkStroke}
                        disabled={activeInkStrokes.length === 0}
                        title="Deshacer último trazo"
                        className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={handleClearAllInk}
                        disabled={activeInkStrokes.length === 0}
                        title="Borrar todos los trazos"
                        className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 text-[11px] font-semibold text-rose-600 dark:text-rose-400 disabled:opacity-40 cursor-pointer"
                      >
                        Limpiar
                      </button>

                      <button
                        type="button"
                        onClick={handleConvertHandwritingToText}
                        disabled={activeInkStrokes.length === 0 || isRunningOcr}
                        title="Convertir escritura manuscrita a texto con IA"
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {isRunningOcr ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3" />
                        )}
                        <span>A texto (IA)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInkTool('text')}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold cursor-pointer"
                      >
                        Volver a texto
                      </button>
                    </div>
                  </div>
                )}

                {/* LIVE DICTATION STATUS BAR */}
                {isDictating && (
                  <div className="mt-1.5 px-3.5 py-2 rounded-2xl bg-rose-500/12 border border-rose-500/35 flex items-center justify-between gap-2 text-xs text-rose-700 dark:text-rose-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mic className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="font-semibold truncate">
                        {dictationInterim || 'Escuchando tu dictado en español... habla con naturalidad'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopDictation}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      Detener
                    </button>
                  </div>
                )}

                {/* POPOVER 1: TEXT COLOR */}
                {openPopover === 'color' && (
                  <div
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute left-4 sm:left-40 top-12 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-2xl z-50 space-y-2 w-60"
                  >
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Color de texto (selecciona texto primero)
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {TEXT_COLOR_SWATCHES.map((sw) => (
                        <button
                          key={sw.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyTextColor(sw.id)}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/12 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${sw.dot}`} />
                          <span className="truncate">{sw.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* POPOVER 2: TEXT HIGHLIGHT */}
                {openPopover === 'highlight' && (
                  <div
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute left-4 sm:left-52 top-12 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-2xl z-50 space-y-2 w-60"
                  >
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Resaltar texto (selecciona texto primero)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {HIGHLIGHT_SWATCHES.map((sw) => (
                        <button
                          key={sw.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyTextHighlight(sw.id)}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/12 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <span className={`w-4 h-3.5 rounded shrink-0 ${sw.dot}`} />
                          <span className="truncate">{sw.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* POPOVER 3: TYPOGRAPHY & FONT SIZE (Aa) */}
                {openPopover === 'font' && (
                  <div
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute left-4 sm:left-56 top-12 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-2xl z-50 space-y-3.5 w-72"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Tipografía y Tamaño
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenPopover(null)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                        Tipo de letra
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {FONT_FAMILIES.map((ff) => (
                          <button
                            key={ff.id}
                            type="button"
                            onClick={() => updateActiveNote({ fontFamily: ff.id })}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                              activeFontFamily === ff.id
                                ? 'border-blue-500 bg-blue-500/12 text-blue-700 dark:text-blue-300 font-bold'
                                : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-blue-400/40'
                            }`}
                          >
                            <span style={{ fontFamily: ff.cssFamily }} className="text-sm">
                              {ff.label}
                            </span>
                            <span
                              style={{ fontFamily: ff.cssFamily }}
                              className="text-base opacity-70"
                            >
                              {ff.sample}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                        Tamaño de fuente
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {FONT_SIZES.map((sz) => (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => updateActiveNote({ fontSize: sz.id })}
                            className={`py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                              activeFontSize === sz.id
                                ? 'border-blue-500 bg-blue-600 text-white'
                                : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-blue-400/50'
                            }`}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* POPOVER 4: PAPER CUSTOMIZATION */}
                {openPopover === 'paper' && (
                  <div className="absolute right-0 top-12 w-full max-w-sm p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-2xl z-50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Personalizar Hoja
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenPopover(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                        Plantilla de papel
                      </span>
                      <div className="grid grid-cols-5 gap-2">
                        {PAPER_STYLES.map((st) => {
                          const isCurrent = activePaperStyle === st.id;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => updateActiveNote({ paperStyle: st.id })}
                              className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer ${
                                isCurrent
                                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50'
                                  : 'border-slate-200 dark:border-white/10 hover:border-blue-400/50'
                              }`}
                            >
                              <div
                                style={getPaperPatternStyle(st.id, activePaperTone, 'mini')}
                                className={`w-full h-10 rounded-lg border ${paperSurface.sheet} shadow-none`}
                              />
                              <span
                                className={`text-[10px] font-semibold ${
                                  isCurrent
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {st.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                        Tono de la hoja
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {PAPER_TONES.map((tn) => {
                          const isCurrent = activePaperTone === tn.id;
                          return (
                            <button
                              key={tn.id}
                              type="button"
                              onClick={() => updateActiveNote({ paperTone: tn.id })}
                              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                isCurrent
                                  ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                  : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-400/50'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full border shrink-0 ${tn.swatchClass}`}
                              />
                              <span className="truncate">{tn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* POPOVER 4.5: CUSTOM AREA TAGS MANAGER */}
                {openPopover === 'tags' && (
                  <div className="absolute left-0 top-12 w-full max-w-sm p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-violet-500/30 shadow-2xl z-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-violet-500" />
                        Etiquetas / Áreas de esta nota
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenPopover(null)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomTagToActiveNote();
                          }
                        }}
                        placeholder="Crear nueva etiqueta (ej: Aprendizaje, Salud...)"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTagToActiveNote}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Añadir
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {allCatalogTags.map((tag) => {
                        const isActive = resolveNoteTags(activeNote).some(
                          (t) => t.toLowerCase() === tag.toLowerCase()
                        );
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleActiveNoteTag(tag)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                              isActive
                                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white border-violet-500 shadow-xs'
                                : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-violet-400/50'
                            }`}
                          >
                            <span>#{tag}</span>
                            {isActive && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* POPOVER 5: LINK NOTE TO PROJECTS, BUSINESSES, TASKS, EXPERIMENTS */}
                {openPopover === 'links' && (
                  <div className="absolute left-0 top-12 w-full max-w-md p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-2xl z-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-violet-500" />
                        Enlazar nota a tus módulos
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenPopover(null)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={linkSearch}
                        onChange={(e) => setLinkSearch(e.target.value)}
                        placeholder="Filtrar proyectos, tareas o experimentos..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                      {/* Projects */}
                      {filteredLinkProjects.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" />
                            Proyectos Multi-Negocio
                          </span>
                          {filteredLinkProjects.map((proj) => {
                            const biz = data.businesses.find((b) => b.id === proj.businessId);
                            const linked = (activeNote.linkedProjectIds || []).includes(proj.id);
                            return (
                              <button
                                key={proj.id}
                                type="button"
                                onClick={() => toggleNoteEntityLink('linkedProjectIds', proj.id)}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                  linked
                                    ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="truncate">
                                  {proj.name}
                                  {biz ? ` · ${biz.name}` : ''}
                                </span>
                                {linked && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Businesses */}
                      {filteredLinkBusinesses.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            Negocios
                          </span>
                          {filteredLinkBusinesses.map((biz) => {
                            const linked = (activeNote.linkedBusinessIds || []).includes(biz.id);
                            return (
                              <button
                                key={biz.id}
                                type="button"
                                onClick={() => toggleNoteEntityLink('linkedBusinessIds', biz.id)}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                  linked
                                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-200 font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="truncate">{biz.name}</span>
                                {linked && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Personal Experiments */}
                      {filteredLinkExperiments.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400 flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" />
                            Experimentos Personales
                          </span>
                          {filteredLinkExperiments.map((ex) => {
                            const linked = (activeNote.linkedExperimentIds || []).includes(ex.id);
                            return (
                              <button
                                key={ex.id}
                                type="button"
                                onClick={() => toggleNoteEntityLink('linkedExperimentIds', ex.id)}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                  linked
                                    ? 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200 font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="truncate">{ex.title}</span>
                                {linked && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Tasks (Personal & Business) */}
                      {filteredLinkTasks.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            Tareas (Personales y Negocio)
                          </span>
                          {filteredLinkTasks.map((tk) => {
                            const linked = (activeNote.linkedTaskIds || []).includes(tk.id);
                            return (
                              <button
                                key={tk.id}
                                type="button"
                                onClick={() => toggleNoteEntityLink('linkedTaskIds', tk.id)}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                  linked
                                    ? 'bg-sky-500/15 text-sky-700 dark:text-sky-200 font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="truncate">{tk.title}</span>
                                {linked && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inline Feedback Toast */}
            {actionToast && (
              <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/35 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{actionToast.text}</span>
                </div>
                {actionToast.targetView && onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(actionToast.targetView!)}
                    className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{actionToast.targetLabel || 'Abrir'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SCROLLABLE NOTABILITY PAPER CANVAS AREA */}
          <div className="flex-1 min-h-0 overflow-y-auto px-1 sm:px-3 pb-10">
            {!activeNote ? (
              <div className="max-w-lg mx-auto my-12 p-8 rounded-3xl bg-white/85 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 text-center space-y-3">
                <NotebookPen className="w-10 h-10 text-violet-500 mx-auto" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Crea tu primera nota o bitácora
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTopicAssistant(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Crear con Asistente IA
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Nueva Nota Libre
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full space-y-4 pt-2">
                {/* THE INTERACTIVE NOTABILITY PAPER SHEET */}
                <div
                  ref={paperCanvasRef}
                  style={{ ...paperPattern, fontFamily: activeFontSpec.cssFamily }}
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelectedBoxId(null);
                      setSelectedImageId(null);
                    }
                  }}
                  onClick={(e) => {
                    if (isDrawingActive) return;
                    if (e.target === e.currentTarget) {
                      const lastIdx = blocks.length - 1;
                      if (lastIdx >= 0 && blocks[lastIdx].body === '') {
                        setPendingFocus({ index: lastIdx, caret: 0 });
                      } else {
                        const next = [
                          ...blocks,
                          { kind: 'paragraph' as BlockKind, checked: false, body: '' },
                        ];
                        commitBlocks(next);
                        setPendingFocus({ index: next.length - 1, caret: 0 });
                      }
                    }
                  }}
                  className={`relative rounded-3xl border min-h-[70vh] transition-colors ${paperSurface.sheet} ${
                    activePaperStyle === 'cornell'
                      ? 'pl-[84px] pr-5 sm:pr-10 py-7 sm:py-9'
                      : 'px-5 sm:px-10 py-7 sm:py-9'
                  }`}
                >
                  {/* Editable Sheet Title */}
                  <div className={`pb-3 mb-3 border-b ${paperSurface.divider} relative z-10`}>
                    <input
                      type="text"
                      value={activeNote.title}
                      onFocus={() => {
                        setSelectedBoxId(null);
                        setSelectedImageId(null);
                      }}
                      onChange={(e) => updateActiveNote({ title: e.target.value })}
                      placeholder="Título de la nota..."
                      className={`w-full bg-transparent text-2xl sm:text-3xl font-extrabold tracking-tight focus:outline-none ${paperSurface.titleInput}`}
                    />

                    {/* Inline Editable Area Tags directly inside the Note */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 font-sans">
                      {resolveNoteTags(activeNote).map((tg) => (
                        <span
                          key={tg}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-500/12 border border-violet-500/25 text-[11px] font-bold text-violet-700 dark:text-violet-300"
                        >
                          <span>#{tg}</span>
                          <button
                            type="button"
                            onClick={() => toggleActiveNoteTag(tg)}
                            title={`Quitar etiqueta ${tg}`}
                            className="hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      {showInlineTagInput ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomTagToActiveNote();
                              } else if (e.key === 'Escape') {
                                setShowInlineTagInput(false);
                                setNewTagInput('');
                              }
                            }}
                            onBlur={() => {
                              if (newTagInput.trim()) {
                                handleAddCustomTagToActiveNote();
                              } else {
                                setShowInlineTagInput(false);
                              }
                            }}
                            placeholder="Ej: Aprendizaje..."
                            className="w-32 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-black/40 border border-violet-500/40 text-[11px] text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowInlineTagInput(true)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/10 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Etiqueta</span>
                        </button>
                      )}
                    </div>

                    {/* Subtle Active Cross-Module Links Strip */}
                    {activeLinksSummary.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] font-sans">
                        <span className={`font-semibold ${paperSurface.muted}`}>Enlazada con:</span>
                        {activeLinksSummary.map((lk) => (
                          <button
                            key={`${lk.kind}_${lk.id}`}
                            type="button"
                            onClick={() => onNavigate?.(lk.targetView)}
                            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                          >
                            <span>{lk.label}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live Real-Time Blocks */}
                  <div
                    className={`space-y-1 relative z-10 ${isDrawingActive ? 'pointer-events-none select-none' : ''}`}
                    onMouseDown={() => {
                      setSelectedBoxId(null);
                      setSelectedImageId(null);
                    }}
                  >
                    {blocks.map((block, idx) => (
                      <LiveEditableBlock
                        key={`${activeNote.id}_${idx}`}
                        block={block}
                        paperTone={activePaperTone}
                        fontSize={activeFontSize}
                        isHandwritingFont={activeFontFamily === 'handwriting'}
                        isFocused={focusedBlockIndex === idx}
                        onFocus={() => setPendingFocus({ index: idx })}
                        onBlur={() => {
                          setFocusedBlockIndex((curr) => (curr === idx ? null : curr));
                        }}
                        onChangeBody={(newBody) => {
                          const next = blocks.map((b, i) =>
                            i === idx ? { ...b, body: newBody } : b
                          );
                          commitBlocks(next);
                        }}
                        onToggleCheck={() => {
                          const next = blocks.map((b, i) =>
                            i === idx ? { ...b, checked: !b.checked } : b
                          );
                          commitBlocks(next);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(idx, e)}
                        onClickDate={openDateModal}
                        onClickFinance={openFinanceModal}
                        registerTextarea={(el) => {
                          textareaRefs.current[idx] = el;
                        }}
                      />
                    ))}

                    <div
                      onClick={() => {
                        setSelectedBoxId(null);
                        setSelectedImageId(null);
                        const next = [
                          ...blocks,
                          { kind: 'paragraph' as BlockKind, checked: false, body: '' },
                        ];
                        commitBlocks(next);
                        setPendingFocus({ index: next.length - 1, caret: 0 });
                      }}
                      className={`pt-6 pb-24 text-xs select-none cursor-text opacity-65 font-sans ${paperSurface.muted}`}
                    >
                      Haz clic aquí para seguir escribiendo...
                    </div>
                  </div>

                  {/* APPLE PENCIL & FREEHAND INK LAYER */}
                  <NoteInkCanvas
                    strokes={activeInkStrokes}
                    activeTool={inkTool}
                    inkColor={inkColor}
                    inkWidth={inkWidth}
                    pencilOnly={pencilOnly}
                    onAddStroke={handleAddInkStroke}
                    onEraseStrokeIds={handleEraseInkStrokeIds}
                  />

                  {/* MOVABLE FLOATING STICKY NOTES, RECTANGLES & EMBEDDED IMAGES LAYER */}
                  {(activeFloatingBoxes.length > 0 || activeEmbeddedImages.length > 0) && (
                    <div
                      className={`pointer-events-none absolute inset-0 z-20 font-sans ${
                        isDrawingActive ? 'opacity-90' : ''
                      }`}
                    >
                      {activeFloatingBoxes.map((box) => (
                        <DraggableNoteBox
                          key={box.id}
                          box={box}
                          isSelected={!isDrawingActive && selectedBoxId === box.id}
                          canvasRef={paperCanvasRef}
                          onSelect={() => handleSelectFloatingBox(box.id)}
                          onUpdate={(patch) => handleUpdateFloatingBox(box.id, patch)}
                          onDuplicate={() => handleDuplicateFloatingBox(box.id)}
                          onDelete={() => handleDeleteFloatingBox(box.id)}
                        />
                      ))}
                      {activeEmbeddedImages.map((img) => (
                        <DraggableEmbeddedImage
                          key={img.id}
                          image={img}
                          isSelected={!isDrawingActive && selectedImageId === img.id}
                          canvasRef={paperCanvasRef}
                          onSelect={() => {
                            setSelectedBoxId(null);
                            setSelectedImageId(img.id);
                          }}
                          onUpdate={(patch) => handleUpdateEmbeddedImage(img.id, patch)}
                          onDuplicate={() => handleDuplicateEmbeddedImage(img.id)}
                          onDelete={() => handleDeleteEmbeddedImage(img.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Detected Smart Links Quick Summary Bar */}
                {(detectedItems.dates.length > 0 || detectedItems.finances.length > 0) && (
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Accesos inteligentes detectados en esta hoja
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Toca cualquier fecha azul o monto morado para agendar o registrar
                      </span>
                    </div>

                    {detectedItems.dates.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1 mr-1">
                          <CalendarPlus className="w-3.5 h-3.5" />
                          Calendario:
                        </span>
                        {detectedItems.dates.slice(0, 8).map((item, idx) => (
                          <button
                            key={`d_${idx}`}
                            type="button"
                            onClick={() => openDateModal(item, item.lineContext)}
                            className="px-2.5 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-xs font-semibold text-sky-700 dark:text-sky-300 underline decoration-sky-500/80 underline-offset-2 cursor-pointer transition-colors"
                          >
                            {item.text}
                          </button>
                        ))}
                      </div>
                    )}

                    {detectedItems.finances.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1 mr-1">
                          <Wallet className="w-3.5 h-3.5" />
                          Finanzas:
                        </span>
                        {detectedItems.finances.slice(0, 8).map((item, idx) => (
                          <button
                            key={`f_${idx}`}
                            type="button"
                            onClick={() => openFinanceModal(item, item.lineContext)}
                            className="px-2.5 py-1 rounded-xl bg-purple-500/12 hover:bg-purple-500/22 border border-purple-500/35 text-xs font-semibold text-purple-700 dark:text-purple-300 underline decoration-purple-500/85 underline-offset-2 cursor-pointer transition-colors tabular-nums"
                          >
                            {item.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Add Date to Calendar */}
      {calendarModal && (
        <div
          className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCalendarModal(null)}
        >
          <form
            onSubmit={handleConfirmCalendarAdd}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <CalendarPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Agregar al Calendario
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Detectado en nota: &quot;{calendarModal.sourceText}&quot;
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título del evento o tarea
                </label>
                <input
                  type="text"
                  required
                  value={calendarModal.title}
                  onChange={(e) =>
                    setCalendarModal({ ...calendarModal, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={calendarModal.date}
                    onChange={(e) =>
                      setCalendarModal({ ...calendarModal, date: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Hora recordatorio
                  </label>
                  <input
                    type="time"
                    value={calendarModal.time}
                    onChange={(e) =>
                      setCalendarModal({ ...calendarModal, time: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calendarModal.addReminder}
                  onChange={(e) =>
                    setCalendarModal({
                      ...calendarModal,
                      addReminder: e.target.checked,
                    })
                  }
                  className="rounded accent-sky-600"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Activar también alerta en Bandeja de Recordatorios
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCalendarModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Guardar en Calendario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Register Expense / Income / Investment */}
      {financeModal && (
        <div
          className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFinanceModal(null)}
        >
          <form
            onSubmit={handleConfirmFinanceAdd}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Registrar en Finanzas Personales
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Detectado en nota: &quot;{financeModal.sourceText}&quot;
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFinanceModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'expense', label: 'Gasto' },
                  { id: 'income', label: 'Ingreso' },
                  { id: 'investment', label: 'Ahorro / Inv.' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFinanceModal({ ...financeModal, type: opt.id })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    financeModal.type === opt.id
                      ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={financeModal.amount}
                    onChange={(e) =>
                      setFinanceModal({ ...financeModal, amount: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={financeModal.date}
                    onChange={(e) =>
                      setFinanceModal({ ...financeModal, date: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  required
                  value={financeModal.description}
                  onChange={(e) =>
                    setFinanceModal({ ...financeModal, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Categoría
                  </label>
                  {financeModal.type === 'expense' ? (
                    <select
                      value={financeModal.category}
                      onChange={(e) =>
                        setFinanceModal({ ...financeModal, category: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                    >
                      {expenseCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={financeModal.category}
                      onChange={(e) =>
                        setFinanceModal({ ...financeModal, category: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                    />
                  )}
                </div>

                {bankAccounts.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Cuenta bancaria
                    </label>
                    <select
                      value={financeModal.bankAccountId}
                      onChange={(e) =>
                        setFinanceModal({
                          ...financeModal,
                          bankAccountId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                    >
                      {bankAccounts.map((ba) => (
                        <option key={ba.id} value={ba.id}>
                          {ba.name} (${ba.currentBalance.toLocaleString('en-US')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFinanceModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Registrar Movimiento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI NOTE ASSISTANT MODAL (Summarize Selected Note + Create Note by Topic) */}
      {showTopicAssistant && (
        <TopicAssistantModal
          data={data}
          initialNoteId={viewMode === 'editor' ? activeNote?.id : undefined}
          onClose={() => setShowTopicAssistant(false)}
          onNoteCreated={handleNoteCreatedByAssistant}
          onAppendSummaryToNote={handleAppendSummaryToNote}
        />
      )}

      {/* MEETING AUDIO / VOICE NOTE PROCESSOR MODAL (Migrated from Dirección & Estrategia) */}
      {showMeetingStudio && (
        <MeetingAudioStudioModal
          data={data}
          initialAction={pendingMeetingAction}
          onClearInitialAction={() => setPendingMeetingAction(null)}
          onClose={() => setShowMeetingStudio(false)}
          onSaveBitacoraNote={handleSaveBitacoraNote}
          onLoadIntoManualDecision={(draft) => {
            setShowMeetingStudio(false);
            setDecisionDraft(draft);
            setShowManualDecision(true);
          }}
        />
      )}

      {/* MANUAL DECISION / BITÁCORA MODAL (Migrated from Dirección & Estrategia) */}
      {showManualDecision && (
        <ManualDecisionModal
          data={data}
          initialDraft={decisionDraft}
          onClose={() => {
            setShowManualDecision(false);
            setDecisionDraft(null);
          }}
          onSaveBitacoraNote={handleSaveBitacoraNote}
        />
      )}
    </div>
  );
};
