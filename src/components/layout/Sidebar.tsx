import React from 'react';
import {
  Compass,
  Sun,
  Moon,
  Sparkles,
  Dumbbell,
  BookOpen,
  Brain,
  DollarSign,
  Building2,
  CheckSquare,
  TrendingUp,
  FolderGit2,
  Sliders,
  HeartHandshake,
  Heart,
  Layers,
  Flame,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  colorClass: string;
  activeClass: string;
  dotColor: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navSections: { title: string; items: NavItemConfig[] }[] = [
    {
      title: 'Centro Operativo',
      items: [
        {
          id: 'mi_dia',
          label: 'Mi Día',
          icon: Compass,
          colorClass: 'text-emerald-500 dark:text-emerald-400',
          activeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10',
          dotColor: 'bg-emerald-500 dark:bg-emerald-400',
        },
        {
          id: 'personal_dashboard',
          label: '5 Pilares de Crecimiento',
          icon: TrendingUp,
          colorClass: 'text-blue-500 dark:text-blue-400',
          activeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 shadow-sm shadow-blue-500/10',
          dotColor: 'bg-blue-500 dark:bg-blue-400',
        },
        {
          id: 'activation_center',
          label: 'Centro de Activación',
          icon: Sliders,
          colorClass: 'text-amber-500 dark:text-amber-400',
          activeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-sm',
          dotColor: 'bg-amber-500 dark:bg-amber-400',
        },
      ],
    },
    {
      title: 'Vida Personal',
      items: [
        {
          id: 'personal',
          label: 'Personal',
          icon: Heart,
          colorClass: 'text-rose-500 dark:text-rose-400',
          activeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 shadow-sm shadow-rose-500/10',
          dotColor: 'bg-rose-500 dark:bg-rose-400',
        },
        {
          id: 'habits_goals',
          label: 'Hábitos & Metas',
          icon: Flame,
          colorClass: 'text-rose-500 dark:text-rose-400',
          activeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 shadow-sm',
          dotColor: 'bg-rose-500 dark:bg-rose-400',
        },
        {
          id: 'super_morning',
          label: 'Súper Mañana',
          icon: Sun,
          colorClass: 'text-amber-500 dark:text-amber-400',
          activeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-sm',
          dotColor: 'bg-amber-500 dark:bg-amber-400',
        },
        {
          id: 'super_night',
          label: 'Súper Noche',
          icon: Moon,
          colorClass: 'text-indigo-500 dark:text-indigo-400',
          activeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-sm',
          dotColor: 'bg-indigo-500 dark:bg-indigo-400',
        },
        {
          id: 'tasks_general',
          label: 'Gestión de Tareas',
          icon: CheckSquare,
          colorClass: 'text-teal-500 dark:text-teal-400',
          activeClass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 shadow-sm',
          dotColor: 'bg-teal-500 dark:bg-teal-400',
        },
        {
          id: 'personal_finances',
          label: 'Finanzas Personales',
          icon: DollarSign,
          colorClass: 'text-emerald-500 dark:text-emerald-400',
          activeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-sm',
          dotColor: 'bg-emerald-500 dark:bg-emerald-400',
        },
        {
          id: 'physical_trainer',
          label: 'Mi Entrenador Físico',
          icon: Dumbbell,
          colorClass: 'text-lime-600 dark:text-lime-400',
          activeClass: 'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30 shadow-sm',
          dotColor: 'bg-lime-500 dark:bg-lime-400',
        },
        {
          id: 'wisdom_library',
          label: 'Biblioteca de Sabiduría',
          icon: BookOpen,
          colorClass: 'text-yellow-600 dark:text-yellow-400',
          activeClass: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 shadow-sm',
          dotColor: 'bg-yellow-500 dark:bg-yellow-400',
        },
        {
          id: 'mindset',
          label: 'Mentalidad & IA Coach',
          icon: Sparkles,
          colorClass: 'text-cyan-500 dark:text-cyan-400',
          activeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 shadow-sm',
          dotColor: 'bg-cyan-500 dark:bg-cyan-400',
        },
        {
          id: 'spiritual_emotional',
          label: 'Espiritual & Emocional',
          icon: HeartHandshake,
          colorClass: 'text-pink-500 dark:text-pink-400',
          activeClass: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30 shadow-sm',
          dotColor: 'bg-pink-500 dark:bg-pink-400',
        },
      ],
    },
    {
      title: 'Vida Empresarial',
      items: [
        {
          id: 'business',
          label: 'Multi-Negocio & Proyectos',
          icon: Building2,
          colorClass: 'text-blue-500 dark:text-blue-400',
          activeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 shadow-sm',
          dotColor: 'bg-blue-500 dark:bg-blue-400',
        },
        {
          id: 'strategy',
          label: 'Dirección & Estrategia',
          icon: Layers,
          colorClass: 'text-indigo-500 dark:text-indigo-400',
          activeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-sm',
          dotColor: 'bg-indigo-500 dark:bg-indigo-400',
        },
      ],
    },
    {
      title: 'Segundo Cerebro',
      items: [
        {
          id: 'second_brain',
          label: 'Captura & Conocimiento',
          icon: Brain,
          colorClass: 'text-violet-500 dark:text-violet-400',
          activeClass: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30 shadow-sm',
          dotColor: 'bg-violet-500 dark:bg-violet-400',
        },
        {
          id: 'backup_settings',
          label: 'Respaldos & Seguridad',
          icon: FolderGit2,
          colorClass: 'text-slate-600 dark:text-slate-300',
          activeClass: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-sm',
          dotColor: 'bg-slate-500 dark:bg-slate-400',
        },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 backdrop-blur-2xl bg-white/70 dark:bg-[#080b11]/90 border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-lg dark:shadow-2xl ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <span className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {section.title}
              </span>

              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-medium transition-all group cursor-pointer border ${
                        isActive
                          ? `${item.activeClass} font-semibold backdrop-blur-xl`
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? item.colorClass : 'text-slate-400 dark:text-slate-500 group-hover:' + item.colorClass
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                            isActive ? item.dotColor + ' opacity-100' : 'opacity-0 group-hover:opacity-60 ' + item.dotColor
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Clean Signature */}
        <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-100/50 dark:bg-black/40">
          <div className="p-2.5 rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/[0.06] text-center">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              5 Dimensiones de Vida
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Espiritual · Emocional · Físico · Intelecto · Negocios
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
