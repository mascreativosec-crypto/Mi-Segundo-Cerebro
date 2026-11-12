import React from 'react';
import { Sparkles, Download, Upload, Plus, Bell, Sun, Moon } from 'lucide-react';
import { AppNotification } from '../../types';

interface NavbarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenQuickCapture: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  userName: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onOpenQuickCapture,
  onExportBackup,
  onImportBackup,
  notifications,
  onOpenNotifications,
  userName,
  theme,
  onToggleTheme,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-white/70 dark:bg-[#070e0a]/80 border-b border-slate-200/80 dark:border-white/[0.08] px-4 md:px-8 py-3 flex items-center justify-between gap-8 transition-colors duration-200 shadow-sm dark:shadow-none">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onNavigate('personal_dashboard')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-[#080d14] rounded-[14px] flex items-center justify-center transition-colors">
              <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white block">
              Segundo Cerebro <span className="text-blue-600 dark:text-blue-400 font-semibold">4.0</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block tracking-tight font-medium">
              Centro de Hábitos, Introspección & Metas
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Zen Apple Actions & Prominent Theme Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Capture Button (Primary Action) */}
        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
          title="Captura Rápida (Cmd + K)"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Capturar</span>
          <span className="hidden sm:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-semibold text-white/90">⌘K</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.1] hidden sm:block" />

        {/* Prominent Apple Liquid Glass Theme Switcher (Claro / Oscuro) */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-slate-200/60 dark:bg-white/[0.08] hover:bg-slate-300/60 dark:hover:bg-white/[0.14] border border-slate-300/70 dark:border-white/[0.12] text-slate-800 dark:text-slate-100 transition-all cursor-pointer shadow-xs active:scale-95 group"
          title={theme === 'dark' ? 'Cambiar a Modo Claro (Liquid Glass)' : 'Cambiar a Modo Oscuro (Apple Dark Pro)'}
          aria-label="Alternar Modo Claro / Modo Oscuro"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span className="text-xs font-semibold text-amber-400 hidden sm:inline">Modo Oscuro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform" />
              <span className="text-xs font-semibold text-indigo-700 hidden sm:inline">Modo Claro</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.1] hidden sm:block" />

        {/* Backups & Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={onExportBackup}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            title="Exportar Respaldo JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            title="Importar Respaldo JSON"
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

          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-300 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {userName.charAt(0)}
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden md:inline truncate max-w-[120px]">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
};
