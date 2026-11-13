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
  Bot,
  FlaskConical,
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  colorClass: string;
  activeClass: string;
  dotColor: string;
}

export interface NavSectionConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
}

export const NAV_SECTIONS: NavSectionConfig[] = [
  {
    id: 'centro_operativo',
    title: 'Centro Operativo',
    items: [
      {
        id: 'mi_dia',
        label: 'Mi Día',
        shortLabel: 'Mi Día',
        icon: Compass,
        colorClass: 'text-emerald-500 dark:text-emerald-400',
        activeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10',
        dotColor: 'bg-emerald-500 dark:bg-emerald-400',
      },
      {
        id: 'second_brain',
        label: 'Bandeja de Recordatorios',
        shortLabel: 'Recordatorios',
        icon: Brain,
        colorClass: 'text-violet-500 dark:text-violet-400',
        activeClass: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30 shadow-sm shadow-violet-500/10',
        dotColor: 'bg-violet-500 dark:bg-violet-400',
      },
      {
        id: 'ai_assistant',
        label: 'Asistente IA del Sistema',
        shortLabel: 'Asistente IA',
        icon: Bot,
        colorClass: 'text-cyan-500 dark:text-cyan-400',
        activeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 shadow-sm shadow-cyan-500/10',
        dotColor: 'bg-cyan-500 dark:bg-cyan-400',
      },
      {
        id: 'personal_dashboard',
        label: '5 Pilares de Crecimiento',
        shortLabel: '5 Pilares',
        icon: TrendingUp,
        colorClass: 'text-blue-500 dark:text-blue-400',
        activeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 shadow-sm shadow-blue-500/10',
        dotColor: 'bg-blue-500 dark:bg-blue-400',
      },
      {
        id: 'activation_center',
        label: 'Centro de Activación',
        shortLabel: 'Activación',
        icon: Sliders,
        colorClass: 'text-amber-500 dark:text-amber-400',
        activeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-sm',
        dotColor: 'bg-amber-500 dark:bg-amber-400',
      },
    ],
  },
  {
    id: 'mis_5_pilares',
    title: 'Mis 5 Pilares de Crecimiento',
    items: [
      {
        id: 'spiritual',
        label: 'Espiritual',
        icon: Compass,
        colorClass: 'text-purple-500 dark:text-purple-400',
        activeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 shadow-sm',
        dotColor: 'bg-purple-500 dark:bg-purple-400',
      },
      {
        id: 'emotional',
        label: 'Emocional',
        icon: HeartHandshake,
        colorClass: 'text-pink-500 dark:text-pink-400',
        activeClass: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30 shadow-sm',
        dotColor: 'bg-pink-500 dark:bg-pink-400',
      },
      {
        id: 'physical_trainer',
        label: 'Mi Entrenador Físico',
        shortLabel: 'Entrenador Físico',
        icon: Dumbbell,
        colorClass: 'text-lime-600 dark:text-lime-400',
        activeClass: 'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30 shadow-sm',
        dotColor: 'bg-lime-500 dark:bg-lime-400',
      },
      {
        id: 'wisdom_library',
        label: 'Biblioteca de Sabiduría',
        shortLabel: 'Sabiduría',
        icon: BookOpen,
        colorClass: 'text-yellow-600 dark:text-yellow-400',
        activeClass: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 shadow-sm',
        dotColor: 'bg-yellow-500 dark:bg-yellow-400',
      },
      {
        id: 'personal_finances',
        label: 'Finanzas Personales',
        shortLabel: 'Finanzas',
        icon: DollarSign,
        colorClass: 'text-emerald-500 dark:text-emerald-400',
        activeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-sm',
        dotColor: 'bg-emerald-500 dark:bg-emerald-400',
      },
    ],
  },
  {
    id: 'vida_personal',
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
        id: 'personal_experiments',
        label: 'Experimentos Personales',
        shortLabel: 'Experimentos',
        icon: FlaskConical,
        colorClass: 'text-fuchsia-500 dark:text-fuchsia-400',
        activeClass: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30 shadow-sm shadow-fuchsia-500/10',
        dotColor: 'bg-fuchsia-500 dark:bg-fuchsia-400',
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
        shortLabel: 'Tareas',
        icon: CheckSquare,
        colorClass: 'text-sky-500 dark:text-sky-400',
        activeClass: 'bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-indigo-500/20 text-sky-700 dark:text-sky-300 border-sky-500/35 shadow-sm shadow-sky-500/10',
        dotColor: 'bg-gradient-to-r from-sky-500 to-indigo-500',
      },
      {
        id: 'mindset',
        label: 'Mentalidad & IA Coach',
        shortLabel: 'Mentalidad IA',
        icon: Sparkles,
        colorClass: 'text-cyan-500 dark:text-cyan-400',
        activeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 shadow-sm',
        dotColor: 'bg-cyan-500 dark:bg-cyan-400',
      },
    ],
  },
  {
    id: 'vida_empresarial',
    title: 'Vida Empresarial',
    items: [
      {
        id: 'business',
        label: 'Multi-Negocio & Proyectos',
        shortLabel: 'Multi-Negocio',
        icon: Building2,
        colorClass: 'text-blue-500 dark:text-blue-400',
        activeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 shadow-sm',
        dotColor: 'bg-blue-500 dark:bg-blue-400',
      },
      {
        id: 'strategy',
        label: 'Dirección & Estrategia',
        shortLabel: 'Estrategia',
        icon: Layers,
        colorClass: 'text-indigo-500 dark:text-indigo-400',
        activeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-sm',
        dotColor: 'bg-indigo-500 dark:bg-indigo-400',
      },
    ],
  },
  {
    id: 'sistema_respaldo',
    title: 'Sistema & Respaldo',
    items: [
      {
        id: 'backup_settings',
        label: 'Respaldos & Seguridad',
        shortLabel: 'Respaldos',
        icon: FolderGit2,
        colorClass: 'text-slate-600 dark:text-slate-300',
        activeClass: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-sm',
        dotColor: 'bg-slate-500 dark:bg-slate-400',
      },
    ],
  },
];

export const findSectionByView = (viewId: string): string | null => {
  const normalizedViewId = viewId === 'spiritual_emotional' ? 'spiritual' : viewId;
  const found = NAV_SECTIONS.find((section) =>
    section.items.some((item) => item.id === normalizedViewId)
  );
  return found ? found.id : NAV_SECTIONS[0].id;
};

export const getNavItemMeta = (viewId: string): NavItemConfig => {
  const normalizedViewId = viewId === 'spiritual_emotional' ? 'spiritual' : viewId;
  for (const section of NAV_SECTIONS) {
    const match = section.items.find((item) => item.id === normalizedViewId);
    if (match) return match;
  }
  return NAV_SECTIONS[0].items[0];
};
