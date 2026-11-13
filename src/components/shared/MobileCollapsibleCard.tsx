import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface MobileCollapsibleCardProps {
  title: string;
  summary: string;
  icon: React.ReactNode;
  defaultOpenMobile?: boolean;
  children: React.ReactNode;
}

export const MobileCollapsibleCard: React.FC<MobileCollapsibleCardProps> = ({
  title,
  summary,
  icon,
  defaultOpenMobile = false,
  children,
}) => {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpenMobile);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (isDesktop) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-2xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full px-3.5 py-3 flex items-center justify-between gap-2.5 text-left cursor-pointer active:bg-slate-100/70 dark:active:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">{icon}</div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
              {title}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              {summary}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-slate-200/70 dark:border-white/[0.06]">
          {children}
        </div>
      )}
    </div>
  );
};
