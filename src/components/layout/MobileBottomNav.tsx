import React from 'react';
import { Compass, TrendingUp, Plus, CheckSquare, LayoutGrid } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenQuickActionSheet: () => void;
  onOpenModulesMenu: () => void;
  isQuickActionOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavigate,
  onOpenQuickActionSheet,
  onOpenModulesMenu,
  isQuickActionOpen,
}) => {
  const isMiDiaActive = activeView === 'mi_dia' && !isQuickActionOpen;
  const isPilaresActive = activeView === 'personal_dashboard' && !isQuickActionOpen;
  const isTasksActive = activeView === 'tasks_general' && !isQuickActionOpen;
  const isOtherModuleActive =
    !isQuickActionOpen &&
    (activeView === 'mobile_modules' ||
      (activeView !== 'mi_dia' &&
        activeView !== 'personal_dashboard' &&
        activeView !== 'tasks_general'));

  return (
    <nav
      aria-label="Navegación principal móvil"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden backdrop-blur-2xl bg-white/92 dark:bg-[#080b11]/94 border-t border-slate-200/80 dark:border-white/[0.08] pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="grid grid-cols-5 items-center h-14 px-1">
        {/* 1. Mi Día */}
        <button
          type="button"
          onClick={() => onNavigate('mi_dia')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition-colors cursor-pointer active:scale-95 ${
            isMiDiaActive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Compass className={`w-5 h-5 ${isMiDiaActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5 whitespace-nowrap">
            Mi Día
          </span>
        </button>

        {/* 2. 5 Pilares */}
        <button
          type="button"
          onClick={() => onNavigate('personal_dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition-colors cursor-pointer active:scale-95 ${
            isPilaresActive
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${isPilaresActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5 whitespace-nowrap">
            Pilares
          </span>
        </button>

        {/* 3. Center Main Purple Button: Módulos Launcher */}
        <div className="flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={onOpenModulesMenu}
            aria-label="Abrir todos los módulos"
            className={`w-11 h-11 -mt-3.5 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/35 flex items-center justify-center active:scale-95 transition-transform cursor-pointer border ${
              isOtherModuleActive ? 'border-white/50 ring-2 ring-purple-400/50' : 'border-white/20'
            }`}
          >
            <LayoutGrid className="w-5 h-5 stroke-[2.3]" />
          </button>
          <span
            className={`text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap leading-none ${
              isOtherModuleActive
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Módulos
          </span>
        </div>

        {/* 4. Gestión de Tareas */}
        <button
          type="button"
          onClick={() => onNavigate('tasks_general')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition-colors cursor-pointer active:scale-95 ${
            isTasksActive
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className={`w-5 h-5 ${isTasksActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5 whitespace-nowrap">
            Tareas
          </span>
        </button>

        {/* 5. Quick Strategic Meeting / Capture (+) */}
        <button
          type="button"
          onClick={onOpenQuickActionSheet}
          aria-label="Grabar junta estratégica o captura rápida"
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition-colors cursor-pointer active:scale-95 ${
            isQuickActionOpen
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Plus className="w-5 h-5 stroke-[2.4]" />
          <span className="text-[10px] font-semibold tracking-tight mt-0.5 whitespace-nowrap">
            Junta / +
          </span>
        </button>
      </div>
    </nav>
  );
};
