import React from 'react';
import { PromptField } from '../../types/super-morning';

interface PromptFieldRendererProps {
  field: PromptField;
  value: any;
  onChange: (val: any) => void;
}

const countWords = (text: string): number => {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
};

export const PromptFieldRenderer: React.FC<PromptFieldRendererProps> = ({
  field,
  value,
  onChange,
}) => {
  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{field.label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            className="w-full bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      );

    case 'textarea': {
      const textVal = typeof value === 'string' ? value : '';
      const words = countWords(textVal);
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{field.label}</label>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
              {words} / 1000 palabras
            </span>
          </div>
          <textarea
            value={textVal}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Escribe ampliamente con total claridad (hasta ~1000 palabras)...'}
            rows={6}
            maxLength={7500}
            className="w-full min-h-[140px] bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl p-3.5 text-xs leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors resize-y"
          />
        </div>
      );
    }

    case 'bullets': {
      const bulletVal = typeof value === 'string' ? value : '';
      const words = countWords(bulletVal);
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{field.label}</label>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
              {words} / 1000 palabras
            </span>
          </div>
          <textarea
            value={bulletVal}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Escribe tus puntos línea por línea...'}
            rows={5}
            maxLength={7500}
            className="w-full min-h-[120px] bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl p-3.5 text-xs leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors resize-y font-sans"
          />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Un punto por línea para máxima claridad.</span>
        </div>
      );
    }

    case 'pair': {
      const leftVal = value?.left || '';
      const rightVal = value?.right || '';

      const handleLeft = (txt: string) => {
        onChange({ ...value, left: txt });
      };

      const handleRight = (txt: string) => {
        onChange({ ...value, right: txt });
      };

      return (
        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-600 dark:text-amber-400 block">{field.label}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">
                {field.leftLabel || 'Bajo mi control'}
              </span>
              <textarea
                value={leftVal}
                onChange={(e) => handleLeft(e.target.value)}
                rows={4}
                maxLength={7500}
                placeholder="Mi enfoque, mi respuesta serena, mi honestidad..."
                className="w-full min-h-[96px] bg-white/90 dark:bg-black/40 border border-amber-500/25 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 resize-y"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.08] space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                {field.rightLabel || 'Fuera de mi control (Acepto y suelto)'}
              </span>
              <textarea
                value={rightVal}
                onChange={(e) => handleRight(e.target.value)}
                rows={4}
                maxLength={7500}
                placeholder="Decisiones del cliente, tráfico, mercado, opiniones..."
                className="w-full min-h-[96px] bg-white/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 resize-y"
              />
            </div>
          </div>
        </div>
      );
    }

    case 'checkboxes': {
      const selectedList: string[] = Array.isArray(value) ? value : [];

      const toggleOption = (opt: string) => {
        if (selectedList.includes(opt)) {
          onChange(selectedList.filter((item) => item !== opt));
        } else {
          onChange([...selectedList, opt]);
        }
      };

      return (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{field.label}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(field.options || []).map((opt) => {
              const isChecked = selectedList.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200'
                      : 'bg-white/70 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-amber-400/40'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-amber-500 border-amber-400 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50'
                    }`}
                  >
                    {isChecked && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="flex-1 font-medium">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};
