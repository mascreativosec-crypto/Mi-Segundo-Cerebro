import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { BookItem, WisdomCapsule } from '../../types';
import {
  BookOpen,
  Sparkles,
  Quote,
  CheckCircle2,
  Bookmark,
  FileText,
  Upload,
  Plus,
  Compass,
  Building2,
  User,
  Heart
} from 'lucide-react';

interface WisdomLibraryViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

export const WisdomLibraryView: React.FC<WisdomLibraryViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(data.books[0]?.id || '');
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookPages, setNewBookPages] = useState(300);
  const [newBookCategory, setNewBookCategory] = useState('Estrategia & Filosofía');

  // Document / PDF text extraction state
  const [showExtractor, setShowExtractor] = useState(false);
  const [extractTitle, setExtractTitle] = useState('');
  const [extractAuthor, setExtractAuthor] = useState('');
  const [extractChapter, setExtractChapter] = useState('');
  const [extractText, setExtractText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const activeBook = data.books.find((b) => b.id === selectedBookId) || data.books[0];
  const activeCapsule = data.wisdomCapsules[0];

  const handleUpdateCurrentPage = (bookId: string, page: number) => {
    onUpdateData((prev) => ({
      ...prev,
      books: prev.books.map((b) => {
        if (b.id === bookId) {
          const currentPage = Math.min(b.totalPages, Math.max(0, page));
          const status = currentPage >= b.totalPages ? 'completed' : 'reading';
          return { ...b, currentPage, status };
        }
        return b;
      }),
    }));
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;
    const newBook: BookItem = {
      id: `book_${Date.now()}`,
      title: newBookTitle.trim(),
      author: newBookAuthor.trim() || 'Autor Desconocido',
      totalPages: Number(newBookPages) || 200,
      currentPage: 0,
      status: 'to_read',
      category: newBookCategory,
      coverEmoji: '📖',
      notes: [],
      quotes: [],
      takeaways: [],
    };
    onUpdateData((prev) => ({
      ...prev,
      books: [newBook, ...prev.books],
    }));
    setShowAddBook(false);
    setNewBookTitle('');
    setNewBookAuthor('');
  };

  const handleGenerateCapsuleFromText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractTitle.trim() || !extractText.trim()) return;
    setIsExtracting(true);

    try {
      const res = await fetch('/api/gemini/wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: extractTitle,
          author: extractAuthor,
          chapter: extractChapter,
          excerpt: extractText,
        }),
      });
      const result = await res.json();
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
      }
    } catch (err) {
      console.error('Error generating wisdom capsule:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
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
                Procesamiento de libros, síntesis de ideas de alto impacto y cápsulas diarias accionables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowExtractor(!showExtractor)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sintetizar Extracto con IA</span>
            </button>
            <button
              onClick={() => setShowAddBook(!showAddBook)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Añadir Libro</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF / Excerpt Processor Modal */}
      {showExtractor && (
        <form onSubmit={handleGenerateCapsuleFromText} className="p-6 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Extractor de Sabiduría con Gemini IA
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Citas precisas con fidelidad textual</span>
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

      {/* Daily Wisdom Capsule (Featured Card) */}
      {activeCapsule && (
        <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-amber-500/10 via-white/85 to-orange-500/5 dark:from-amber-950/20 dark:via-slate-900/70 dark:to-orange-950/20 border border-amber-500/30 dark:border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
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

          {/* Book Title & Author */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeCapsule.bookTitle} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">— {activeCapsule.author}</span>
            </h2>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400/90 block mt-0.5">{activeCapsule.chapter}</span>
          </div>

          {/* Core Quote */}
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/30 border border-amber-500/20 my-2">
            <div className="flex items-start gap-3.5">
              <Quote className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 italic leading-relaxed">
                  "{activeCapsule.quote}"
                </p>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 block">
                  Idea Central: {activeCapsule.coreIdea}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Impact Grid: Personal vs Empresarial */}
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

          {/* Practical Action of the Day */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-800 dark:text-slate-200">
                <strong className="text-amber-700 dark:text-amber-300">Acción Práctica Hoy:</strong> {activeCapsule.practicalAction}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bookshelf Section */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Biblioteca Activa ({data.books.length} Libros)</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Progreso de Lectura</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.books.map((book) => {
            const percent = Math.round((book.currentPage / book.totalPages) * 100);
            return (
              <div
                key={book.id}
                onClick={() => setSelectedBookId(book.id)}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer shadow-sm ${
                  book.id === activeBook?.id
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/10'
                    : 'bg-slate-50/90 dark:bg-black/30 border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-2xl">{book.coverEmoji || '📘'}</span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{percent}%</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">{book.title}</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{book.author}</span>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-full mt-2 inline-block">
                    {book.category}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Páginas</span>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs">
                      <input
                        type="number"
                        min="0"
                        max={book.totalPages}
                        value={book.currentPage}
                        onChange={(e) => handleUpdateCurrentPage(book.id, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-center text-xs font-bold"
                      />
                      <span className="text-slate-400">/ {book.totalPages}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
