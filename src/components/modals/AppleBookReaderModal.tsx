import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  BookBookmark,
  BookHighlight,
  BookItem,
  HighlightColor,
  ReadingGoalState,
  WisdomCapsule,
} from '../../types';
import { PdfBookStorage } from '../../services/pdfBookStorage';
import { extractTextFromPageRect } from '../../utils/pdfUtils';
import { formatReadingTimer, getLocalDateStr } from '../../utils/readingGoal';
import { fetchJsonWithTimeout } from '../../utils/fetchWithTimeout';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  ZoomIn,
  ZoomOut,
  Columns2,
  FileText,
  Sparkles,
  BookOpen,
  List,
  Plus,
  Trash2,
  Quote,
  Highlighter,
  Clock,
  CheckCircle2,
  StickyNote,
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type ReaderTheme = 'light' | 'sepia' | 'calm' | 'night';

interface AppleBookReaderModalProps {
  book: BookItem | null;
  onClose: () => void;
  onUpdateBook: (bookId: string, updater: (book: BookItem) => BookItem) => void;
  onAddWisdomCapsule: (capsule: WisdomCapsule) => void;
  readingGoal?: ReadingGoalState;
  onTrackReadingSeconds?: (deltaSeconds: number) => void;
  backLabel?: string;
}

const THEME_CONFIG: Record<
  ReaderTheme,
  {
    label: string;
    shellBg: string;
    barBg: string;
    text: string;
    muted: string;
    border: string;
    pageShadow: string;
    canvasFilter: string;
    swatch: string;
  }
> = {
  light: {
    label: 'Claro',
    shellBg: 'bg-[#F5F5F7]',
    barBg: 'bg-white/90',
    text: 'text-slate-900',
    muted: 'text-slate-500',
    border: 'border-slate-200/90',
    pageShadow: 'shadow-[0_18px_50px_rgba(15,23,42,0.12)]',
    canvasFilter: 'none',
    swatch: 'bg-white border-slate-300',
  },
  sepia: {
    label: 'Sepia',
    shellBg: 'bg-[#EFE6D5]',
    barBg: 'bg-[#F8F1E3]/95',
    text: 'text-[#3B2F23]',
    muted: 'text-[#7D6B58]',
    border: 'border-[#DFD2BC]',
    pageShadow: 'shadow-[0_18px_50px_rgba(59,47,35,0.16)]',
    canvasFilter: 'sepia(0.28) contrast(0.96) brightness(0.98)',
    swatch: 'bg-[#F4EAD5] border-[#C9B697]',
  },
  calm: {
    label: 'Calma',
    shellBg: 'bg-[#E3E5E8]',
    barBg: 'bg-[#ECEEF0]/95',
    text: 'text-slate-900',
    muted: 'text-slate-600',
    border: 'border-slate-300/80',
    pageShadow: 'shadow-[0_18px_50px_rgba(15,23,42,0.14)]',
    canvasFilter: 'brightness(0.94) contrast(0.95)',
    swatch: 'bg-[#D8DCE1] border-slate-400',
  },
  night: {
    label: 'Noche',
    shellBg: 'bg-[#0F1012]',
    barBg: 'bg-[#18191D]/95',
    text: 'text-slate-100',
    muted: 'text-slate-400',
    border: 'border-white/10',
    pageShadow: 'shadow-[0_22px_60px_rgba(0,0,0,0.65)]',
    canvasFilter: 'invert(0.88) hue-rotate(180deg) contrast(0.95)',
    swatch: 'bg-[#18191D] border-slate-600',
  },
};

const HIGHLIGHT_STYLES: Record<
  HighlightColor,
  { label: string; fill: string; border: string; dot: string; cardAccent: string }
> = {
  yellow: {
    label: 'Amarillo',
    fill: 'bg-amber-300/45',
    border: 'border-amber-400/80',
    dot: 'bg-amber-400',
    cardAccent: 'border-l-amber-400',
  },
  green: {
    label: 'Verde',
    fill: 'bg-emerald-300/40',
    border: 'border-emerald-400/80',
    dot: 'bg-emerald-400',
    cardAccent: 'border-l-emerald-400',
  },
  blue: {
    label: 'Azul',
    fill: 'bg-sky-300/40',
    border: 'border-sky-400/80',
    dot: 'bg-sky-400',
    cardAccent: 'border-l-sky-400',
  },
  pink: {
    label: 'Rosa',
    fill: 'bg-rose-300/40',
    border: 'border-rose-400/80',
    dot: 'bg-rose-400',
    cardAccent: 'border-l-rose-400',
  },
};

interface DragDraft {
  pageNum: number;
  startX: number;
  startY: number;
  currX: number;
  currY: number;
}

