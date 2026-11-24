import React, { useMemo, useState } from 'react';
import { NotebookPen, Plus, Link2, ArrowUpRight, X } from 'lucide-react';
import { AppStoreData } from '../../services/storage';
import { PersonalNote } from '../../types';

export type NoteLinkEntityType = 'project' | 'task' | 'experiment' | 'business';

interface LinkedNotesPanelProps {
  entityType: NoteLinkEntityType;
  entityId: string;
  entityLabel: string;
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenNote?: (noteId: string) => void;
  compact?: boolean;
}

function getLinkArray(note: PersonalNote, type: NoteLinkEntityType): string[] {
  switch (type) {
    case 'project':
      return note.linkedProjectIds || [];
    case 'task':
      return note.linkedTaskIds || [];
    case 'experiment':
      return note.linkedExperimentIds || [];
    case 'business':
      return note.linkedBusinessIds || [];
  }
}

function withUpdatedLink(
  note: PersonalNote,
  type: NoteLinkEntityType,
  entityId: string,
  shouldLink: boolean
): PersonalNote {
  const current = new Set(getLinkArray(note, type));
  if (shouldLink) current.add(entityId);
  else current.delete(entityId);
  const nextArr = Array.from(current);
  switch (type) {
    case 'project':
      return { ...note, linkedProjectIds: nextArr };
    case 'task':
      return { ...note, linkedTaskIds: nextArr };
    case 'experiment':
      return { ...note, linkedExperimentIds: nextArr };
    case 'business':
      return { ...note, linkedBusinessIds: nextArr };
  }
}

function cleanPreview(content: string, title: string): string {
  const line = content
    .split('\n')
    .map((l) =>
      l
        .replace(/^#+\s*/, '')
        .replace(/^\s*-\s*\[[ xX]\]\s*/, '')
        .replace(/^[-•*]\s*/, '')
        .replace(/\{[ch]:[a-z]+\}|\{\/[ch]\}/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .trim()
    )
    .find((l) => l && l !== title);
  return line || 'Hoja de notas vinculada';
}

export const LinkedNotesPanel: React.FC<LinkedNotesPanelProps> = ({
  entityType,
  entityId,
  entityLabel,
  data,
  onUpdateData,
  onOpenNote,
  compact = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const allNotes = data.personalNotes || [];

  const linkedNotes = useMemo(
    () => allNotes.filter((n) => getLinkArray(n, entityType).includes(entityId)),
    [allNotes, entityType, entityId]
  );

  const unlinkedNotes = useMemo(
    () => allNotes.filter((n) => !getLinkArray(n, entityType).includes(entityId)),
    [allNotes, entityType, entityId]
  );

  const handleToggleLink = (noteId: string, shouldLink: boolean) => {
    const nowIso = new Date().toISOString();
    onUpdateData((prev) => ({
      ...prev,
      personalNotes: (prev.personalNotes || []).map((n) =>
        n.id === noteId
          ? { ...withUpdatedLink(n, entityType, entityId, shouldLink), updatedAt: nowIso }
          : n
      ),
    }));
  };

  const handleCreateLinkedNote = () => {
    const nowIso = new Date().toISOString();
    const baseNote: PersonalNote = {
      id: `pnote_${Date.now()}`,
      title: `Notas: ${entityLabel}`.slice(0, 80),
      category:
        entityType === 'experiment'
          ? 'personal'
          : entityType === 'project' || entityType === 'business'
          ? 'ideas'
          : 'general',
      pinned: false,
      paperStyle: 'dotted',
      paperTone: 'system',
      fontFamily: 'sans',
      fontSize: 'md',
      floatingBoxes: [],
      embeddedImages: [],
      inkStrokes: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      content: `# ${entityLabel}\n\n- [ ] Escribe tus apuntes, acuerdos o hallazgos aquí...`,
    };
    const linkedNote = withUpdatedLink(baseNote, entityType, entityId, true);

    onUpdateData((prev) => ({
      ...prev,
      personalNotes: [linkedNote, ...(prev.personalNotes || [])],
    }));
    setShowPicker(false);
    if (onOpenNote) {
      onOpenNote(linkedNote.id);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] ${
        compact ? 'p-3 space-y-2' : 'p-4 space-y-3'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
          <NotebookPen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Notas Enlazadas</span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            ({linkedNotes.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {unlinkedNotes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPicker((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-white/[0.07] hover:bg-indigo-500/15 border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Link2 className="w-3 h-3 text-indigo-500" />
              <span>Enlazar existente</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCreateLinkedNote}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Nueva Nota</span>
          </button>
        </div>
      </div>

      {/* Picker for Existing Notes */}
      {showPicker && unlinkedNotes.length > 0 && (
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-1 max-h-40 overflow-y-auto">
          {unlinkedNotes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => {
                handleToggleLink(note.id, true);
                setShowPicker(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <span className="truncate font-semibold">{note.title || 'Sin título'}</span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                + Enlazar
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Linked Notes List */}
      {linkedNotes.length === 0 ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Sin notas vinculadas todavía. Enlaza una nota existente o crea una libreta nueva para este elemento.
        </p>
      ) : (
        <div className="space-y-1.5">
          {linkedNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/90 dark:bg-slate-900/75 border border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-400/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => onOpenNote?.(note.id)}
                className="flex-1 min-w-0 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {note.title || 'Sin título'}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-indigo-500 shrink-0 opacity-70 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {cleanPreview(note.content, note.title)}
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleToggleLink(note.id, false)}
                title="Quitar enlace de esta nota"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
