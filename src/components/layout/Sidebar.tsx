import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { NAV_SECTIONS, findSectionByView } from './navConfig';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const WEB_COLLAPSIBLE_SECTIONS = new Set(['vida_personal', 'vida_empresarial']);

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
}) => {
  // Web (>= 1024px): only Vida Personal & Vida Empresarial are independently collapsible
  const [desktopOpenSections, setDesktopOpenSections] = useState<Record<string, boolean>>(() => {
    const initialSection = findSectionByView(activeView);
    return {
      vida_personal: initialSection === 'vida_personal',
      vida_empresarial: initialSection === 'vida_empresarial',
    };
  });

  useEffect(() => {
    const matchingSection = findSectionByView(activeView);
    if (!matchingSection) return;

    if (WEB_COLLAPSIBLE_SECTIONS.has(matchingSection)) {
      setDesktopOpenSections((prev) =>
        prev[matchingSection] ? prev : { ...prev, [matchingSection]: true }
      );
    }
  }, [activeView]);

  const handleToggleSection = (sectionId: string) => {
    if (!WEB_COLLAPSIBLE_SECTIONS.has(sectionId)) return;
    setDesktopOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <aside className="hidden lg:flex w-64 backdrop-blur-2xl bg-white/70 dark:bg-[#080b11]/90 border-r border-slate-200/80 dark:border-white/[0.08] flex-col justify-between shadow-lg dark:shadow-2xl shrink-0">
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
        {NAV_SECTIONS.map((section) => {
          const isCollapsible = WEB_COLLAPSIBLE_SECTIONS.has(section.id);
          const isExpanded = !isCollapsible || Boolean(desktopOpenSections[section.id]);

            const hasActiveItem = section.items.some(
              (item) =>
                activeView === item.id ||
                (activeView === 'spiritual_emotional' && item.id === 'spiritual')
            );

            return (
              <div key={section.id} className="space-y-1">
                {isCollapsible ? (
                  <button
                    type="button"
                    onClick={() => handleToggleSection(section.id)}
                    aria-expanded={isExpanded}
                    className={`w-full flex items-center justify-between px-3 py-2 lg:py-1.5 rounded-xl text-[11px] font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
                      hasActiveItem
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <span className="text-left truncate">{section.title}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </button>
                ) : (
                  <span className="block px-3 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    {section.title}
                  </span>
                )}

                {isExpanded && (
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        activeView === item.id ||
                        (activeView === 'spiritual_emotional' && item.id === 'spiritual');
                      return (
                        <button
                          key={item.id}
                          onClick={() => onNavigate(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 min-h-[44px] lg:min-h-0 rounded-2xl text-xs font-medium transition-all group cursor-pointer border ${
                            isActive
                              ? `${item.activeClass} font-semibold backdrop-blur-xl`
                              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? item.colorClass
                                  : 'text-slate-400 dark:text-slate-500 group-hover:' + item.colorClass
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                                isActive
                                  ? item.dotColor + ' opacity-100'
                                  : 'opacity-0 group-hover:opacity-60 ' + item.dotColor
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Clean Signature */}
        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-3 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-100/50 dark:bg-black/40">
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
  );
};
