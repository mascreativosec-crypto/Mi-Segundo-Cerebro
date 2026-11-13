import React, { useState, useMemo, useRef } from 'react';
import { Search, X, Download, Upload, LayoutGrid } from 'lucide-react';
import { NAV_SECTIONS } from '../layout/navConfig';

interface MobileModulesViewProps {
  lastModuleView: string;
  onSelectModule: (viewId: string) => void;
  userName: string;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

export const MobileModulesView: React.FC<MobileModulesViewProps> = ({
  lastModuleView,
  onSelectModule,
  userName,
  onExportBackup,
  onImportBackup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizedLastView =
    lastModuleView === 'spiritual_emotional' ? 'spiritual' : lastModuleView;

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return NAV_SECTIONS;
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.shortLabel && item.shortLabel.toLowerCase().includes(q)) ||
          section.title.toLowerCase().includes(q)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Compact Apple-style Directory Header (in-flow, no floating modal, single scroll) */}
      <div className="p-3.5 rounded-2xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/65 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <LayoutGrid className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                Todos los Módulos
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {userName} · Toca cualquier módulo para abrirlo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onExportBackup}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-white/[0.05] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] cursor-pointer"
              title="Exportar Respaldo JSON"
              aria-label="Exportar Respaldo"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-white/[0.05] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] cursor-pointer"
              title="Importar Respaldo JSON"
              aria-label="Importar Respaldo"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Instant Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar módulo (ej. Finanzas, Súper Mañana...)"
            className="w-full bg-slate-100/90 dark:bg-black/35 border border-slate-200/80 dark:border-white/[0.08] rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Compact Module Cards Grid across all 5 Categories (Single Native Scroll) */}
      {filteredSections.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/[0.06]">
          No se encontraron módulos para &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          {filteredSections.map((section) => (
            <section key={section.id} className="space-y-2">
              <h2 className="px-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                {section.title}
              </h2>

              <div className="grid grid-cols-3 gap-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = normalizedLastView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectModule(item.id)}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center justify-start gap-1.5 text-center transition-all active:scale-95 cursor-pointer min-h-[80px] ${
                        isActive
                          ? `${item.activeClass} font-bold`
                          : 'bg-white/85 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800/80 shadow-xs'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-white/90 dark:bg-black/30 shadow-xs'
                            : 'bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06]'
                        }`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${item.colorClass}`} />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight line-clamp-2 w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
