import React, { useState, useEffect } from 'react';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NAV_SECTIONS, findSectionByView } from './navConfig';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const WEB_COLLAPSIBLE_SECTIONS = new Set(['vida_personal']);

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  // Web (>= 1024px): Vida Personal is collapsible
  const [desktopOpenSections, setDesktopOpenSections] = useState<Record<string, boolean>>(() => {
    const initialSection = findSectionByView(activeView);
    return {
      vida_personal: initialSection === 'vida_personal',
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
    <aside
      className={`hidden lg:flex h-full backdrop-blur-2xl bg-white/70 dark:bg-[#080b11]/90 border-r border-slate-200/80 dark:border-white/[0.08] flex-col justify-between shadow-lg dark:shadow-2xl shrink-0 transition-[width] duration-200 ease-out ${
        isCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Top Collapse Toggle */}
      {onToggleCollapse && (
        <div
          className={`flex items-center border-b border-slate-200/70 dark:border-white/[0.06] px-3 py-2 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">
              Menú
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir menú lateral' : 'Minimizar menú lateral'}
            aria-label={isCollapsed ? 'Expandir menú lateral' : 'Minimizar menú lateral'}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <div className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? 'px-2 space-y-3' : 'px-3 space-y-5'}`}>
        {NAV_SECTIONS.map((section) => {
          const isCollapsible = WEB_COLLAPSIBLE_SECTIONS.has(section.id);
          const isExpanded = isCollapsed || !isCollapsible || Boolean(desktopOpenSections[section.id]);

          const hasActiveItem = section.items.some(
            (item) =>
              activeView === item.id ||
              (activeView === 'spiritual_emotional' && item.id === 'spiritual')
          );

          return (
            <div key={section.id} className="space-y-1">
              {!isCollapsed ? (
                isCollapsible ? (
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
                )
              ) : (
                <div className="h-px bg-slate-200/70 dark:bg-white/[0.06] mx-2 first:hidden" />
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
                        type="button"
                        onClick={() => onNavigate(item.id)}
                        title={item.label}
                        aria-label={item.label}
                        className={`w-full flex items-center rounded-2xl text-xs font-medium transition-all group cursor-pointer border ${
                          isCollapsed
                            ? 'justify-center px-0 py-2.5'
                            : 'justify-between px-3 py-2.5 lg:py-2 min-h-[44px] lg:min-h-0'
                        } ${
                          isActive
                            ? `${item.activeClass} font-semibold backdrop-blur-xl`
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? item.colorClass
                                : 'text-slate-400 dark:text-slate-500 group-hover:' + item.colorClass
                            }`}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                                isActive
                                  ? item.dotColor + ' opacity-100'
                                  : 'opacity-0 group-hover:opacity-60 ' + item.dotColor
                              }`}
                            />
                          </div>
                        )}
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
      {!isCollapsed && (
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
      )}
    </aside>
  );
};
