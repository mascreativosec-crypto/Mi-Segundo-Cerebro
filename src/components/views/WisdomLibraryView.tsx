import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { BookItem, ReadingGoalState, WisdomCapsule } from '../../types';
import { PdfBookStorage } from '../../services/pdfBookStorage';
import { extractPdfMetaAndCover } from '../../utils/pdfUtils';
import {
  computeReadingStreaks,
  findLinkedReadingHabit,
  formatReadingTimer,
  getCurrentWeekReadingDays,
  getLocalDateStr,
} from '../../utils/readingGoal';
import { fetchJsonWithTimeout } from '../../utils/fetchWithTimeout';
import {
  BookOpen,
  Sparkles,
  Quote,
  Bookmark,
  FileText,
  Upload,
  Plus,
  Building2,
  User,
  Download,
  Trash2,
  X,
  ChevronRight,
  Flame,
  CheckCircle2,
  Highlighter,
  Settings2,
} from 'lucide-react';

interface WisdomLibraryViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenBookReader: (bookId: string) => void;
}

const DAILY_PRESET_MINUTES = [4, 5, 10, 15, 20, 30, 45, 60];

export const WisdomLibraryView: React.FC<WisdomLibraryViewProps> = ({
  data,
  onUpdateData,
  onOpenBookReader,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(data.books[0]?.id || '');

  // Reading Goal Settings Popover
  const [showGoalSettings, setShowGoalSettings] = useState(false);

  // Add Book (with optional PDF) state
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookPages, setNewBookPages] = useState(250);
  const [newBookCategory, setNewBookCategory] = useState('Estrategia & Filosofía');
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  // Quick attach PDF to existing book
  const quickPdfInputRef = useRef<HTMLInputElement>(null);
  const attachPdfInputRef = useRef<HTMLInputElement>(null);
  const [attachingToBookId, setAttachingToBookId] = useState<string | null>(null);
  const coverHydratingRef = useRef<Set<string>>(new Set());

  // Document / PDF text extraction state
  const [showExtractor, setShowExtractor] = useState(false);
  const [extractTitle, setExtractTitle] = useState('');
  const [extractAuthor, setExtractAuthor] = useState('');
  const [extractChapter, setExtractChapter] = useState('');
  const [extractText, setExtractText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const activeBook = data.books.find((b) => b.id === selectedBookId) || data.books[0];
  const activeCapsule = data.wisdomCapsules[0];

  // Pick the best "Continue Reading" book: most recently read PDF book, then any PDF book, then active book
  const continueBook = useMemo(() => {
    const pdfBooks = data.books.filter((b) => b.hasPdf);
    if (pdfBooks.length > 0) {
      return [...pdfBooks].sort((a, b) =>
        (b.lastReadAt || '').localeCompare(a.lastReadAt || '')
      )[0];
    }
    return data.books.find((b) => b.status === 'reading') || data.books[0];
  }, [data.books]);

  // Reading Goal metrics
  const readingGoal: ReadingGoalState = data.readingGoal || {
    dailyTargetMinutes: 15,
    dailySecondsByDate: {},
    annualBooksTarget: 12,
    bestStreak: 0,
    linkedHabitId: 'h3',
  };

  const todayLocal = getLocalDateStr();
  const todayIso = new Date().toISOString().split('T')[0];
  const todaySeconds = readingGoal.dailySecondsByDate?.[todayLocal] || 0;
  const targetMinutes = Math.max(1, readingGoal.dailyTargetMinutes || 15);
  const targetSeconds = targetMinutes * 60;
  const goalProgressRatio = Math.min(1, todaySeconds / targetSeconds);
  const isGoalDoneToday = todaySeconds >= targetSeconds;

  const weekDays = useMemo(() => getCurrentWeekReadingDays(readingGoal), [readingGoal]);
  const { currentStreak, bestStreak } = useMemo(
    () => computeReadingStreaks(readingGoal),
    [readingGoal]
  );

  const linkedHabit = useMemo(
    () => findLinkedReadingHabit(data.habits, readingGoal.linkedHabitId),
    [data.habits, readingGoal.linkedHabitId]
  );
  const isLinkedHabitDoneToday = Boolean(
    linkedHabit &&
      (linkedHabit.completedDates.includes(todayIso) ||
        linkedHabit.completedDates.includes(todayLocal))
  );

  const currentYear = new Date().getFullYear();
  const completedBooksThisYear = useMemo(
    () =>
      data.books.filter(
        (b) =>
          b.status === 'completed' &&
          (!b.completedYear || b.completedYear === currentYear)
      ),
    [data.books, currentYear]
  );

  const annualSlotsCount = Math.max(4, Math.min(12, readingGoal.annualBooksTarget || 4));

  // Lazily generate real Page-1 PDF cover art for any previously uploaded PDF book lacking a cover
  useEffect(() => {
    let cancelled = false;
    const missingCoverBooks = data.books.filter(
      (b) => b.hasPdf && !b.coverImageDataUrl && !coverHydratingRef.current.has(b.id)
    );
    if (missingCoverBooks.length === 0) return;

    const hydrateCovers = async () => {
      for (const b of missingCoverBooks) {
        if (cancelled) return;
        coverHydratingRef.current.add(b.id);
        try {
          const buffer = await PdfBookStorage.getPdf(b.id);
          if (!buffer || cancelled) continue;
          const { coverImageDataUrl, totalPages } = await extractPdfMetaAndCover(buffer);
          if (cancelled || !coverImageDataUrl) continue;
          onUpdateData((prev) => ({
            ...prev,
            books: prev.books.map((item) =>
              item.id === b.id
                ? {
                    ...item,
                    coverImageDataUrl,
                    totalPages: Math.max(1, totalPages || item.totalPages),
                  }
                : item
            ),
          }));
        } catch {
          // ignore cover hydration error
        }
      }
    };

    void hydrateCovers();
    return () => {
      cancelled = true;
    };
  }, [data.books, onUpdateData]);

  const handleUpdateReadingGoal = (patch: Partial<ReadingGoalState>) => {
    onUpdateData((prev) => ({
      ...prev,
      readingGoal: {
        ...readingGoal,
        ...patch,
      },
    }));
  };

  const handleUpdateCurrentPage = (bookId: string, page: number) => {
    onUpdateData((prev) => ({
      ...prev,
      books: prev.books.map((b) => {
        if (b.id === bookId) {
          const currentPage = Math.min(b.totalPages, Math.max(0, page));
          const isCompleted = currentPage >= b.totalPages && b.totalPages > 0;
          return {
            ...b,
            currentPage,
            status: isCompleted ? 'completed' : 'reading',
            completedYear: isCompleted ? new Date().getFullYear() : b.completedYear,
          };
        }
        return b;
      }),
    }));
  };

  const handleUpdateBook = (bookId: string, updater: (book: BookItem) => BookItem) => {
    onUpdateData((prev) => ({
      ...prev,
      books: prev.books.map((b) => (b.id === bookId ? updater(b) : b)),
    }));
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;
    setIsUploadingPdf(true);
    setPdfNotice(null);

    try {
      const bookId = `book_${Date.now()}`;
      let totalPages = Number(newBookPages) || 200;
      let hasPdf = false;
      let pdfFileName: string | undefined;
      let pdfSizeBytes: number | undefined;
      let coverImageDataUrl: string | undefined;

      if (pendingPdfFile) {
        const saved = await PdfBookStorage.savePdf(bookId, pendingPdfFile);
        const meta = await extractPdfMetaAndCover(saved.arrayBuffer);
        if (meta.totalPages > 0) totalPages = meta.totalPages;
        coverImageDataUrl = meta.coverImageDataUrl;
        hasPdf = true;
        pdfFileName = saved.fileName;
        pdfSizeBytes = saved.sizeBytes;
      }

      const newBook: BookItem = {
        id: bookId,
        title: newBookTitle.trim(),
        author: newBookAuthor.trim() || 'Autor Desconocido',
        totalPages,
        currentPage: hasPdf ? 1 : 0,
        status: hasPdf ? 'reading' : 'to_read',
        category: newBookCategory,
        coverEmoji: hasPdf ? '📕' : '📖',
        coverImageDataUrl,
        notes: [],
        quotes: [],
        takeaways: [],
        hasPdf,
        pdfFileName,
        pdfSizeBytes,
        bookmarks: [],
        highlights: [],
        lastReadAt: hasPdf ? new Date().toISOString() : undefined,
      };

      onUpdateData((prev) => ({
        ...prev,
        books: [newBook, ...prev.books],
      }));
      setSelectedBookId(bookId);
      setShowAddBook(false);
      setNewBookTitle('');
      setNewBookAuthor('');
      setPendingPdfFile(null);

      if (hasPdf) {
        onOpenBookReader(bookId);
      }
    } catch (err: unknown) {
      setPdfNotice(err instanceof Error ? err.message : 'No se pudo cargar el archivo PDF.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Direct 1-click "Subir Libro PDF" upload with automatic Page-1 Cover Art
  const handleQuickUploadPdfBook = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setPdfNotice('Por favor selecciona un archivo en formato PDF (.pdf).');
      return;
    }

    setIsUploadingPdf(true);
    setPdfNotice(null);
    try {
      const bookId = `book_pdf_${Date.now()}`;
      const saved = await PdfBookStorage.savePdf(bookId, file);
      const { totalPages, coverImageDataUrl } = await extractPdfMetaAndCover(saved.arrayBuffer);
      const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();

      const newBook: BookItem = {
        id: bookId,
        title: cleanTitle || 'Libro PDF',
        author: 'Biblioteca Personal',
        totalPages: Math.max(1, totalPages),
        currentPage: 1,
        status: 'reading',
        category: 'Libro PDF',
        coverEmoji: '📕',
        coverImageDataUrl,
        notes: [],
        quotes: [],
        takeaways: [],
        hasPdf: true,
        pdfFileName: saved.fileName,
        pdfSizeBytes: saved.sizeBytes,
        bookmarks: [],
        highlights: [],
        lastReadAt: new Date().toISOString(),
      };

      onUpdateData((prev) => ({
        ...prev,
        books: [newBook, ...prev.books],
      }));
      setSelectedBookId(bookId);
      onOpenBookReader(bookId);
    } catch (err: unknown) {
      setPdfNotice(err instanceof Error ? err.message : 'Error guardando el PDF.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Attach PDF to an existing bookshelf card + generate Page 1 Cover Art
  const handleAttachPdfToExisting = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const targetId = attachingToBookId;
    setAttachingToBookId(null);
    if (!file || !targetId) return;

    setIsUploadingPdf(true);
    setPdfNotice(null);
    try {
      const saved = await PdfBookStorage.savePdf(targetId, file);
      const { totalPages, coverImageDataUrl } = await extractPdfMetaAndCover(saved.arrayBuffer);
      handleUpdateBook(targetId, (prev) => ({
        ...prev,
        hasPdf: true,
        pdfFileName: saved.fileName,
        pdfSizeBytes: saved.sizeBytes,
        coverImageDataUrl: coverImageDataUrl || prev.coverImageDataUrl,
        totalPages: Math.max(1, totalPages || prev.totalPages),
        currentPage: Math.max(1, Math.min(prev.currentPage || 1, totalPages || prev.totalPages)),
        status: 'reading',
        lastReadAt: new Date().toISOString(),
      }));
      onOpenBookReader(targetId);
    } catch (err: unknown) {
      setPdfNotice(err instanceof Error ? err.message : 'Error adjuntando PDF al libro.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    await PdfBookStorage.deletePdf(bookId).catch(() => {});
    onUpdateData((prev) => ({
      ...prev,
      books: prev.books.filter((b) => b.id !== bookId),
    }));
  };

  const handleExportLibraryForNotebookLM = () => {
    const lines: string[] = [
      '# Biblioteca de Sabiduría — Exportación para NotebookLM',
      `Fecha: ${new Date().toISOString().split('T')[0]}`,
      '',
      '## Cápsulas de Sabiduría',
      ...data.wisdomCapsules.flatMap((c) => [
        `### ${c.bookTitle} — ${c.author} (${c.chapter}, ${c.pageRef})`,
        `- **Cita:** "${c.quote}"`,
        `- **Idea Central:** ${c.coreIdea}`,
        `- **Aplicación Personal:** ${c.personalApplication}`,
        `- **Aplicación Empresarial:** ${c.businessApplication}`,
        `- **Acción Práctica:** ${c.practicalAction}`,
        '',
      ]),
      '## Subrayados, Notas y Citas de Libros',
      ...data.books.flatMap((b) => [
        `### ${b.title} (${b.author}) — Progreso: ${b.currentPage}/${b.totalPages} págs`,
        ...(b.highlights || []).map(
          (h) =>
            `- Subrayado (Pág. ${h.page}${h.quote ? `): "${h.quote}"` : ')'}${
              h.note ? ` — Nota: ${h.note}` : ''
            }`
        ),
        ...(b.quotes || []).map((q) => `- Cita (${q.page || 'Ref'}): "${q.text}"`),
        ...(b.notes || []).map((n) => `- Nota: ${n}`),
        '',
      ]),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biblioteca-sabiduria-notebooklm-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateCapsuleFromText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractTitle.trim() || !extractText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);

    try {
      const { ok, status, data: result } = await fetchJsonWithTimeout<{ capsule?: any; error?: string }>(
        '/api/gemini/wisdom',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookTitle: extractTitle,
            author: extractAuthor,
            chapter: extractChapter,
            excerpt: extractText,
          }),
        }
      );
      if (!ok) {
        throw new Error(result.error || `Error del servidor (${status}) al sintetizar la cápsula.`);
      }
      if (result.capsule) {
        const newCapsule: WisdomCapsule = {
          id: `capsule_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          bookTitle: result.capsule.bookTitle || extractTitle,
          author: result.capsule.author || extractAuthor,
          chapter: result.capsule.chapter || extractChapter || 'Capítulo Analizado',
          coreIdea: result.capsule.coreIdea,
          quote: result.capsule.quote,
          pageRef: result.capsule.pageRef || 'Pág. Ref',
          aiInterpretation: result.capsule.aiInterpretation,
          personalApplication: result.capsule.personalApplication,
          businessApplication: result.capsule.businessApplication,
          practicalAction: result.capsule.practicalAction,
          isFavorite: true,
        };

        onUpdateData((prev) => ({
          ...prev,
          wisdomCapsules: [newCapsule, ...prev.wisdomCapsules],
        }));
        setShowExtractor(false);
        setExtractText('');
      } else {
        throw new Error('La IA no devolvió una cápsula válida. Intenta nuevamente.');
      }
    } catch (err: unknown) {
      setExtractError(err instanceof Error ? err.message : 'Error generando cápsula de sabiduría con IA.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Semicircular SVG arc math (Apple Books Reading Goal gauge)
  const gaugeRadius = 96;
  const semiCircumference = Math.PI * gaugeRadius;
  const strokeDashoffset = semiCircumference * (1 - goalProgressRatio);

  const continuePercent =
    continueBook && continueBook.totalPages > 0
      ? Math.min(100, Math.round((continueBook.currentPage / continueBook.totalPages) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Hidden PDF File Inputs */}
      <input
        ref={quickPdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleQuickUploadPdfBook}
        className="hidden"
      />
      <input
        ref={attachPdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleAttachPdfToExisting}
        className="hidden"
      />

      {/* Header Banner - Apple Liquid Glass with Amber/Orange squircle gradient */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 shrink-0">
              <BookOpen className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Biblioteca de Sabiduría
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Portadas reales de tus PDF, subrayado con notas, objetivos de lectura y conexión directa con tus hábitos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isUploadingPdf}
              onClick={() => quickPdfInputRef.current?.click()}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isUploadingPdf ? 'Procesando portada PDF...' : 'Subir Libro PDF'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowExtractor(!showExtractor)}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sintetizar IA</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddBook(!showAddBook)}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Libro</span>
            </button>
          </div>
        </div>

        {pdfNotice && (
          <div className="mt-4 px-4 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <span>{pdfNotice}</span>
            <button type="button" onClick={() => setPdfNotice(null)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Add Book Form (supports attaching a PDF book directly) */}
      {showAddBook && (
        <form
          onSubmit={handleCreateBook}
          className="p-6 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-amber-500/30 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              Nuevo Libro en Biblioteca
            </h3>
            <button
              type="button"
              onClick={() => setShowAddBook(false)}
              className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Título del libro"
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              required
              className="md:col-span-2 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Autor"
              value={newBookAuthor}
              onChange={(e) => setNewBookAuthor(e.target.value)}
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="number"
              min={1}
              placeholder="Páginas"
              value={newBookPages}
              onChange={(e) => setNewBookPages(Number(e.target.value))}
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white tabular-nums"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <input
              type="text"
              placeholder="Categoría (ej: Estrategia, Finanzas, Espiritualidad)"
              value={newBookCategory}
              onChange={(e) => setNewBookCategory(e.target.value)}
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
            <label className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300 cursor-pointer">
              <span className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 shrink-0" />
                {pendingPdfFile ? pendingPdfFile.name : 'Adjuntar archivo PDF (opcional)'}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setPendingPdfFile(f);
                  if (f && !newBookTitle.trim()) {
                    setNewBookTitle(f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' '));
                  }
                }}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddBook(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploadingPdf}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              {isUploadingPdf ? 'Guardando...' : 'Guardar Libro'}
            </button>
          </div>
        </form>
      )}

      {/* PDF / Excerpt Processor Modal */}
      {showExtractor && (
        <form
          onSubmit={handleGenerateCapsuleFromText}
          className="p-6 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-amber-500/30 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Extractor de Sabiduría con Gemini IA
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Citas precisas con fidelidad textual
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Título del libro (ej: Antifrágil)"
              value={extractTitle}
              onChange={(e) => setExtractTitle(e.target.value)}
              required
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Autor (ej: Nassim Nicholas Taleb)"
              value={extractAuthor}
              onChange={(e) => setExtractAuthor(e.target.value)}
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Capítulo / Sección"
              value={extractChapter}
              onChange={(e) => setExtractChapter(e.target.value)}
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <textarea
            rows={4}
            placeholder="Pega aquí el extracto, notas o transcripción de páginas del libro..."
            value={extractText}
            onChange={(e) => setExtractText(e.target.value)}
            required
            className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          />

          {extractError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {extractError}
            </div>
          )}

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowExtractor(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isExtracting}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-amber-500/20"
            >
              {isExtracting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Sintetizando Cápsula...
                </>
              ) : (
                'Extraer Cápsula de Conocimiento'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Apple Books Top Row: "Continuar" + "Objetivos de lectura" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main: Apple Books "Objetivos de lectura" Card */}
        <div className="lg:col-span-5 p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/65 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-serif">
                Objetivos de lectura
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Lee todos los días, sube tus estadísticas y completa tu hábito automáticamente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGoalSettings((v) => !v)}
              title="Configurar objetivo y hábito conectado"
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-amber-500/40 cursor-pointer shrink-0"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

          {/* Semicircular Apple Books Daily Reading Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-60 h-32 flex items-end justify-center">
              <svg viewBox="0 0 220 120" className="w-full h-full overflow-visible">
                {/* Background Arc */}
                <path
                  d="M 14 110 A 96 96 0 0 1 206 110"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-white/10"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Progress Arc */}
                <path
                  d="M 14 110 A 96 96 0 0 1 206 110"
                  fill="none"
                  stroke={isGoalDoneToday ? '#10b981' : '#f59e0b'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={semiCircumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              </svg>

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-serif">
                  Lectura de hoy
                </span>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight leading-none mt-1 font-serif">
                  {formatReadingTimer(todaySeconds)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGoalSettings((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
            >
              <span>de tu objetivo de {targetMinutes} min</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Inline Goal & Habit Connection Editor */}
            {showGoalSettings && (
              <div className="w-full mt-3 p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-amber-500/30 space-y-3 text-left">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                    Meta diaria de lectura (minutos)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAILY_PRESET_MINUTES.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleUpdateReadingGoal({ dailyTargetMinutes: mins })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          targetMinutes === mins
                            ? 'bg-amber-500 text-white'
                            : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                      Meta anual de libros
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={readingGoal.annualBooksTarget || 12}
                      onChange={(e) =>
                        handleUpdateReadingGoal({
                          annualBooksTarget: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full rounded-xl bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                      Hábito conectado
                    </label>
                    <select
                      value={linkedHabit?.id || ''}
                      onChange={(e) =>
                        handleUpdateReadingGoal({ linkedHabitId: e.target.value || undefined })
                      }
                      className="w-full rounded-xl bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="">Sin vincular</option>
                      {data.habits
                        .filter((h) => !h.isArchived)
                        .map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Apple Books CTA: "Seguir leyendo [Libro]" */}
            {continueBook && (
              <button
                type="button"
                onClick={() => {
                  if (continueBook.hasPdf) {
                    onOpenBookReader(continueBook.id);
                  } else {
                    setAttachingToBookId(continueBook.id);
                    attachPdfInputRef.current?.click();
                  }
                }}
                className="w-full mt-4 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400 text-white dark:text-black transition-all shadow-md cursor-pointer active:scale-[0.99] text-center"
              >
                <span className="text-xs font-extrabold block leading-tight">
                  {continueBook.hasPdf ? 'Seguir leyendo' : 'Cargar PDF para empezar'}
                </span>
                <span className="text-[11px] opacity-80 block truncate mt-0.5 font-medium">
                  {continueBook.title}
                </span>
              </button>
            )}
          </div>

          {/* 7-Day Weekly Streak Circles (L M M J V S D) */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between gap-1.5">
              {weekDays.map((day) => (
                <div key={day.dateStr} className="flex flex-col items-center gap-1">
                  <div
                    title={`${day.dateStr}: ${formatReadingTimer(day.seconds)}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      day.completed
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/30'
                        : day.isToday
                        ? 'border-2 border-slate-900 dark:border-amber-400 text-slate-900 dark:text-white'
                        : day.isFuture
                        ? 'border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500'
                        : 'bg-slate-200/80 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {day.letter}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center space-y-0.5">
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                {currentStreak > 0 ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>
                      Racha activa de {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
                    </span>
                  </>
                ) : (
                  <span>Comienza una nueva racha hoy</span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tu récord es de {bestStreak} {bestStreak === 1 ? 'día' : 'días'}.
              </p>
            </div>

            {/* Linked Habit Synchronization Status Pill */}
            {linkedHabit && (
              <div
                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-[11px] ${
                  isLinkedHabitDoneToday || isGoalDoneToday
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      isLinkedHabitDoneToday || isGoalDoneToday
                        ? 'text-emerald-500'
                        : 'text-amber-500 opacity-70'
                    }`}
                  />
                  <span className="truncate font-semibold">
                    Hábito: {linkedHabit.title}
                  </span>
                </div>
                <span className="font-extrabold shrink-0">
                  {isLinkedHabitDoneToday || isGoalDoneToday ? 'Cumplido ✓' : 'Sincronizado'}
                </span>
              </div>
            )}
          </div>

          {/* "Libros leídos este año" numbered cover slots */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-serif">
                Libros leídos este año
              </h3>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {completedBooksThisYear.length} / {readingGoal.annualBooksTarget || 12}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {Array.from({ length: Math.min(4, annualSlotsCount) }).map((_, idx) => {
                const completedBook = completedBooksThisYear[idx];
                if (completedBook) {
                  return (
                    <button
                      key={completedBook.id}
                      type="button"
                      onClick={() =>
                        completedBook.hasPdf
                          ? onOpenBookReader(completedBook.id)
                          : setSelectedBookId(completedBook.id)
                      }
                      title={`${completedBook.title} — ${completedBook.author}`}
                      className="aspect-[2/3] rounded-xl overflow-hidden shadow-md border border-slate-200/80 dark:border-white/10 relative group cursor-pointer bg-slate-100 dark:bg-slate-800"
                    >
                      {completedBook.coverImageDataUrl ? (
                        <img
                          src={completedBook.coverImageDataUrl}
                          alt={completedBook.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-500/85 to-orange-600/90 p-2 flex flex-col justify-between text-left text-white">
                          <span className="text-base">{completedBook.coverEmoji || '📘'}</span>
                          <span className="text-[9px] font-extrabold leading-tight line-clamp-3">
                            {completedBook.title}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                }
                return (
                  <div
                    key={`slot_${idx}`}
                    className="aspect-[2/3] rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-dashed border-slate-300/80 dark:border-white/10 flex items-center justify-center"
                  >
                    <span className="text-xl font-serif font-bold text-slate-300 dark:text-slate-600">
                      {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Apple Books "Continuar" Card + Real Cover Bookshelf */}
        <div className="lg:col-span-7 space-y-6">
          {/* Compact Apple Books "Continuar" Strip */}
          {continueBook && (
            <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/65 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-serif">
                  Continuar
                </h2>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Última lectura activa
                </span>
              </div>

              <div
                onClick={() => {
                  if (continueBook.hasPdf) onOpenBookReader(continueBook.id);
                  else {
                    setAttachingToBookId(continueBook.id);
                    attachPdfInputRef.current?.click();
                  }
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-white/70 dark:from-amber-950/40 dark:via-slate-900/80 dark:to-orange-950/30 border border-amber-500/30 flex items-center gap-4 cursor-pointer hover:border-amber-500/55 transition-all group"
              >
                {/* Mini real PDF cover */}
                <div className="w-14 aspect-[2/3] rounded-lg overflow-hidden shadow-md border border-black/10 dark:border-white/15 shrink-0 bg-white dark:bg-slate-800 relative">
                  {continueBook.coverImageDataUrl ? (
                    <img
                      src={continueBook.coverImageDataUrl}
                      alt={continueBook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center p-1 text-white">
                      <span className="text-xl">{continueBook.coverEmoji || '📕'}</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {continueBook.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    {continueBook.author}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    <span>{continueBook.hasPdf ? 'PDF' : 'Libro'}</span>
                    <span>•</span>
                    <span className="tabular-nums">{continuePercent}%</span>
                    {(continueBook.highlights?.length || 0) > 0 && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Highlighter className="w-3 h-3" />
                          {continueBook.highlights?.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shrink-0 shadow-sm">
                  {continueBook.hasPdf ? 'Leer' : 'Subir PDF'}
                </span>
              </div>
            </div>
          )}

          {/* Bookshelf Grid with Real PDF Page-1 Covers (Apple Books Style) */}
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-serif">
                  Mi Biblioteca ({data.books.length} Libros)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toca cualquier portada para abrir el lector con subrayado, notas y temas Claro, Sepia, Calma o Noche.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportLibraryForNotebookLM}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-amber-500/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>Exportar a NotebookLM (.md)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {data.books.map((book) => {
                const percent =
                  book.totalPages > 0
                    ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
                    : 0;
                const bmCount = book.bookmarks?.length || 0;
                const hlCount = book.highlights?.length || 0;

                return (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBookId(book.id)}
                    className={`flex flex-col group cursor-pointer rounded-2xl p-2.5 border transition-all ${
                      book.id === activeBook?.id
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/10'
                        : 'bg-slate-50/75 dark:bg-black/25 border-slate-200/70 dark:border-white/[0.06] hover:border-amber-500/35'
                    }`}
                  >
                    {/* 2:3 Apple Books Cover with Spine & Page Depth Shadow */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBookId(book.id);
                        if (book.hasPdf) {
                          onOpenBookReader(book.id);
                        } else {
                          setAttachingToBookId(book.id);
                          attachPdfInputRef.current?.click();
                        }
                      }}
                      className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.18)] dark:shadow-[0_14px_32px_rgba(0,0,0,0.55)] border border-black/10 dark:border-white/10 transition-transform duration-200 group-hover:-translate-y-1"
                    >
                      {book.coverImageDataUrl ? (
                        <img
                          src={book.coverImageDataUrl}
                          alt={`Portada de ${book.title}`}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 p-3.5 flex flex-col justify-between text-white">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-black/20 px-2 py-0.5 rounded-full truncate max-w-[80%]">
                              {book.category}
                            </span>
                            <span className="text-lg">{book.coverEmoji || '📘'}</span>
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-extrabold font-serif leading-snug line-clamp-4">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-white/85 mt-1 truncate font-medium">
                              {book.author}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Subtle left book-spine crease effect */}
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-white/10 to-transparent" />

                      {/* Top Badges: Progress & Delete */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-bold tabular-nums">
                          {book.hasPdf ? `PDF · ${percent}%` : `${percent}%`}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBook(book.id);
                          }}
                          title="Eliminar libro"
                          className="p-1 rounded-full bg-black/55 backdrop-blur-md text-white/80 hover:text-rose-400 cursor-pointer opacity-80 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Bottom Hover Action Strip */}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/75 via-black/35 to-transparent flex items-center justify-between text-white text-[10px] font-bold">
                        <span className="flex items-center gap-1">
                          {book.hasPdf ? (
                            <>
                              <BookOpen className="w-3 h-3 text-amber-400" />
                              <span>Leer ahora</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 text-amber-400" />
                              <span>Adjuntar PDF</span>
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {hlCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-amber-300">
                              <Highlighter className="w-2.5 h-2.5" />
                              {hlCount}
                            </span>
                          )}
                          {bmCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-rose-300">
                              <Bookmark className="w-2.5 h-2.5" />
                              {bmCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Page Progress underneath Cover */}
                    <div className="mt-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {book.title}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          {book.author}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max={book.totalPages}
                              value={book.currentPage}
                              onChange={(e) =>
                                handleUpdateCurrentPage(book.id, Number(e.target.value))
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="w-12 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-md px-1 py-0.5 text-center text-[10px] font-bold text-slate-800 dark:text-slate-200 tabular-nums"
                            />
                            <span className="tabular-nums">/ {book.totalPages} p.</span>
                          </div>
                          {!book.hasPdf && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAttachingToBookId(book.id);
                                attachPdfInputRef.current?.click();
                              }}
                              className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                            >
                              + PDF
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Wisdom Capsule (Featured Card) */}
      {activeCapsule && (
        <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-amber-500/10 via-white/85 to-orange-500/5 dark:from-amber-950/20 dark:via-slate-900/70 dark:to-orange-950/20 border border-amber-500/30 dark:border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Cápsula Diaria de Sabiduría
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{activeCapsule.date}</span>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/10 px-3 py-1 rounded-full">
              {activeCapsule.pageRef}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeCapsule.bookTitle}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                — {activeCapsule.author}
              </span>
            </h2>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400/90 block mt-0.5">
              {activeCapsule.chapter}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/30 border border-amber-500/20 my-2">
            <div className="flex items-start gap-3.5">
              <Quote className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 italic leading-relaxed">
                  &ldquo;{activeCapsule.quote}&rdquo;
                </p>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 block">
                  Idea Central: {activeCapsule.coreIdea}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-slate-200/80 dark:border-white/[0.06]">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5" />
                Aplicación en Crecimiento Personal
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeCapsule.personalApplication}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-slate-200/80 dark:border-white/[0.06]">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Aplicación en Ecosistema Empresarial
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeCapsule.businessApplication}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs text-slate-800 dark:text-slate-200">
                <strong className="text-amber-700 dark:text-amber-300">Acción Práctica Hoy:</strong>{' '}
                {activeCapsule.practicalAction}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
