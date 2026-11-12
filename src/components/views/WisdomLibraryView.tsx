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
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0d1a13] to-[#070e0a] border border-emerald-500/20 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Biblioteca de Sabiduría</h1>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  PILAR INTELECTUAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Procesamiento de libros, síntesis de ideas de alto impacto y cápsulas diarias accionables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExtractor(!showExtractor)}
              className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Procesar Extracto / Libro con IA
            </button>
            <button
              onClick={() => setShowAddBook(!showAddBook)}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold rounded-xl shadow-md shadow-emerald-950 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Libro
            </button>
          </div>
        </div>
      </div>

      {/* PDF / Excerpt Processor Modal */}
      {showExtractor && (
        <form onSubmit={handleGenerateCapsuleFromText} className="p-5 rounded-2xl bg-[#0c1812] border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Extractor de Sabiduría con Gemini IA
            </h3>
            <span className="text-xs text-slate-500">Citas breves con fidelidad textual</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Título del libro (ej: Antifrágil)"
              value={extractTitle}
              onChange={(e) => setExtractTitle(e.target.value)}
              required
              className="bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
            <input
              type="text"
              placeholder="Autor (ej: Nassim Nicholas Taleb)"
              value={extractAuthor}
              onChange={(e) => setExtractAuthor(e.target.value)}
              className="bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
            <input
              type="text"
              placeholder="Capítulo / Sección"
              value={extractChapter}
              onChange={(e) => setExtractChapter(e.target.value)}
              className="bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          <textarea
            rows={4}
            placeholder="Pega aquí el extracto, notas o transcripción de páginas del libro..."
            value={extractText}
            onChange={(e) => setExtractText(e.target.value)}
            required
            className="w-full bg-[#08100c] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowExtractor(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isExtracting}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-2"
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
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/30 via-[#0c1812] to-[#08100c] border border-emerald-500/25 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                CÁPSULA DIARIA DE SABIDURÍA
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{activeCapsule.date}</span>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded">
              {activeCapsule.pageRef}
            </span>
          </div>

          {/* Book Title & Author */}
          <h2 className="text-lg font-bold text-white tracking-tight">
            {activeCapsule.bookTitle} <span className="text-xs font-normal text-slate-400">— {activeCapsule.author}</span>
          </h2>
          <span className="text-xs text-emerald-400/80 font-mono block mb-4">{activeCapsule.chapter}</span>

          {/* Core Quote */}
          <div className="p-4 rounded-xl bg-[#08100c] border border-emerald-500/20 my-3">
            <div className="flex items-start gap-3">
              <Quote className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-100 italic leading-relaxed">
                  "{activeCapsule.quote}"
                </p>
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Idea Central: {activeCapsule.coreIdea}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Impact Grid: Personal vs Empresarial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3.5 rounded-xl bg-[#08100c]/80 border border-slate-800">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5" />
                Aplicación en Crecimiento Personal
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeCapsule.personalApplication}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08100c]/80 border border-slate-800">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Aplicación en Ecosistema Empresarial
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeCapsule.businessApplication}
              </p>
            </div>
          </div>

          {/* Practical Action of the Day */}
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-200">
                <strong className="text-emerald-300">Acción Práctica Hoy:</strong> {activeCapsule.practicalAction}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bookshelf Section */}
      <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Biblioteca Personal ({data.books.length} Libros)</h3>
          <span className="text-xs text-slate-500 font-mono">Progreso de Lectura Activa</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.books.map((book) => {
            const percent = Math.round((book.currentPage / book.totalPages) * 100);
            return (
              <div
                key={book.id}
                onClick={() => setSelectedBookId(book.id)}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                  book.id === activeBook?.id
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-950'
                    : 'bg-[#08100c] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-lg">{book.coverEmoji || '📘'}</span>
                    <span className="font-mono text-emerald-400 font-bold">{percent}%</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">{book.title}</h4>
                  <span className="text-[11px] text-slate-400 block">{book.author}</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-2 block">{book.category}</span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">Páginas</span>
                    <div className="flex items-center gap-1 font-mono text-slate-200 text-xs">
                      <input
                        type="number"
                        min="0"
                        max={book.totalPages}
                        value={book.currentPage}
                        onChange={(e) => handleUpdateCurrentPage(book.id, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs"
                      />
                      <span>/ {book.totalPages}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300"
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