export const AppleBookReaderModal: React.FC<AppleBookReaderModalProps> = ({
  book,
  onClose,
  onUpdateBook,
  onAddWisdomCapsule,
  readingGoal,
  onTrackReadingSeconds,
  backLabel = 'Volver',
}) => {
  const [theme, setTheme] = useState<ReaderTheme>('sepia');
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(book?.totalPages || 1);
  const [currentPage, setCurrentPage] = useState<number>(Math.max(1, book?.currentPage || 1));
  const [zoom, setZoom] = useState<number>(1.0);
  const [twoPageSpread, setTwoPageSpread] = useState<boolean>(false);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);

  // Highlighting state
  const [highlightMode, setHighlightMode] = useState<boolean>(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState<HighlightColor>('yellow');
  const [dragDraft, setDragDraft] = useState<DragDraft | null>(null);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');
  const [editingQuoteText, setEditingQuoteText] = useState<string>('');

  // Side panel: highlights, notes, bookmarks
  const [sideTab, setSideTab] = useState<'none' | 'highlights' | 'notes' | 'bookmarks'>('none');
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [synthesizingPage, setSynthesizingPage] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null);

  // Live reading timer (tracks session seconds & flushes to store)
  const [unflushedSeconds, setUnflushedSeconds] = useState(0);
  const unflushedRef = useRef(0);
  const goalToastShownRef = useRef(false);
  const [goalReachedBanner, setGoalReachedBanner] = useState(false);

  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const themeStyle = THEME_CONFIG[theme];
  const bookmarks: BookBookmark[] = book?.bookmarks || [];
  const highlights: BookHighlight[] = book?.highlights || [];
  const isCurrentBookmarked = bookmarks.some((bm) => bm.page === currentPage);

  const todayKey = getLocalDateStr();
  const storedTodaySeconds = readingGoal?.dailySecondsByDate?.[todayKey] || 0;
  const liveTodaySeconds = storedTodaySeconds + unflushedSeconds;
  const dailyTargetMinutes = readingGoal?.dailyTargetMinutes || 15;
  const dailyTargetSeconds = Math.max(60, dailyTargetMinutes * 60);
  const isDailyGoalMet = liveTodaySeconds >= dailyTargetSeconds;

  // Keep ref to latest flush callback so cleanup always flushes cleanly
  const trackFnRef = useRef(onTrackReadingSeconds);
  trackFnRef.current = onTrackReadingSeconds;

  const flushReadingSeconds = useCallback(() => {
    const pending = unflushedRef.current;
    if (pending > 0 && trackFnRef.current) {
      unflushedRef.current = 0;
      setUnflushedSeconds(0);
      trackFnRef.current(pending);
    }
  }, []);

  // Track live reading seconds while reader modal is open and tab is visible
  useEffect(() => {
    if (!book || !onTrackReadingSeconds) return;
    goalToastShownRef.current = storedTodaySeconds >= dailyTargetSeconds;

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      unflushedRef.current += 1;
      setUnflushedSeconds(unflushedRef.current);

      if (unflushedRef.current >= 5) {
        flushReadingSeconds();
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
      flushReadingSeconds();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id, Boolean(onTrackReadingSeconds)]);

  // Celebrate + flush immediately the moment today's reading target is met
  useEffect(() => {
    if (!book || !onTrackReadingSeconds) return;
    if (isDailyGoalMet && !goalToastShownRef.current) {
      goalToastShownRef.current = true;
      flushReadingSeconds();
      setGoalReachedBanner(true);
      const t = window.setTimeout(() => setGoalReachedBanner(false), 6000);
      return () => window.clearTimeout(t);
    }
  }, [isDailyGoalMet, book, onTrackReadingSeconds, flushReadingSeconds]);

  // Load PDF binary from IndexedDB
  useEffect(() => {
    if (!book) return;
    let cancelled = false;
    let activeLoadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;

    const load = async () => {
      setLoadingPdf(true);
      setLoadError(null);
      setPdfDoc(null);
      setSelectedHighlightId(null);
      try {
        const buffer = await PdfBookStorage.getPdf(book.id);
        if (!buffer) {
          throw new Error(
            'Este libro aún no tiene un archivo PDF cargado en este navegador. Sube el archivo PDF desde la Biblioteca para leerlo.'
          );
        }
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        activeLoadingTask = loadingTask;
        const doc = await loadingTask.promise;
        if (cancelled) {
          void loadingTask.destroy();
          return;
        }
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        const startPage = Math.min(doc.numPages, Math.max(1, book.currentPage || 1));
        setCurrentPage(startPage);

        // Sync true PDF page count back into BookItem
        onUpdateBook(book.id, (prev) => ({
          ...prev,
          totalPages: doc.numPages,
          currentPage: startPage,
          status: startPage >= doc.numPages ? 'completed' : 'reading',
          completedYear: startPage >= doc.numPages ? new Date().getFullYear() : prev.completedYear,
          lastReadAt: new Date().toISOString(),
        }));
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'No se pudo abrir el archivo PDF.');
        }
      } finally {
        if (!cancelled) setLoadingPdf(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (activeLoadingTask) {
        void activeLoadingTask.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id]);

  // Render page(s) to canvas with crisp HiDPI scaling
  const renderPageToCanvas = useCallback(
    async (
      doc: pdfjsLib.PDFDocumentProxy,
      pageNum: number,
      canvas: HTMLCanvasElement,
      availableWidth: number,
      availableHeight: number
    ) => {
      const page = await doc.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const fitScaleW = availableWidth / baseViewport.width;
      const fitScaleH = availableHeight / baseViewport.height;
      const baseScale = Math.min(fitScaleW, fitScaleH) * zoom;
      const clampedScale = Math.max(0.45, Math.min(3.0, baseScale));

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: clampedScale * dpr });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
        canvas,
      }).promise;
    },
    [zoom]
  );

  useEffect(() => {
    if (!pdfDoc || !stageRef.current || !leftCanvasRef.current) return;
    let active = true;

    const draw = async () => {
      setRendering(true);
      try {
        const rect = stageRef.current!.getBoundingClientRect();
        const isDesktopWide = rect.width >= 960;
        const useSpread = twoPageSpread && isDesktopWide && currentPage + 1 <= pdfDoc.numPages;

        const padX = useSpread ? 64 : 40;
        const padY = 36;
        const availW = useSpread ? (rect.width - padX) / 2 : rect.width - padX;
        const availH = Math.max(320, rect.height - padY);

        await renderPageToCanvas(pdfDoc, currentPage, leftCanvasRef.current!, availW, availH);
        if (active && useSpread && rightCanvasRef.current) {
          await renderPageToCanvas(pdfDoc, currentPage + 1, rightCanvasRef.current, availW, availH);
        }
      } catch (err) {
        console.error('Error rendering PDF page:', err);
      } finally {
        if (active) setRendering(false);
      }
    };

    draw();
    return () => {
      active = false;
    };
  }, [pdfDoc, currentPage, zoom, twoPageSpread, sideTab, renderPageToCanvas]);

  const goToPage = useCallback(
    (target: number) => {
      if (!book) return;
      const clamped = Math.min(totalPages, Math.max(1, target));
      setCurrentPage(clamped);
      onUpdateBook(book.id, (prev) => ({
        ...prev,
        currentPage: clamped,
        totalPages,
        status: clamped >= totalPages ? 'completed' : 'reading',
        completedYear: clamped >= totalPages ? new Date().getFullYear() : prev.completedYear,
        lastReadAt: new Date().toISOString(),
      }));
    },
    [book, totalPages, onUpdateBook]
  );

  const stepSize = twoPageSpread && typeof window !== 'undefined' && window.innerWidth >= 960 ? 2 : 1;

  // Keyboard navigation (ArrowLeft / ArrowRight / Escape)
  useEffect(() => {
    if (!book) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        flushReadingSeconds();
        onClose();
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToPage(currentPage + stepSize);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPage(currentPage - stepSize);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [book, currentPage, stepSize, goToPage, onClose, flushReadingSeconds]);

  if (!book) return null;

  const progressPercent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const selectedHighlight = highlights.find((h) => h.id === selectedHighlightId) || null;

  const handleCloseReader = () => {
    flushReadingSeconds();
    onClose();
  };

  const handleToggleBookmark = () => {
    onUpdateBook(book.id, (prev) => {
      const existing = prev.bookmarks || [];
      const has = existing.some((b) => b.page === currentPage);
      const next = has
        ? existing.filter((b) => b.page !== currentPage)
        : [
            {
              page: currentPage,
              label: `Página ${currentPage}`,
              createdAt: new Date().toISOString(),
            },
            ...existing,
          ].sort((a, b) => a.page - b.page);
      return { ...prev, bookmarks: next };
    });
  };

  // Highlight pointer drawing handlers
  const handlePagePointerDown = (e: React.PointerEvent<HTMLDivElement>, pageNum: number) => {
    if (!highlightMode) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setDragDraft({ pageNum, startX: x, startY: y, currX: x, currY: y });
  };

  const handlePagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragDraft) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setDragDraft((prev) => (prev ? { ...prev, currX: x, currY: y } : null));
  };

  const handlePagePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragDraft || !book) return;
    const finished = dragDraft;
    setDragDraft(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const x = Math.min(finished.startX, finished.currX);
    const y = Math.min(finished.startY, finished.currY);
    const width = Math.abs(finished.currX - finished.startX);
    const height = Math.abs(finished.currY - finished.startY);

    // Ignore accidental tiny taps (< 1.2% width or < 0.8% height)
    if (width < 0.015 || height < 0.008) return;

    let extractedQuote = '';
    if (pdfDoc) {
      try {
        const page = await pdfDoc.getPage(finished.pageNum);
        extractedQuote = await extractTextFromPageRect(page, { x, y, width, height });
      } catch {
        extractedQuote = '';
      }
    }

    const newHighlight: BookHighlight = {
      id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      page: finished.pageNum,
      x,
      y,
      width,
      height,
      color: activeHighlightColor,
      quote: extractedQuote || undefined,
      note: '',
      createdAt: new Date().toISOString(),
    };

    onUpdateBook(book.id, (prev) => ({
      ...prev,
      highlights: [newHighlight, ...(prev.highlights || [])],
    }));

    setSelectedHighlightId(newHighlight.id);
    setEditingQuoteText(extractedQuote);
    setEditingNoteText('');
    setSideTab('highlights');
  };

  const handleSelectHighlight = (hl: BookHighlight) => {
    setSelectedHighlightId(hl.id);
    setEditingQuoteText(hl.quote || '');
    setEditingNoteText(hl.note || '');
    setSideTab('highlights');
    if (hl.page !== currentPage) {
      goToPage(hl.page);
    }
  };

  const handleUpdateSelectedHighlight = (
    patch: Partial<Pick<BookHighlight, 'note' | 'quote' | 'color'>>
  ) => {
    if (!selectedHighlightId) return;
    onUpdateBook(book.id, (prev) => ({
      ...prev,
      highlights: (prev.highlights || []).map((h) =>
        h.id === selectedHighlightId ? { ...h, ...patch } : h
      ),
    }));
  };

  const handleDeleteHighlight = (hlId: string) => {
    onUpdateBook(book.id, (prev) => ({
      ...prev,
      highlights: (prev.highlights || []).filter((h) => h.id !== hlId),
    }));
    if (selectedHighlightId === hlId) {
      setSelectedHighlightId(null);
      setEditingNoteText('');
      setEditingQuoteText('');
    }
  };

  const handleSaveQuoteAndNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim() && !newNoteText.trim()) return;
    onUpdateBook(book.id, (prev) => ({
      ...prev,
      quotes: newQuoteText.trim()
        ? [{ text: newQuoteText.trim(), page: `Pág. ${currentPage}` }, ...(prev.quotes || [])]
        : prev.quotes || [],
      notes: newNoteText.trim()
        ? [`[Pág. ${currentPage}] ${newNoteText.trim()}`, ...(prev.notes || [])]
        : prev.notes || [],
    }));
    setNewQuoteText('');
    setNewNoteText('');
  };

  const handleSynthesizeText = async (excerpt: string, pageNum: number) => {
    if (synthesizingPage) return;
    setSynthesizingPage(true);
    setAiStatusMsg(null);
    try {
      const { ok, status, data: json } = await fetchJsonWithTimeout<{ capsule?: any; error?: string }>(
        '/api/gemini/wisdom',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookTitle: book.title,
            author: book.author,
            chapter: `Página ${pageNum} de ${totalPages}`,
            pageRef: `Pág. ${pageNum}`,
            excerpt: excerpt.slice(0, 6000),
          }),
        }
      );
      if (!ok) {
        throw new Error(json.error || `Error IA (${status}) al sintetizar.`);
      }
      if (json.capsule) {
        onAddWisdomCapsule({
          id: `capsule_pdf_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          bookTitle: json.capsule.bookTitle || book.title,
          author: json.capsule.author || book.author,
          chapter: json.capsule.chapter || `Página ${pageNum}`,
          coreIdea: json.capsule.coreIdea,
          quote: json.capsule.quote,
          pageRef: json.capsule.pageRef || `Pág. ${pageNum}`,
          aiInterpretation: json.capsule.aiInterpretation,
          personalApplication: json.capsule.personalApplication,
          businessApplication: json.capsule.businessApplication,
          practicalAction: json.capsule.practicalAction,
          isFavorite: true,
        });
        setAiStatusMsg(`Cápsula de Sabiduría creada desde la Página ${pageNum}.`);
      }
    } catch (err: unknown) {
      setAiStatusMsg(err instanceof Error ? err.message : 'Error al analizar con IA.');
    } finally {
      setSynthesizingPage(false);
    }
  };

  const handleSynthesizeCurrentPage = async () => {
    if (!pdfDoc || synthesizingPage) return;
    setSynthesizingPage(true);
    setAiStatusMsg(null);
    try {
      const page = await pdfDoc.getPage(currentPage);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!pageText || pageText.length < 25) {
        setSynthesizingPage(false);
        setAiStatusMsg(
          'Esta página parece ser una imagen escaneada sin texto seleccionable. Puedes subrayarla y escribir tu nota manualmente.'
        );
        return;
      }
      setSynthesizingPage(false);
      await handleSynthesizeText(pageText, currentPage);
    } catch (err: unknown) {
      setSynthesizingPage(false);
      setAiStatusMsg(err instanceof Error ? err.message : 'Error al leer el texto de la página.');
    }
  };

  const renderHighlightLayer = (pageNum: number) => {
    const pageHighlights = highlights.filter((h) => h.page === pageNum);
    const activeDraft = dragDraft && dragDraft.pageNum === pageNum ? dragDraft : null;

    return (
      <div
        onPointerDown={(e) => handlePagePointerDown(e, pageNum)}
        onPointerMove={handlePagePointerMove}
        onPointerUp={handlePagePointerUp}
        className={`absolute inset-0 z-10 ${
          highlightMode ? 'cursor-crosshair touch-none' : 'pointer-events-none'
        }`}
      >
        {pageHighlights.map((hl) => {
          const style = HIGHLIGHT_STYLES[hl.color] || HIGHLIGHT_STYLES.yellow;
          const isSelected = hl.id === selectedHighlightId;
          return (
            <button
              key={hl.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectHighlight(hl);
              }}
              style={{
                left: `${hl.x * 100}%`,
                top: `${hl.y * 100}%`,
                width: `${hl.width * 100}%`,
                height: `${hl.height * 100}%`,
              }}
              title={hl.note || hl.quote || 'Subrayado — clic para agregar nota'}
              className={`pointer-events-auto absolute rounded-[3px] border transition-all cursor-pointer mix-blend-multiply ${
                style.fill
              } ${isSelected ? `ring-2 ring-amber-500 ${style.border}` : 'border-transparent hover:border-black/30'}`}
            >
              {hl.note && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <StickyNote className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          );
        })}

        {activeDraft && (
          <div
            style={{
              left: `${Math.min(activeDraft.startX, activeDraft.currX) * 100}%`,
              top: `${Math.min(activeDraft.startY, activeDraft.currY) * 100}%`,
              width: `${Math.abs(activeDraft.currX - activeDraft.startX) * 100}%`,
              height: `${Math.abs(activeDraft.currY - activeDraft.startY) * 100}%`,
            }}
            className={`absolute rounded-[3px] border-2 border-dashed pointer-events-none mix-blend-multiply ${
              HIGHLIGHT_STYLES[activeHighlightColor].fill
            } ${HIGHLIGHT_STYLES[activeHighlightColor].border}`}
          />
        )}
      </div>
    );
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex flex-col ${themeStyle.shellBg} ${themeStyle.text} transition-colors duration-200`}
    >
      {/* Apple Books Top Toolbar */}
      <header
        className={`min-h-14 px-3 sm:px-5 py-1.5 border-b ${themeStyle.border} ${themeStyle.barBg} backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 shrink-0`}
      >
        {/* Left: Back + Title + Live Reading Goal Pill */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={handleCloseReader}
            className="px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
          <div className="min-w-0 max-w-[160px] sm:max-w-[240px]">
            <h2 className="text-xs sm:text-sm font-bold truncate leading-tight">{book.title}</h2>
            <p className={`text-[10px] truncate ${themeStyle.muted}`}>{book.author}</p>
          </div>

          {onTrackReadingSeconds && (
            <div
              title={`Lectura de hoy: ${formatReadingTimer(liveTodaySeconds)} de tu objetivo diario de ${dailyTargetMinutes} min`}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums border shrink-0 ${
                isDailyGoalMet
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/12 border-amber-500/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isDailyGoalMet ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>
                {formatReadingTimer(liveTodaySeconds)} / {dailyTargetMinutes} min
              </span>
            </div>
          )}
        </div>

        {/* Center/Right: Highlight Tool, Paper Themes, Spread, Zoom, Bookmarks, AI */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Highlight Mode Toggle + 4 Color Swatches */}
          <div
            className={`flex items-center gap-1 px-1.5 py-1 rounded-xl border transition-colors ${
              highlightMode
                ? 'bg-amber-500/20 border-amber-500/50'
                : 'border-black/10 dark:border-white/10'
            }`}
          >
            <button
              type="button"
              onClick={() => setHighlightMode((v) => !v)}
              title={
                highlightMode
                  ? 'Desactivar subrayador (volver a pasar página al tocar)'
                  : 'Activar subrayador — arrastra sobre el PDF para subrayar y tomar nota'
              }
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                highlightMode
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{highlightMode ? 'Subrayando' : 'Subrayar'}</span>
            </button>
            <div className="flex items-center gap-1 pl-0.5">
              {(Object.keys(HIGHLIGHT_STYLES) as HighlightColor[]).map((cKey) => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => {
                    setActiveHighlightColor(cKey);
                    setHighlightMode(true);
                  }}
                  title={`Subrayador ${HIGHLIGHT_STYLES[cKey].label}`}
                  className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                    HIGHLIGHT_STYLES[cKey].dot
                  } ${
                    activeHighlightColor === cKey && highlightMode
                      ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white scale-110'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 4 Apple Books Paper Themes */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-xl border border-black/10 dark:border-white/10">
            {(Object.keys(THEME_CONFIG) as ReaderTheme[]).map((tKey) => (
              <button
                key={tKey}
                type="button"
                onClick={() => setTheme(tKey)}
                title={`Tema ${THEME_CONFIG[tKey].label}`}
                className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                  THEME_CONFIG[tKey].swatch
                } ${theme === tKey ? 'ring-2 ring-amber-500 scale-110' : 'opacity-80 hover:opacity-100'}`}
              />
            ))}
          </div>

          {/* Compact theme cycle for mobile/tablet */}
          <button
            type="button"
            onClick={() => {
              const order: ReaderTheme[] = ['light', 'sepia', 'calm', 'night'];
              setTheme(order[(order.indexOf(theme) + 1) % order.length]);
            }}
            className="lg:hidden px-2 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-[10px] font-bold cursor-pointer"
            title="Cambiar tema de lectura"
          >
            {themeStyle.label}
          </button>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-0.5 border border-black/10 dark:border-white/10 rounded-xl px-1 py-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold tabular-nums w-9 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.9, Number((z + 0.15).toFixed(2))))}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2-Page Spread toggle (Desktop) */}
          <button
            type="button"
            onClick={() => setTwoPageSpread((v) => !v)}
            title={twoPageSpread ? 'Vista de 1 página' : 'Vista libro abierto (2 páginas)'}
            className={`hidden xl:flex p-2 rounded-xl border transition-colors cursor-pointer ${
              twoPageSpread
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            {twoPageSpread ? <Columns2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </button>

          {/* AI Synthesize Current Page */}
          <button
            type="button"
            disabled={synthesizingPage || !pdfDoc}
            onClick={handleSynthesizeCurrentPage}
            title="Sintetizar la página actual con Gemini IA"
            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${synthesizingPage ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">
              {synthesizingPage ? 'Sintetizando...' : 'Cápsula IA'}
            </span>
          </button>

          {/* Bookmark Current Page */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            title={isCurrentBookmarked ? 'Quitar marcador' : 'Marcar esta página'}
            className={`p-2 rounded-xl cursor-pointer transition-colors ${
              isCurrentBookmarked
                ? 'text-rose-500 bg-rose-500/15'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            {isCurrentBookmarked ? (
              <BookmarkCheck className="w-4 h-4 fill-current" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          {/* Drawer Toggle (Subrayados, Notas y Marcadores) */}
          <button
            type="button"
            onClick={() => setSideTab((prev) => (prev === 'none' ? 'highlights' : 'none'))}
            title="Subrayados, Notas y Marcadores"
            className={`p-2 rounded-xl cursor-pointer transition-colors relative ${
              sideTab !== 'none'
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <List className="w-4 h-4" />
            {highlights.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-amber-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                {highlights.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Highlight Mode Hint Bar */}
      {highlightMode && (
        <div className="px-4 py-1.5 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between gap-2 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5">
            <Highlighter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Modo Subrayador activo ({HIGHLIGHT_STYLES[activeHighlightColor].label}): arrastra sobre cualquier fragmento del PDF para subrayarlo y añadir notas.
          </span>
          <button
            type="button"
            onClick={() => setHighlightMode(false)}
            className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold cursor-pointer shrink-0"
          >
            Listo
          </button>
        </div>
      )}

      {/* Daily Reading Goal Achieved Banner */}
      {goalReachedBanner && (
        <div className="px-4 py-2 bg-emerald-500/20 border-b border-emerald-500/35 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ¡Objetivo diario de lectura cumplido ({dailyTargetMinutes} min)! Tu hábito de lectura se marcó automáticamente como completado hoy.
          </span>
          <button type="button" onClick={() => setGoalReachedBanner(false)} className="cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* AI Notification Toast inside Reader */}
      {aiStatusMsg && (
        <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between text-xs font-semibold">
          <span>{aiStatusMsg}</span>
          <button type="button" onClick={() => setAiStatusMsg(null)} className="cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Reader Stage + Optional Apple Books Sidebar */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Page Viewport */}
        <div
          ref={stageRef}
          className="flex-1 min-w-0 relative flex items-center justify-center overflow-auto p-3 sm:p-6 select-none"
        >
          {/* Left Page Turn Button */}
          {pdfDoc && currentPage > 1 && (
            <button
              type="button"
              onClick={() => goToPage(currentPage - stepSize)}
              aria-label="Página anterior"
              className="fixed sm:absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-14 rounded-2xl bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {loadingPdf ? (
            <div className="flex flex-col items-center gap-3 text-center p-8">
              <BookOpen className="w-8 h-8 text-amber-500 animate-pulse" />
              <p className="text-sm font-semibold">Abriendo libro en modo lectura...</p>
            </div>
          ) : loadError ? (
            <div className="max-w-md p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-center space-y-3">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-300">{loadError}</p>
              <button
                type="button"
                onClick={handleCloseReader}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer"
              >
                {backLabel}
              </button>
            </div>
          ) : (
            <div
              className={`flex items-center justify-center transition-opacity duration-150 ${
                rendering ? 'opacity-80' : 'opacity-100'
              }`}
            >
              {/* Page 1 (or single page) */}
              <div
                onClick={(e) => {
                  if (highlightMode) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = (e.clientX - rect.left) / rect.width;
                  if (relX < 0.25) goToPage(currentPage - stepSize);
                  else if (relX > 0.75) goToPage(currentPage + stepSize);
                }}
                className={`relative rounded-md overflow-hidden bg-white ${themeStyle.pageShadow} ${
                  highlightMode ? '' : 'cursor-pointer'
                }`}
              >
                <canvas
                  ref={leftCanvasRef}
                  style={{ filter: themeStyle.canvasFilter }}
                  className="block"
                />
                {renderHighlightLayer(currentPage)}
                {isCurrentBookmarked && (
                  <div className="absolute top-0 right-4 w-4 h-7 bg-rose-500 shadow-md rounded-b-sm z-20 pointer-events-none" />
                )}
              </div>

              {/* Optional Right Page for Open-Book Spread */}
              {twoPageSpread && currentPage + 1 <= totalPages && (
                <div
                  onClick={() => {
                    if (highlightMode) return;
                    goToPage(currentPage + stepSize);
                  }}
                  className={`hidden lg:block relative rounded-r-md overflow-hidden bg-white border-l border-black/15 ${themeStyle.pageShadow} ${
                    highlightMode ? '' : 'cursor-pointer'
                  }`}
                >
                  <canvas
                    ref={rightCanvasRef}
                    style={{ filter: themeStyle.canvasFilter }}
                    className="block"
                  />
                  {renderHighlightLayer(currentPage + 1)}
                </div>
              )}
            </div>
          )}

          {/* Right Page Turn Button */}
          {pdfDoc && currentPage < totalPages && (
            <button
              type="button"
              onClick={() => goToPage(currentPage + stepSize)}
              aria-label="Página siguiente"
              className="fixed sm:absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-14 rounded-2xl bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Slide-Over Panel: Subrayados, Notas & Marcadores */}
        {sideTab !== 'none' && (
          <aside
            className={`w-80 sm:w-96 max-w-[90vw] border-l ${themeStyle.border} ${themeStyle.barBg} backdrop-blur-xl flex flex-col shrink-0 z-30`}
          >
            <div className={`p-2.5 border-b ${themeStyle.border} grid grid-cols-3 gap-1`}>
              <button
                type="button"
                onClick={() => setSideTab('highlights')}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold cursor-pointer truncate ${
                  sideTab === 'highlights' ? 'bg-amber-500 text-white' : `${themeStyle.muted}`
                }`}
              >
                Subrayados ({highlights.length})
              </button>
              <button
                type="button"
                onClick={() => setSideTab('notes')}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold cursor-pointer truncate ${
                  sideTab === 'notes' ? 'bg-amber-500 text-white' : `${themeStyle.muted}`
                }`}
              >
                Notas ({(book.notes?.length || 0) + (book.quotes?.length || 0)})
              </button>
              <button
                type="button"
                onClick={() => setSideTab('bookmarks')}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold cursor-pointer truncate ${
                  sideTab === 'bookmarks' ? 'bg-amber-500 text-white' : `${themeStyle.muted}`
                }`}
              >
                Marcas ({bookmarks.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {sideTab === 'highlights' && (
                <>
                  {/* Active Highlight Editor */}
                  {selectedHighlight && (
                    <div
                      className={`p-3 rounded-2xl border-2 border-amber-500/45 bg-amber-500/10 space-y-2.5`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                          Editando subrayado · Pág. {selectedHighlight.page}
                        </span>
                        <div className="flex items-center gap-1">
                          {(Object.keys(HIGHLIGHT_STYLES) as HighlightColor[]).map((cKey) => (
                            <button
                              key={cKey}
                              type="button"
                              onClick={() => handleUpdateSelectedHighlight({ color: cKey })}
                              className={`w-3.5 h-3.5 rounded-full cursor-pointer ${
                                HIGHLIGHT_STYLES[cKey].dot
                              } ${selectedHighlight.color === cKey ? 'ring-2 ring-slate-900 dark:ring-white' : 'opacity-65'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase ${themeStyle.muted}`}>
                          Texto subrayado
                        </label>
                        <textarea
                          rows={2}
                          value={editingQuoteText}
                          onChange={(e) => {
                            setEditingQuoteText(e.target.value);
                            handleUpdateSelectedHighlight({ quote: e.target.value });
                          }}
                          placeholder="Texto extraído del PDF (puedes editarlo o escribirlo si el PDF es escaneado)..."
                          className="w-full rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-2 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase ${themeStyle.muted}`}>
                          Tu nota personal
                        </label>
                        <textarea
                          rows={3}
                          value={editingNoteText}
                          onChange={(e) => {
                            setEditingNoteText(e.target.value);
                            handleUpdateSelectedHighlight({ note: e.target.value });
                          }}
                          placeholder="Escribe aquí tu reflexión, idea o aplicación sobre este subrayado..."
                          className="w-full rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-2 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          disabled={synthesizingPage || (!editingQuoteText.trim() && !editingNoteText.trim())}
                          onClick={() =>
                            handleSynthesizeText(
                              `${editingQuoteText}\n${editingNoteText}`.trim(),
                              selectedHighlight.page
                            )
                          }
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Crear Cápsula IA</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHighlight(selectedHighlight.id)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/15 cursor-pointer"
                          title="Eliminar subrayado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {highlights.length === 0 ? (
                    <div className="text-center py-8 px-3 space-y-2.5">
                      <Highlighter className="w-7 h-7 text-amber-500 mx-auto opacity-80" />
                      <p className={`text-xs leading-relaxed ${themeStyle.muted}`}>
                        Activa el botón <strong>Subrayar</strong> en la barra superior y arrastra sobre cualquier párrafo del PDF para resaltarlo y agregar notas.
                      </p>
                      <button
                        type="button"
                        onClick={() => setHighlightMode(true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Activar Subrayador
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {highlights.map((hl) => {
                        const style = HIGHLIGHT_STYLES[hl.color] || HIGHLIGHT_STYLES.yellow;
                        const isSel = hl.id === selectedHighlightId;
                        return (
                          <div
                            key={hl.id}
                            onClick={() => handleSelectHighlight(hl)}
                            className={`p-3 rounded-xl border border-l-4 ${style.cardAccent} ${
                              isSel
                                ? 'border-amber-500/60 bg-amber-500/10'
                                : `${themeStyle.border} hover:border-amber-500/40`
                            } cursor-pointer space-y-1.5 transition-all`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                Página {hl.page}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHighlight(hl.id);
                                }}
                                className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {hl.quote ? (
                              <p className="text-xs italic leading-relaxed line-clamp-3">
                                &ldquo;{hl.quote}&rdquo;
                              </p>
                            ) : (
                              <p className={`text-[11px] italic ${themeStyle.muted}`}>
                                Fragmento subrayado en pág. {hl.page}
                              </p>
                            )}
                            {hl.note && (
                              <p className="text-xs font-medium pt-1 border-t border-black/10 dark:border-white/10">
                                {hl.note}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {sideTab === 'bookmarks' && (
                bookmarks.length === 0 ? (
                  <p className={`text-xs text-center py-8 ${themeStyle.muted}`}>
                    Aún no tienes marcadores. Pulsa el ícono de marcador en la barra superior para guardar tu página actual.
                  </p>
                ) : (
                  bookmarks.map((bm) => (
                    <div
                      key={bm.page}
                      className={`p-3 rounded-xl border ${themeStyle.border} flex items-center justify-between gap-2`}
                    >
                      <button
                        type="button"
                        onClick={() => goToPage(bm.page)}
                        className="text-left flex-1 cursor-pointer"
                      >
                        <span className="text-xs font-bold block">Página {bm.page}</span>
                        <span className={`text-[10px] ${themeStyle.muted}`}>
                          {Math.round((bm.page / totalPages) * 100)}% del libro
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateBook(book.id, (prev) => ({
                            ...prev,
                            bookmarks: (prev.bookmarks || []).filter((x) => x.page !== bm.page),
                          }))
                        }
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )
              )}

              {sideTab === 'notes' && (
                <>
                  <form
                    onSubmit={handleSaveQuoteAndNote}
                    className="space-y-2 pb-3 border-b border-black/10 dark:border-white/10"
                  >
                    <span className="text-[11px] font-bold block">
                      Guardar en Página {currentPage}
                    </span>
                    <textarea
                      rows={2}
                      placeholder="Cita destacada de esta página..."
                      value={newQuoteText}
                      onChange={(e) => setNewQuoteText(e.target.value)}
                      className="w-full rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <textarea
                      rows={2}
                      placeholder="Tu reflexión o aplicación práctica..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Guardar Nota / Cita
                    </button>
                  </form>

                  <div className="space-y-2.5">
                    {(book.quotes || []).map((q, idx) => (
                      <div key={`q_${idx}`} className={`p-3 rounded-xl border ${themeStyle.border} space-y-1`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <Quote className="w-3 h-3" />
                          <span>{q.page || 'Cita'}</span>
                        </div>
                        <p className="text-xs italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                      </div>
                    ))}
                    {(book.notes || []).map((n, idx) => (
                      <div key={`n_${idx}`} className={`p-3 rounded-xl border ${themeStyle.border}`}>
                        <p className="text-xs leading-relaxed">{n}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Apple Books Bottom Scrubber Bar */}
      <footer
        className={`h-14 px-4 sm:px-6 border-t ${themeStyle.border} ${themeStyle.barBg} backdrop-blur-xl flex items-center gap-3 sm:gap-4 shrink-0`}
      >
        <span className={`text-xs font-semibold tabular-nums whitespace-nowrap ${themeStyle.muted}`}>
          Pág. {currentPage} / {totalPages}
        </span>

        <input
          type="range"
          min={1}
          max={Math.max(1, totalPages)}
          value={currentPage}
          onChange={(e) => goToPage(Number(e.target.value))}
          aria-label="Navegar por páginas del libro"
          className="flex-1 accent-amber-500 cursor-pointer h-1.5"
        />

        {onTrackReadingSeconds && (
          <span
            className={`md:hidden text-[11px] font-bold tabular-nums whitespace-nowrap ${
              isDailyGoalMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {formatReadingTimer(liveTodaySeconds)}/{dailyTargetMinutes}m
          </span>
        )}

        <span className="text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400 whitespace-nowrap">
          {progressPercent}%
        </span>
      </footer>
    </div>,
    document.body
  );
};
