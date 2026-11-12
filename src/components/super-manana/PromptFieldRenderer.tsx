import React from 'react';
import { PromptField } from '../../types/super-morning';

interface PromptFieldRendererProps {
  field: PromptField;
  value: any;
  onChange: (val: any) => void;
}

export const PromptFieldRenderer: React.FC<PromptFieldRendererProps> = ({
  field,
  value,
  onChange,
}) => {
  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">{field.label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            className="w-full bg-[#08100c] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">{field.label}</label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            rows={3}
            className="w-full bg-[#08100c] border border-emerald-500/20 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-colors resize-none"
          />
        </div>
      );

    case 'bullets':
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 block">{field.label}</label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Escribe tus puntos línea por línea...'}
            rows={4}
            className="w-full bg-[#08100c] border border-emerald-500/20 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 transition-colors resize-none font-mono"
          />
          <span className="text-[10px] text-slate-500 block">Un punto por línea para máxima claridad.</span>
        </div>
      );

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
          <label className="text-xs font-semibold text-emerald-400 block">{field.label}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-300 block">
                {field.leftLabel || 'Bajo mi control'}
              </span>
              <textarea
                value={leftVal}
                onChange={(e) => handleLeft(e.target.value)}
                rows={3}
                placeholder="Mi enfoque, mi respuesta serena, mi honestidad..."
                className="w-full bg-[#08100c] border border-emerald-500/20 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 block">
                {field.rightLabel || 'Fuera de mi control (Acepto y suelto)'}
              </span>
              <textarea
                value={rightVal}
                onChange={(e) => handleRight(e.target.value)}
                rows={3}
                placeholder="Decisiones del cliente, tráfico, mercado, opiniones..."
                className="w-full bg-[#08100c] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-600 resize-none"
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
          <label className="text-xs font-medium text-slate-300 block">{field.label}</label>
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
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                      : 'bg-[#08100c] border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-slate-700 bg-slate-900/50'
                    }`}
                  >
                    {isChecked && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="flex-1">{opt}</span>
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
