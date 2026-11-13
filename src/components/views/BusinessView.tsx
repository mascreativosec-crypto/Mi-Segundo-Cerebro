import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AppStoreData } from '../../services/storage';
import {
  Business,
  BusinessProject,
  BusinessTask,
  Goal,
  TaskSubtask,
  TeamMember,
} from '../../types';
import {
  Building2,
  Plus,
  Trash2,
  BellRing,
  CheckSquare,
  Square,
  ListChecks,
  X,
  Calendar,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  Target,
  CheckCircle2,
  FolderKanban,
  Mic,
  MicOff,
  Link2,
  Mail,
  Send,
  Sparkles,
  UserPlus,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Columns3,
  Edit3,
} from 'lucide-react';

interface BusinessViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenQuickCapture: () => void;
  initialFocusTaskId?: string | null;
  onClearInitialFocusTask?: () => void;
}

const PRIORITY_BADGE: Record<BusinessTask['priority'], { label: string; cls: string }> = {
  urgent_important: {
    label: 'Urgente & Vital',
    cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25',
  },
  important: {
    label: 'Alto Impacto',
    cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25',
  },
  urgent: {
    label: 'Urgente',
    cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  normal: {
    label: 'Normal',
    cls: 'bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 border-slate-300/60 dark:border-white/10',
  },
};

const PROJECT_STATUS_LABEL: Record<BusinessProject['status'], string> = {
  planning: 'Planificación',
  in_progress: 'En Marcha',
  review: 'En Revisión',
  completed: 'Completado',
};

export const BusinessView: React.FC<BusinessViewProps> = ({
  data,
  onUpdateData,
  initialFocusTaskId,
  onClearInitialFocusTask,
}) => {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(
    data.businesses[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'projects_tasks' | 'team' | 'strategy'>('projects_tasks');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const kanbanRef = React.useRef<HTMLDivElement | null>(null);

  // Board View Mode (Kanban | Semana | Mes)
  const [boardViewMode, setBoardViewMode] = useState<'kanban' | 'week' | 'month'>('kanban');
  const [calendarCursor, setCalendarCursor] = useState<Date>(() => new Date());

  // Rich Kanban Task Creator & Editor state
  const [showFullTaskModal, setShowFullTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskModalStatus, setTaskModalStatus] = useState<BusinessTask['status']>('todo');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskResourceLink, setNewTaskResourceLink] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<BusinessTask['priority']>('important');
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTaskEstimatedMinutes, setNewTaskEstimatedMinutes] = useState<number>(30);
  const [newTaskRemind, setNewTaskRemind] = useState<boolean>(false);
  const [modalSubtasks, setModalSubtasks] = useState<TaskSubtask[]>([]);
  const [subtaskDraftInput, setSubtaskDraftInput] = useState('');
  const [isDictatingTask, setIsDictatingTask] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  // Inline Team Member Registration state
  const [showInlineMemberForm, setShowInlineMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [dispatchingTaskId, setDispatchingTaskId] = useState<string | null>(null);

  // Project modal & confirm delete
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState(5000);
  const [newProjectDeadline, setNewProjectDeadline] = useState('2026-12-31');
  const [confirmDeleteProjId, setConfirmDeleteProjId] = useState<string | null>(null);

  // OKR / Goal creator + AI Advisor state
  const [showAddOkr, setShowAddOkr] = useState(false);
  const [okrTitle, setOkrTitle] = useState('');
  const [okrHorizon, setOkrHorizon] = useState<Goal['horizon']>('quarterly');
  const [okrProjectId, setOkrProjectId] = useState<string>('');
  const [okrTargetDate, setOkrTargetDate] = useState('2026-12-31');
  const [okrMilestonesText, setOkrMilestonesText] = useState('');
  const [showOkrAiPanel, setShowOkrAiPanel] = useState(false);
  const [isLoadingOkrAi, setIsLoadingOkrAi] = useState(false);
  const [okrSuggestions, setOkrSuggestions] = useState<
    Array<{
      title: string;
      horizon: Goal['horizon'];
      pillar: 'financiero' | 'intelectual' | 'fisico';
      kpiMetric: string;
      milestones: string[];
    }>
  >([]);

  // Business modal state
  const [showAddBiz, setShowAddBiz] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizSector, setNewBizSector] = useState('');
  const [newBizEmoji, setNewBizEmoji] = useState('💼');

  // Toast notice
  const [toast, setToast] = useState<string | null>(null);
  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const currentBusiness =
    data.businesses.find((b) => b.id === selectedBusinessId) || data.businesses[0];

  const businessProjects = data.projects.filter((p) => p.businessId === currentBusiness?.id);
  const businessTasks = data.tasks.filter((t) => t.businessId === currentBusiness?.id);
  const activeProject = activeProjectId
    ? businessProjects.find((p) => p.id === activeProjectId) || null
    : null;
  const kanbanTasks = activeProject
    ? businessTasks.filter((t) => t.projectId === activeProject.id)
    : businessTasks;
  const businessTeam = data.teamMembers.filter((m) => m.businessId === currentBusiness?.id);
  const businessDecisions = data.strategicDecisions.filter(
    (d) => d.businessId === currentBusiness?.id || (!d.businessId && (!d.scopeTags || d.scopeTags.includes('business')))
  );
  const businessGoals = data.goals.filter(
    (g) => g.businessId === currentBusiness?.id || (!g.businessId && g.pillar === 'financiero')
  );
  const filteredBusinessGoals = activeProject
    ? businessGoals.filter((g) => !g.projectId || g.projectId === activeProject.id)
    : businessGoals;

  const handleAddDraftSubtask = () => {
    if (!subtaskDraftInput.trim()) return;
    setModalSubtasks((prev) => [
      ...prev,
      {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        text: subtaskDraftInput.trim(),
        done: false,
      },
    ]);
    setSubtaskDraftInput('');
  };

  const handleToggleModalSubtask = (subId: string) => {
    setModalSubtasks((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, done: !s.done } : s))
    );
  };

  const openTaskModal = (task?: BusinessTask, presetDueDate?: string) => {
    if (task) {
      setEditingTaskId(task.id);
      setTaskModalStatus(task.status);
      setNewTaskTitle(task.title);
      setNewTaskDescription(task.description || '');
      setNewTaskResourceLink(task.resourceLink || '');
      setNewTaskAssignee(task.delegatedToId || '');
      setNewTaskPriority(task.priority);
      setNewTaskProjectId(task.projectId || '');
      setNewTaskDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
      setNewTaskEstimatedMinutes(task.estimatedMinutes || 30);
      setNewTaskRemind(Boolean(task.remindInInbox));
      setModalSubtasks((task.subtasks || []).map((st) => ({ ...st })));
    } else {
      setEditingTaskId(null);
      setTaskModalStatus('todo');
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskResourceLink('');
      setNewTaskAssignee('');
      setNewTaskPriority('important');
      setNewTaskProjectId(activeProject?.id || businessProjects[0]?.id || '');
      setNewTaskDueDate(presetDueDate || new Date().toISOString().split('T')[0]);
      setNewTaskEstimatedMinutes(30);
      setNewTaskRemind(false);
      setModalSubtasks([]);
    }
    setSubtaskDraftInput('');
    setShowInlineMemberForm(false);
    setShowFullTaskModal(true);
  };

  React.useEffect(() => {
    if (!initialFocusTaskId) return;
    const targetTask = data.tasks.find((t) => t.id === initialFocusTaskId);
    if (targetTask) {
      if (targetTask.businessId) {
        setSelectedBusinessId(targetTask.businessId);
      }
      setActiveTab('projects_tasks');
      setBoardViewMode('kanban');
      setActiveProjectId(targetTask.projectId || null);
      openTaskModal(targetTask);
      setTimeout(() => {
        kanbanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
    }
    onClearInitialFocusTask?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFocusTaskId]);

  const calculateWeightedProjectProgress = (
    proj: BusinessProject,
    tasks: BusinessTask[]
  ): number => {
    const linked = tasks.filter((t) => t.projectId === proj.id);
    if (linked.length === 0) {
      return proj.status === 'completed' ? 100 : proj.progressPercent;
    }
    const weightedSum = linked.reduce((acc, t) => {
      if (t.status === 'done') return acc + 1;
      if (t.status === 'in_progress') return acc + 0.5;
      return acc;
    }, 0);
    return Math.round((weightedSum / linked.length) * 100);
  };

  // Helper to sync project progressPercent automatically when linked tasks change (done=100%, in_progress=50%)
  const syncProjectsProgressFromTasks = (
    projects: BusinessProject[],
    tasks: BusinessTask[],
    affectedProjectId?: string
  ): BusinessProject[] => {
    if (!affectedProjectId) return projects;
    const linked = tasks.filter((t) => t.projectId === affectedProjectId);
    if (linked.length === 0) {
      return projects.map((p) =>
        p.id === affectedProjectId ? { ...p, progressPercent: 0 } : p
      );
    }
    const weightedSum = linked.reduce((acc, t) => {
      if (t.status === 'done') return acc + 1;
      if (t.status === 'in_progress') return acc + 0.5;
      return acc;
    }, 0);
    const pct = Math.round((weightedSum / linked.length) * 100);
    return projects.map((p) =>
      p.id === affectedProjectId
        ? {
            ...p,
            progressPercent: pct,
            status: pct === 100 ? 'completed' : p.status === 'completed' ? 'in_progress' : p.status,
          }
        : p
    );
  };

  const handleToggleVoiceDictation = () => {
    if (isDictatingTask && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsDictatingTask(false);
      return;
    }
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      notify('Tu navegador no soporta dictado por voz directo. Puedes escribir o pegar la nota.');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
      if (transcript.trim()) {
        setNewTaskDescription((prev) =>
          prev.trim() ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()
        );
      }
    };
    recognition.onerror = () => {
      setIsDictatingTask(false);
    };
    recognition.onend = () => {
      setIsDictatingTask(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsDictatingTask(true);
  };

  const handleCreateTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !currentBusiness) return;
    const member: TeamMember = {
      id: `tm_${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Colaborador',
      email: newMemberEmail.trim() || 'pendiente@empresa.com',
      businessId: currentBusiness.id,
      delegatedTasksCount: 0,
    };
    onUpdateData((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, member],
    }));
    setNewTaskAssignee(member.id);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberEmail('');
    setShowInlineMemberForm(false);
    notify(`Responsable "${member.name}" registrado y listo para delegación.`);
  };

  const buildMailtoHref = (task: BusinessTask, assignee?: TeamMember | null) => {
    const to = assignee?.email || '';
    const subject = encodeURIComponent(`[${currentBusiness?.name || 'Negocio'}] Tarea delegada: ${task.title}`);
    const bodyLines = [
      `Hola ${assignee?.name || 'equipo'},`,
      '',
      `Te comparto esta tarea desde Segundo Cerebro 4.0:`,
      `• Título: ${task.title}`,
      `• Fecha límite: ${task.dueDate}`,
      task.description ? `• Detalle: ${task.description}` : '',
      task.resourceLink ? `• Recurso / Link: ${task.resourceLink}` : '',
      task.subtasks && task.subtasks.length > 0
        ? `• Subtareas:\n${task.subtasks.map((s) => `  - ${s.text}`).join('\n')}`
        : '',
      '',
      'Por favor confirma recepción.',
    ].filter(Boolean);
    return `mailto:${to}?subject=${subject}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  };

  const handleSendToExternalApp = async (task: BusinessTask, assignee?: TeamMember | null) => {
    setDispatchingTaskId(task.id);
    try {
      const payloadText = [
        `[${currentBusiness?.name || 'Empresa'}] Nueva delegación: ${task.title}`,
        assignee ? `Responsable: ${assignee.name} (${assignee.email})` : '',
        `Fecha límite: ${task.dueDate}`,
        task.description ? `Detalle: ${task.description}` : '',
        task.resourceLink ? `Link: ${task.resourceLink}` : '',
      ]
        .filter(Boolean)
        .join(' | ');
      const resp = await fetch('/api/integrations/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'business_delegation',
          sender: assignee?.email || assignee?.name || currentBusiness?.name || 'empresa',
          text: payloadText,
        }),
      });
      if (resp.ok) {
        notify(`Tarea "${task.title}" enviada al puente externo (WhatsApp/Slack/n8n).`);
      } else {
        notify('No se pudo despachar al puente externo.');
      }
    } catch {
      notify('Error de conexión con /api/integrations/webhook.');
    } finally {
      setDispatchingTaskId(null);
    }
  };

  const handleSuggestOkrs = async () => {
    if (!currentBusiness) return;
    setShowOkrAiPanel(true);
    setIsLoadingOkrAi(true);
    try {
      const resp = await fetch('/api/gemini/suggest-okrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: currentBusiness.name,
          sector: currentBusiness.sector,
          revenueTarget: currentBusiness.revenueTarget,
          actualRevenue: currentBusiness.actualRevenue,
          currentProjects: businessProjects.map((p) => ({
            name: p.name,
            status: p.status,
            progressPercent: calculateWeightedProjectProgress(p, businessTasks),
          })),
        }),
      });
      const dataJson = await resp.json();
      setOkrSuggestions(Array.isArray(dataJson.suggestions) ? dataJson.suggestions : []);
    } catch {
      notify('No se pudo consultar al Asistente IA de KPIs & OKRs.');
    } finally {
      setIsLoadingOkrAi(false);
    }
  };

  const handleAdoptSuggestedOkr = (sug: {
    title: string;
    horizon: Goal['horizon'];
    pillar: 'financiero' | 'intelectual' | 'fisico';
    kpiMetric: string;
    milestones: string[];
  }) => {
    if (!currentBusiness) return;
    const adopted: Goal = {
      id: `goal_ai_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title: `${sug.title} [KPI: ${sug.kpiMetric}]`,
      horizon: sug.horizon || 'quarterly',
      pillar: sug.pillar || 'financiero',
      businessId: currentBusiness.id,
      projectId: activeProject?.id || undefined,
      targetDate: '2026-12-31',
      progressPercent: 0,
      status: 'in_progress',
      milestones: (sug.milestones || []).map((m, idx) => ({
        id: `ms_${Date.now()}_${idx}`,
        text: m,
        done: false,
      })),
    };
    onUpdateData((prev) => ({
      ...prev,
      goals: [adopted, ...prev.goals],
    }));
    notify(`OKR "${sug.title}" adoptado en tu tablero estratégico.`);
  };

  const handleSelectProjectForKanban = (projId: string) => {
    setActiveProjectId(projId);
    setNewTaskProjectId(projId);
    setTimeout(() => {
      kanbanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSaveTaskModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentBusiness) return;

    // Include pending text in subtask input if user typed one without pressing "+"
    const finalSubtasks: TaskSubtask[] = subtaskDraftInput.trim()
      ? [
          ...modalSubtasks,
          {
            id: `sub_${Date.now()}_pending`,
            text: subtaskDraftInput.trim(),
            done: false,
          },
        ]
      : modalSubtasks;

    const effectiveProjectId = newTaskProjectId || (!editingTaskId ? activeProject?.id : undefined) || undefined;

    if (editingTaskId) {
      const existing = data.tasks.find((t) => t.id === editingTaskId);
      const prevProjectId = existing?.projectId;

      onUpdateData((prev) => {
        const nextTasks = prev.tasks.map((t) =>
          t.id === editingTaskId
            ? {
                ...t,
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim() || undefined,
                resourceLink: newTaskResourceLink.trim() || undefined,
                projectId: effectiveProjectId,
                priority: newTaskPriority,
                status: taskModalStatus,
                completedAt:
                  taskModalStatus === 'done'
                    ? t.completedAt || new Date().toISOString()
                    : undefined,
                isDelegated: Boolean(newTaskAssignee),
                delegatedToId: newTaskAssignee || undefined,
                dueDate: newTaskDueDate || t.dueDate,
                estimatedMinutes: Number(newTaskEstimatedMinutes) || 30,
                subtasks: finalSubtasks.length > 0 ? finalSubtasks : undefined,
                remindInInbox: newTaskRemind,
              }
            : t
        );
        let nextProjects = syncProjectsProgressFromTasks(prev.projects, nextTasks, effectiveProjectId);
        if (prevProjectId && prevProjectId !== effectiveProjectId) {
          nextProjects = syncProjectsProgressFromTasks(nextProjects, nextTasks, prevProjectId);
        }

        const alreadyReminded = (prev.notesReminders || []).some((r) => r.linkedTaskId === editingTaskId);
        const nextReminders =
          newTaskRemind && !alreadyReminded
            ? [
                {
                  id: `nr_biz_${Date.now()}`,
                  title: newTaskTitle.trim(),
                  content: `Tarea de ${currentBusiness.name} · Vence: ${newTaskDueDate}`,
                  category: 'tarea' as const,
                  originModule: 'business' as const,
                  targetView: 'business',
                  linkedTaskId: editingTaskId,
                  reminderDate: newTaskDueDate,
                  showInMiDia: true,
                  completed: taskModalStatus === 'done',
                  pinned: newTaskPriority === 'urgent_important',
                  source: 'system' as const,
                  createdAt: new Date().toISOString(),
                },
                ...(prev.notesReminders || []),
              ]
            : prev.notesReminders;

        return {
          ...prev,
          tasks: nextTasks,
          projects: nextProjects,
          notesReminders: nextReminders,
        };
      });

      if (isDictatingTask && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsDictatingTask(false);
      }
      setEditingTaskId(null);
      setSubtaskDraftInput('');
      setModalSubtasks([]);
      setShowFullTaskModal(false);
      notify(`Tarea "${newTaskTitle.trim()}" actualizada.`);
      return;
    }

    const taskId = `task_${Date.now()}`;
    const newTask: BusinessTask = {
      id: taskId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      resourceLink: newTaskResourceLink.trim() || undefined,
      scope: 'business',
      businessId: currentBusiness.id,
      projectId: effectiveProjectId,
      priority: newTaskPriority,
      status: taskModalStatus,
      isDelegated: Boolean(newTaskAssignee),
      delegatedToId: newTaskAssignee || undefined,
      dueDate: newTaskDueDate || new Date().toISOString().split('T')[0],
      estimatedMinutes: Number(newTaskEstimatedMinutes) || 30,
      tags: ['Empresarial', currentBusiness.name],
      subtasks: finalSubtasks.length > 0 ? finalSubtasks : undefined,
      remindInInbox: newTaskRemind,
    };

    onUpdateData((prev) => {
      const nextTasks = [newTask, ...prev.tasks];
      const nextProjects = syncProjectsProgressFromTasks(prev.projects, nextTasks, effectiveProjectId);
      const nextReminders = newTaskRemind
        ? [
            {
              id: `nr_biz_${Date.now()}`,
              title: newTask.title,
              content: `Tarea de ${currentBusiness.name}${
                effectiveProjectId
                  ? ` · Proyecto: ${
                      prev.projects.find((p) => p.id === effectiveProjectId)?.name || ''
                    }`
                  : ''
              }`,
              category: 'tarea' as const,
              originModule: 'business' as const,
              targetView: 'business',
              linkedTaskId: taskId,
              reminderDate: newTask.dueDate,
              showInMiDia: true,
              completed: false,
              pinned: newTask.priority === 'urgent_important',
              source: 'system' as const,
              createdAt: new Date().toISOString(),
            },
            ...(prev.notesReminders || []),
          ]
        : prev.notesReminders;

      return {
        ...prev,
        tasks: nextTasks,
        projects: nextProjects,
        notesReminders: nextReminders,
      };
    });

    if (isDictatingTask && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsDictatingTask(false);
    }
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskResourceLink('');
    setNewTaskAssignee('');
    if (!activeProject) setNewTaskProjectId('');
    setModalSubtasks([]);
    setSubtaskDraftInput('');
    setNewTaskRemind(false);
    setShowFullTaskModal(false);
    notify(
      newTaskRemind
        ? 'Tarea añadida y enviada a tu Bandeja de Recordatorios.'
        : 'Tarea empresarial añadida al Kanban.'
    );
  };

  const handleQuickCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentBusiness) return;
    const effectiveProjectId = newTaskProjectId || activeProject?.id || undefined;
    const taskId = `task_${Date.now()}`;
    const newTask: BusinessTask = {
      id: taskId,
      title: newTaskTitle.trim(),
      scope: 'business',
      businessId: currentBusiness.id,
      projectId: effectiveProjectId,
      priority: 'important',
      status: 'todo',
      isDelegated: Boolean(newTaskAssignee),
      delegatedToId: newTaskAssignee || undefined,
      dueDate: new Date().toISOString().split('T')[0],
      tags: ['Empresarial', currentBusiness.name],
    };

    onUpdateData((prev) => {
      const nextTasks = [newTask, ...prev.tasks];
      const nextProjects = syncProjectsProgressFromTasks(prev.projects, nextTasks, effectiveProjectId);
      return { ...prev, tasks: nextTasks, projects: nextProjects };
    });

    setNewTaskTitle('');
    setNewTaskAssignee('');
    notify('Tarea añadida. Haz clic sobre ella para abrir su configuración y subtareas.');
  };

  const handleSendExistingTaskToReminders = (task: BusinessTask) => {
    const alreadyExists = (data.notesReminders || []).some((r) => r.linkedTaskId === task.id);
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, remindInInbox: true } : t)),
      notesReminders: alreadyExists
        ? prev.notesReminders
        : [
            {
              id: `nr_biz_${Date.now()}`,
              title: task.title,
              content: `Compromiso empresarial (${currentBusiness?.name || 'Negocios'}) · Vence: ${task.dueDate}`,
              category: 'tarea',
              originModule: 'business',
              targetView: 'business',
              linkedTaskId: task.id,
              reminderDate: task.dueDate,
              showInMiDia: true,
              completed: task.status === 'done',
              pinned: false,
              source: 'user',
              createdAt: new Date().toISOString(),
            },
            ...(prev.notesReminders || []),
          ],
    }));
    notify(`"${task.title}" enviada a Recordatorios.`);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: (t.subtasks || []).map((st) =>
                st.id === subtaskId ? { ...st, done: !st.done } : st
              ),
            }
          : t
      ),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateData((prev) => {
      const target = prev.tasks.find((t) => t.id === taskId);
      const nextTasks = prev.tasks.filter((t) => t.id !== taskId);
      const nextProjects = syncProjectsProgressFromTasks(prev.projects, nextTasks, target?.projectId);
      return {
        ...prev,
        tasks: nextTasks,
        projects: nextProjects,
      };
    });
  };

  const moveTaskStatus = (taskId: string, newStatus: BusinessTask['status']) => {
    onUpdateData((prev) => {
      const target = prev.tasks.find((t) => t.id === taskId);
      const nextTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
            }
          : t
      );
      const nextProjects = syncProjectsProgressFromTasks(prev.projects, nextTasks, target?.projectId);
      return {
        ...prev,
        tasks: nextTasks,
        projects: nextProjects,
      };
    });
  };

  // Projects handlers
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !currentBusiness) return;
    const newProj: BusinessProject = {
      id: `proj_${Date.now()}`,
      businessId: currentBusiness.id,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Proyecto estratégico de crecimiento.',
      status: 'in_progress',
      progressPercent: 0,
      deadline: newProjectDeadline || '2026-12-31',
      budget: Number(newProjectBudget) || 5000,
    };

    onUpdateData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
    setShowAddProject(false);
    setNewProjectName('');
    setNewProjectDesc('');
    handleSelectProjectForKanban(newProj.id);
    notify(`Proyecto "${newProj.name}" creado. Agrega sus tareas en el Kanban.`);
  };

  const handleUpdateProject = (projectId: string, patch: Partial<BusinessProject>) => {
    onUpdateData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const next = { ...p, ...patch };
        if (patch.status === 'completed' && patch.progressPercent === undefined) {
          next.progressPercent = 100;
        }
        return next;
      }),
    }));
  };

  const handleDeleteProject = (projectId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== projectId),
      tasks: prev.tasks.map((t) => (t.projectId === projectId ? { ...t, projectId: undefined } : t)),
      goals: prev.goals.map((g) => (g.projectId === projectId ? { ...g, projectId: undefined } : g)),
    }));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setNewTaskProjectId('');
    }
    setConfirmDeleteProjId(null);
    notify('Proyecto eliminado correctamente.');
  };

  // OKR handlers concatenated to Company & Project
  const handleCreateOkr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!okrTitle.trim() || !currentBusiness) return;
    const milestones = okrMilestonesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, idx) => ({ id: `ms_${Date.now()}_${idx}`, text, done: false }));

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title: okrTitle.trim(),
      horizon: okrHorizon,
      pillar: 'financiero',
      businessId: currentBusiness.id,
      projectId: okrProjectId || activeProject?.id || undefined,
      targetDate: okrTargetDate || '2026-12-31',
      progressPercent: 0,
      status: 'in_progress',
      milestones:
        milestones.length > 0
          ? milestones
          : [{ id: `ms_${Date.now()}_0`, text: 'Definir primer hito ejecutable', done: false }],
    };

    onUpdateData((prev) => ({
      ...prev,
      goals: [newGoal, ...prev.goals],
    }));

    setOkrTitle('');
    setOkrMilestonesText('');
    setOkrProjectId('');
    setShowAddOkr(false);
    notify('OKR estratégico vinculado a tu empresa y proyecto.');
  };

  const handleToggleOkrMilestone = (goalId: string, milestoneId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const nextMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m
        );
        const doneCount = nextMilestones.filter((m) => m.done).length;
        const pct =
          nextMilestones.length > 0 ? Math.round((doneCount / nextMilestones.length) * 100) : g.progressPercent;
        return {
          ...g,
          milestones: nextMilestones,
          progressPercent: pct,
          status: pct === 100 ? 'achieved' : 'in_progress',
        };
      }),
    }));
  };

  const handleDeleteOkr = (goalId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
  };

  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;
    const newBiz: Business = {
      id: `biz_${Date.now()}`,
      name: newBizName.trim(),
      sector: newBizSector.trim() || 'Servicios Profesionales',
      logoEmoji: newBizEmoji || '🚀',
      description: 'Nueva unidad de negocio.',
      revenueTarget: 20000,
      actualRevenue: 0,
      kpis: [{ name: 'Facturación Mensual', target: '$20,000', current: '$0' }],
    };

    onUpdateData((prev) => ({
      ...prev,
      businesses: [...prev.businesses, newBiz],
    }));
    setSelectedBusinessId(newBiz.id);
    setShowAddBiz(false);
    setNewBizName('');
    setNewBizSector('');
  };

  const renderKanbanCard = (t: BusinessTask) => {
    const project = t.projectId ? businessProjects.find((p) => p.id === t.projectId) : null;
    const assignee = t.delegatedToId
      ? businessTeam.find((m) => m.id === t.delegatedToId)
      : null;
    const prio = PRIORITY_BADGE[t.priority];
    const subtasks = t.subtasks || [];
    const doneSubs = subtasks.filter((s) => s.done).length;

    return (
      <div
        key={t.id}
        onClick={() => openTaskModal(t)}
        className={`p-3 rounded-xl border shadow-xs text-xs space-y-2 transition-all cursor-pointer group ${
          t.status === 'done'
            ? 'bg-slate-50/80 dark:bg-black/20 border-slate-200/60 dark:border-white/[0.04] opacity-75 hover:border-blue-400/50'
            : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-white/[0.08] hover:border-blue-500/50 hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className={`font-semibold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors ${
              t.status === 'done'
                ? 'line-through text-slate-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {t.title}
          </p>
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => openTaskModal(t)}
              className="text-slate-400 hover:text-blue-500 p-0.5 cursor-pointer"
              title="Abrir configuración completa + subtareas"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteTask(t.id)}
              className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
              title="Eliminar tarea"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Metadata pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${prio.cls}`}>
            {prio.label}
          </span>
          {project && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 truncate max-w-[130px]">
              {project.name}
            </span>
          )}
          {assignee && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
              {assignee.name.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Optional Description & Resource Link */}
        {t.description && (
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
            {t.description}
          </p>
        )}

        {t.resourceLink && (
          <a
            href={t.resourceLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 text-[10px] font-semibold max-w-full truncate"
          >
            <Link2 className="w-3 h-3 shrink-0" />
            <span className="truncate">Abrir recurso adjunto</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
          </a>
        )}

        {/* Interactive Subtasks Checklist */}
        {subtasks.length > 0 && (
          <div
            className="pt-1.5 border-t border-slate-200/70 dark:border-white/[0.06] space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <ListChecks className="w-3 h-3 text-blue-500" />
                Subtareas
              </span>
              <span className="tabular-nums">
                {doneSubs}/{subtasks.length}
              </span>
            </div>
            {subtasks.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleToggleSubtask(t.id, st.id)}
                className="w-full flex items-center gap-1.5 text-left text-[11px] text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
              >
                {st.done ? (
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={st.done ? 'line-through text-slate-400' : ''}>{st.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div
          className="pt-1.5 border-t border-slate-200/70 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px]"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-slate-400 flex items-center gap-1 tabular-nums">
            <Calendar className="w-3 h-3" />
            {t.dueDate}
          </span>

          <div className="flex items-center gap-1">
            {assignee && (
              <>
                <a
                  href={buildMailtoHref(t, assignee)}
                  title={`Enviar tarea por correo a ${assignee.name}`}
                  className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  disabled={dispatchingTaskId === t.id}
                  onClick={() => handleSendToExternalApp(t, assignee)}
                  title="Enviar a App Externa (WhatsApp / Slack / n8n)"
                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => handleSendExistingTaskToReminders(t)}
              title={t.remindInInbox ? 'Ya en Recordatorios' : 'Enviar a Recordatorios'}
              className={`p-1 rounded-lg cursor-pointer transition-colors ${
                t.remindInInbox
                  ? 'text-violet-600 dark:text-violet-400 bg-violet-500/15'
                  : 'text-slate-400 hover:text-violet-500'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
            </button>

            {t.status !== 'inbox' && (
              <button
                type="button"
                onClick={() =>
                  moveTaskStatus(
                    t.id,
                    t.status === 'done'
                      ? 'in_progress'
                      : t.status === 'in_progress'
                      ? 'todo'
                      : 'inbox'
                  )
                }
                className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                title="Retroceder columna"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {t.status !== 'done' && (
              <button
                type="button"
                onClick={() =>
                  moveTaskStatus(
                    t.id,
                    t.status === 'inbox'
                      ? 'todo'
                      : t.status === 'todo'
                      ? 'in_progress'
                      : 'done'
                  )
                }
                className="px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <span>
                  {t.status === 'inbox'
                    ? 'Por Hacer'
                    : t.status === 'todo'
                    ? 'Iniciar'
                    : 'Completar'}
                </span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0 text-xl font-bold">
              {currentBusiness?.logoEmoji || <Building2 className="w-6 h-6 stroke-[2.2]" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-xl border border-blue-500/30">
                  Ecosistema Multi-Empresa
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {currentBusiness?.sector || 'Empresarial'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {currentBusiness?.name}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                {currentBusiness?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {data.businesses.map((biz) => (
              <button
                key={biz.id}
                onClick={() => {
                  setSelectedBusinessId(biz.id);
                  setActiveProjectId(null);
                  setNewTaskProjectId('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  biz.id === currentBusiness?.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-100/80 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08]'
                }`}
              >
                <span>{biz.logoEmoji}</span>
                <span>{biz.name}</span>
              </button>
            ))}

            <button
              onClick={() => setShowAddBiz(true)}
              className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 transition-colors cursor-pointer"
              title="Crear Nueva Empresa"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {toast && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-700 dark:text-blue-300">
            {toast}
          </div>
        )}
      </div>

      {/* Add Business Modal */}
      {showAddBiz && (
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/[0.1] shadow-2xl space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Crear Nueva Empresa / Proyecto Empresarial
          </h3>
          <form onSubmit={handleCreateBusiness} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Emoji (🚀)"
              value={newBizEmoji}
              onChange={(e) => setNewBizEmoji(e.target.value)}
              className="w-16 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-2 py-2 text-xs text-center text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Nombre del Negocio"
              value={newBizName}
              onChange={(e) => setNewBizName(e.target.value)}
              required
              className="flex-1 min-w-[200px] bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Sector"
              value={newBizSector}
              onChange={(e) => setNewBizSector(e.target.value)}
              className="flex-1 min-w-[200px] bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Registrar Negocio
            </button>
            <button
              type="button"
              onClick={() => setShowAddBiz(false)}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Business KPIs Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Ingresos Actuales
          </span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block tracking-tight tabular-nums">
            ${currentBusiness?.actualRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Meta: ${currentBusiness?.revenueTarget.toLocaleString()}
          </span>
        </div>

        <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Proyectos Activos
          </span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight tabular-nums">
            {businessProjects.length} Proyectos
          </span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5 block">
            {businessProjects.filter((p) => p.status === 'completed').length} completados
          </span>
        </div>

        <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Equipo Asignado
          </span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight tabular-nums">
            {businessTeam.length} Colaboradores
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Liderazgo delegado
          </span>
        </div>

        <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Decisiones Clave
          </span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight tabular-nums">
            {businessDecisions.length} Registradas
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Actas & OKRs vigentes
          </span>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-black/40 backdrop-blur-xl border border-slate-300/40 dark:border-white/[0.06] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('projects_tasks')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'projects_tasks'
              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Proyectos & Tablero Kanban
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Equipo & Delegación ({businessTeam.length})
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'strategy'
              ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Dirección Estratégica & Decisiones
        </button>
      </div>

      {/* Tab 1: Projects & Kanban */}
      {activeTab === 'projects_tasks' && (
        <div className="space-y-6">
          {/* Projects Card */}
          <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-lg dark:shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Proyectos Estratégicos de {currentBusiness?.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  El progreso (0%–100%) avanza automáticamente al mover tareas en el tablero Kanban del proyecto.
                </p>
              </div>
              <button
                onClick={() => setShowAddProject(!showAddProject)}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Proyecto</span>
              </button>
            </div>

            {showAddProject && (
              <form
                onSubmit={handleCreateProject}
                className="mb-4 p-4 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre del proyecto"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Presupuesto ($)"
                    value={newProjectBudget}
                    onChange={(e) => setNewProjectBudget(Number(e.target.value))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="date"
                    value={newProjectDeadline}
                    onChange={(e) => setNewProjectDeadline(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Crear Proyecto
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {businessProjects.map((proj) => {
                const projTasks = businessTasks.filter((t) => t.projectId === proj.id);
                const projDoneTasks = projTasks.filter((t) => t.status === 'done').length;
                const projInProgTasks = projTasks.filter((t) => t.status === 'in_progress').length;
                const computedPct = calculateWeightedProjectProgress(proj, businessTasks);
                const isSelected = activeProject?.id === proj.id;

                return (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectProjectForKanban(proj.id)}
                    className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/[0.08] dark:bg-blue-950/30 border-blue-500/60 ring-2 ring-blue-500/20 shadow-md'
                        : 'bg-slate-50/90 dark:bg-black/30 border-slate-200/90 dark:border-white/[0.06] hover:border-blue-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {proj.name}
                        </span>
                        {confirmDeleteProjId === proj.id ? (
                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Borrar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteProjId(null)}
                              className="px-1.5 py-0.5 text-[10px] text-slate-500 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteProjId(proj.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                            title="Eliminar proyecto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {proj.description}
                      </p>
                    </div>

                    {/* Automatic Task-Driven Progress & Status */}
                    <div
                      className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={proj.status}
                          onChange={(e) =>
                            handleUpdateProject(proj.id, {
                              status: e.target.value as BusinessProject['status'],
                            })
                          }
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                        >
                          {(Object.keys(PROJECT_STATUS_LABEL) as BusinessProject['status'][]).map(
                            (st) => (
                              <option key={st} value={st}>
                                {PROJECT_STATUS_LABEL[st]}
                              </option>
                            )
                          )}
                        </select>

                        <span className="text-xs text-blue-600 dark:text-blue-400 font-extrabold tabular-nums">
                          {computedPct}%
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            computedPct === 100
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                          }`}
                          style={{ width: `${computedPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="tabular-nums">
                          {projTasks.length > 0
                            ? `${projDoneTasks}/${projTasks.length} listas${projInProgTasks > 0 ? ` · ${projInProgTasks} en curso` : ''}`
                            : `Sin tareas · Fin ${proj.deadline}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectProjectForKanban(proj.id)}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{isSelected ? 'Kanban Activo' : 'Abrir Kanban'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kanban Board (Scoped to selected project or whole company) */}
          <div
            ref={kanbanRef}
            className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-lg dark:shadow-2xl"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeProject
                      ? `Tablero Kanban: ${activeProject.name}`
                      : `Tablero Kanban de ${currentBusiness?.name}`}
                  </h3>
                  {activeProject && (
                    <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-lg border border-blue-500/30 tabular-nums">
                      {calculateWeightedProjectProgress(activeProject, businessTasks)}% / 100%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeProject
                    ? 'Completa las tareas o haz clic en cualquiera para abrir su configuración completa + subtareas.'
                    : 'Haz clic en un proyecto arriba para filtrarlo, o clic en cualquier tarea para ver sus subtareas y detalle.'}
                </p>
              </div>

              {/* View Mode Switcher + Quick & Full Task Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Kanban / Semana / Mes Switcher */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setBoardViewMode('kanban')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      boardViewMode === 'kanban'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Columns3 className="w-3.5 h-3.5" />
                    <span>Kanban</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoardViewMode('week')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      boardViewMode === 'week'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Semana</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoardViewMode('month')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      boardViewMode === 'month'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Mes</span>
                  </button>
                </div>

                {activeProject && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProjectId(null);
                      setNewTaskProjectId('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200/70 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300/80 cursor-pointer"
                  >
                    Ver toda la empresa
                  </button>
                )}

                <form onSubmit={handleQuickCreateTask} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      activeProject
                        ? `Nueva tarea en ${activeProject.name.slice(0, 22)}...`
                        : 'Nueva tarea ejecutiva...'
                    }
                    value={showFullTaskModal ? '' : newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                  <select
                    value={showFullTaskModal ? '' : newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="">Para mí</option>
                    {businessTeam.map((m) => (
                      <option key={m.id} value={m.id}>
                        Delegar a {m.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    Añadir
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => openTaskModal()}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Nueva Tarea Completa</span>
                </button>
              </div>
            </div>

            {/* Wide Full Task Configuration + Subtasks Modal (Create or Edit/Inspect existing task) */}
            {showFullTaskModal &&
              createPortal(
                <div
                  className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
                  onClick={() => setShowFullTaskModal(false)}
                >
                  <form
                    onSubmit={handleSaveTaskModal}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-3xl max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-blue-500/30 shadow-2xl space-y-4 sm:my-auto"
                  >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Configuración Completa de Tarea + Subtareas
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {editingTaskId
                          ? 'Edita detalles, marca o agrega subtareas pequeñas, cambia estado, dicta por voz o envía al responsable.'
                          : 'Crea una tarea general completa con descripción por voz, subtareas pequeñas, recurso y responsable.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFullTaskModal(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Título de la tarea..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="sm:col-span-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                    />
                    <select
                      value={newTaskProjectId}
                      onChange={(e) => setNewTaskProjectId(e.target.value)}
                      className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Sin proyecto específico</option>
                      {businessProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          Proyecto: {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as BusinessTask['priority'])}
                      className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="urgent_important">Urgente &amp; Vital</option>
                      <option value="important">Alto Impacto</option>
                      <option value="urgent">Urgente</option>
                      <option value="normal">Normal</option>
                    </select>
                  </div>

                  {/* Column Status Selector inside Full Task View */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Estado en Kanban:
                    </span>
                    {([
                      { id: 'inbox', label: 'Bandeja' },
                      { id: 'todo', label: 'Por Hacer' },
                      { id: 'in_progress', label: 'En Progreso' },
                      { id: 'done', label: 'Completada' },
                    ] as const).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setTaskModalStatus(st.id)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          taskModalStatus === st.id
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-slate-100 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Description with Voice Dictation + Resource Link */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Descripción Detallada / Contexto Operativo
                      </label>
                      <button
                        type="button"
                        onClick={handleToggleVoiceDictation}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          isDictatingTask
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25'
                        }`}
                      >
                        {isDictatingTask ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        <span>{isDictatingTask ? 'Detener Dictado' : 'Dictado por Voz'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Explica los criterios de aceptación, entregables o dicta por voz las instrucciones para tu equipo..."
                      className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white resize-y"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Link de Recurso / Archivo (Drive, Notion, Figma, Loom)
                    </label>
                    <input
                      type="url"
                      value={newTaskResourceLink}
                      onChange={(e) => setNewTaskResourceLink(e.target.value)}
                      placeholder="https://drive.google.com/... o https://notion.so/..."
                      className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Date, Estimated Minutes, Assignee + Reminder */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Fecha límite
                      </label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Tiempo estimado (min)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={480}
                        value={newTaskEstimatedMinutes}
                        onChange={(e) => setNewTaskEstimatedMinutes(Number(e.target.value))}
                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-500">
                          Responsable
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowInlineMemberForm((prev) => !prev)}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ Registrar</span>
                        </button>
                      </div>
                      <select
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="">Asignar a mí mismo</option>
                        {businessTeam.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer pt-2 lg:pt-6">
                      <input
                        type="checkbox"
                        checked={newTaskRemind}
                        onChange={(e) => setNewTaskRemind(e.target.checked)}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                      <span>Enviar a Recordatorios</span>
                    </label>
                  </div>

                  {showInlineMemberForm && (
                    <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 space-y-2.5">
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block">
                        Registrar Nuevo Responsable en {currentBusiness?.name}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre completo"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Cargo / Rol"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                        <div className="flex gap-2">
                          <input
                            type="email"
                            placeholder="correo@empresa.com"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={handleCreateTeamMember}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Small Subtasks Inside General Task */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ListChecks className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          Subtareas Pequeñas ({modalSubtasks.filter((s) => s.done).length}/{modalSubtasks.length})
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Añadir subtarea pequeña (ej: Revisar cláusula 4)..."
                        value={subtaskDraftInput}
                        onChange={(e) => setSubtaskDraftInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDraftSubtask();
                          }
                        }}
                        className="flex-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddDraftSubtask}
                        className="px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 text-xs font-bold cursor-pointer"
                      >
                        + Subtarea
                      </button>
                    </div>

                    {modalSubtasks.length > 0 && (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {modalSubtasks.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-black/35 border border-slate-200/80 dark:border-white/[0.06] text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleModalSubtask(st.id)}
                              className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                            >
                              {st.done ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span
                                className={
                                  st.done
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-800 dark:text-slate-200'
                                }
                              >
                                {st.text}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setModalSubtasks((prev) => prev.filter((item) => item.id !== st.id))
                              }
                              className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                              title="Quitar subtarea"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      {editingTaskId && (
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteTask(editingTaskId);
                            setShowFullTaskModal(false);
                            setEditingTaskId(null);
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      )}
                      {editingTaskId && newTaskAssignee && (() => {
                        const assignee = businessTeam.find((m) => m.id === newTaskAssignee);
                        const activeTask = data.tasks.find((t) => t.id === editingTaskId);
                        if (!assignee || !activeTask) return null;
                        return (
                          <>
                            <a
                              href={buildMailtoHref(activeTask, assignee)}
                              className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Enviar Correo</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleSendToExternalApp(activeTask, assignee)}
                              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>App Externa</span>
                            </button>
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => setShowFullTaskModal(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
                      >
                        {editingTaskId ? 'Guardar Cambios de Tarea' : 'Crear Tarea en Kanban'}
                      </button>
                    </div>
                  </div>
                  </form>
                </div>,
                document.body
              )}

            {/* VIEW 1: KANBAN COLUMNS */}
            {boardViewMode === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Inbox */}
                <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Bandeja / Inbox</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-white/[0.08] tabular-nums">
                      {kanbanTasks.filter((t) => t.status === 'inbox').length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {kanbanTasks.filter((t) => t.status === 'inbox').map(renderKanbanCard)}
                  </div>
                </div>

                {/* To-Do */}
                <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold text-amber-700 dark:text-amber-300">
                    <span>Por Hacer</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/15 tabular-nums">
                      {kanbanTasks.filter((t) => t.status === 'todo').length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {kanbanTasks.filter((t) => t.status === 'todo').map(renderKanbanCard)}
                  </div>
                </div>

                {/* In Progress */}
                <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <span>En Progreso</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/15 tabular-nums">
                      {kanbanTasks.filter((t) => t.status === 'in_progress').length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {kanbanTasks.filter((t) => t.status === 'in_progress').map(renderKanbanCard)}
                  </div>
                </div>

                {/* Done */}
                <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold text-teal-700 dark:text-teal-300">
                    <span>Completadas</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/15 tabular-nums">
                      {kanbanTasks.filter((t) => t.status === 'done').length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {kanbanTasks.filter((t) => t.status === 'done').map(renderKanbanCard)}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2 & 3: CALENDARIO SEMANAL Y MENSUAL */}
            {(boardViewMode === 'week' || boardViewMode === 'month') && (() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const fmtDate = (d: Date) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
              };

              const shiftCursor = (dir: number) => {
                const next = new Date(calendarCursor);
                if (boardViewMode === 'week') {
                  next.setDate(next.getDate() + dir * 7);
                } else {
                  next.setMonth(next.getMonth() + dir);
                }
                setCalendarCursor(next);
              };

              // Build Week days (Mon -> Sun)
              const startOfWeek = new Date(calendarCursor);
              const dayOfWeek = startOfWeek.getDay(); // 0=Sun..6=Sat
              const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
              startOfWeek.setDate(startOfWeek.getDate() + diffToMon);
              const weekDays = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                return d;
              });

              // Build Month grid (Mon -> Sun padded)
              const year = calendarCursor.getFullYear();
              const month = calendarCursor.getMonth();
              const firstOfMonth = new Date(year, month, 1);
              const firstWeekday = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const monthCells: Array<{ date: Date; inMonth: boolean }> = [];
              for (let i = firstWeekday - 1; i >= 0; i--) {
                const d = new Date(year, month, -i);
                monthCells.push({ date: d, inMonth: false });
              }
              for (let day = 1; day <= daysInMonth; day++) {
                monthCells.push({ date: new Date(year, month, day), inMonth: true });
              }
              while (monthCells.length % 7 !== 0) {
                const nextIdx = monthCells.length - firstWeekday - daysInMonth + 1;
                monthCells.push({ date: new Date(year, month + 1, nextIdx), inMonth: false });
              }

              const headerTitle =
                boardViewMode === 'week'
                  ? `Semana del ${weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} al ${weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : calendarCursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase());

              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-100/80 dark:bg-black/35 border border-slate-200/80 dark:border-white/[0.06]">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {headerTitle}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => shiftCursor(-1)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-blue-500/40 cursor-pointer"
                        title="Anterior"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarCursor(new Date())}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[11px] font-bold cursor-pointer"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftCursor(1)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-blue-500/40 cursor-pointer"
                        title="Siguiente"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {boardViewMode === 'week' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
                      {weekDays.map((d) => {
                        const dStr = fmtDate(d);
                        const dayTasks = kanbanTasks.filter((t) => t.dueDate === dStr);
                        const isToday = dStr === todayStr;
                        return (
                          <div
                            key={dStr}
                            className={`p-3 rounded-2xl border min-h-[190px] flex flex-col justify-between space-y-2 ${
                              isToday
                                ? 'bg-blue-500/[0.08] border-blue-500/40'
                                : 'bg-slate-100/60 dark:bg-black/30 border-slate-200/80 dark:border-white/[0.06]'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70 dark:border-white/[0.06]">
                                <span className={`text-[11px] font-extrabold capitalize ${isToday ? 'text-blue-600 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openTaskModal(undefined, dStr)}
                                  className="p-0.5 rounded text-slate-400 hover:text-blue-500 cursor-pointer"
                                  title="Añadir tarea en este día"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="space-y-1.5">
                                {dayTasks.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic">Sin tareas</p>
                                ) : (
                                  dayTasks.map((t) => (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => openTaskModal(t)}
                                      className={`w-full text-left p-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                                        t.status === 'done'
                                          ? 'bg-emerald-500/10 border-emerald-500/25 text-slate-500 line-through'
                                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-blue-500/50'
                                      }`}
                                    >
                                      <span className="font-semibold block line-clamp-2">{t.title}</span>
                                      {t.subtasks && t.subtasks.length > 0 && (
                                        <span className="text-[9px] text-blue-600 dark:text-blue-300 mt-0.5 block">
                                          ✓ {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length} subtareas
                                        </span>
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-500 uppercase">
                        <span>Lun</span>
                        <span>Mar</span>
                        <span>Mié</span>
                        <span>Jue</span>
                        <span>Vie</span>
                        <span>Sáb</span>
                        <span>Dom</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {monthCells.map(({ date, inMonth }) => {
                          const dStr = fmtDate(date);
                          const dayTasks = kanbanTasks.filter((t) => t.dueDate === dStr);
                          const isToday = dStr === todayStr;
                          return (
                            <div
                              key={dStr}
                              className={`min-h-[96px] p-2 rounded-xl border flex flex-col gap-1 transition-all ${
                                isToday
                                  ? 'bg-blue-500/[0.09] border-blue-500/50'
                                  : inMonth
                                  ? 'bg-slate-100/60 dark:bg-black/30 border-slate-200/80 dark:border-white/[0.06]'
                                  : 'bg-slate-100/25 dark:bg-black/15 border-slate-200/40 dark:border-white/[0.03] opacity-55'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold tabular-nums ${
                                    isToday ? 'text-blue-600 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {date.getDate()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openTaskModal(undefined, dStr)}
                                  className="text-slate-400 hover:text-blue-500 cursor-pointer"
                                  title="Nueva tarea"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="space-y-1 overflow-y-auto max-h-[68px]">
                                {dayTasks.map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => openTaskModal(t)}
                                    className={`w-full text-left px-1.5 py-1 rounded-lg text-[10px] font-semibold truncate cursor-pointer border ${
                                      t.status === 'done'
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-slate-500 line-through'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 hover:border-blue-500'
                                    }`}
                                    title={t.title}
                                  >
                                    {t.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Objetivos Estratégicos & OKRs concatenados a Empresas y Proyectos */}
          <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-lg dark:shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <span>
                    Objetivos Estratégicos &amp; OKRs de {currentBusiness?.name}
                    {activeProject ? ` · ${activeProject.name}` : ''}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Concatenados directamente a tus empresas y proyectos para medir logros reales hacia el 100%.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isLoadingOkrAi}
                  onClick={handleSuggestOkrs}
                  className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingOkrAi ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Asistente IA: ¿Qué medir?</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeProject) setOkrProjectId(activeProject.id);
                    setShowAddOkr((prev) => !prev);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo OKR / Meta</span>
                </button>
              </div>
            </div>

            {showOkrAiPanel && (
              <div className="p-4 rounded-2xl bg-indigo-500/[0.07] dark:bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Recomendaciones IA de KPIs &amp; OKRs para {currentBusiness?.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOkrAiPanel(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingOkrAi ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                    Analizando sector ({currentBusiness?.sector}), ingresos y proyectos activos...
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {okrSuggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-indigo-500/20 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                            KPI: {sug.kpiMetric}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdoptSuggestedOkr(sug)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Adoptar OKR
                          </button>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {sug.title}
                        </p>
                        <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                          {sug.milestones.map((ms, mIdx) => (
                            <li key={mIdx} className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                              <span>{ms}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showAddOkr && (
              <form
                onSubmit={handleCreateOkr}
                className="p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-indigo-500/30 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Objetivo estratégico (OKR)..."
                    value={okrTitle}
                    onChange={(e) => setOkrTitle(e.target.value)}
                    className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <select
                    value={okrProjectId}
                    onChange={(e) => setOkrProjectId(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">General de {currentBusiness?.name}</option>
                    {businessProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        Proyecto: {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <select
                      value={okrHorizon}
                      onChange={(e) => setOkrHorizon(e.target.value as Goal['horizon'])}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="annual">Anual</option>
                    </select>
                    <input
                      type="date"
                      value={okrTargetDate}
                      onChange={(e) => setOkrTargetDate(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <textarea
                  rows={2}
                  placeholder="Hitos clave (uno por línea)..."
                  value={okrMilestonesText}
                  onChange={(e) => setOkrMilestonesText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddOkr(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Guardar OKR
                  </button>
                </div>
              </form>
            )}

            {filteredBusinessGoals.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                No hay OKRs vinculados aún para esta selección. Crea el primero arriba.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredBusinessGoals.map((goal) => {
                  const linkedProj = goal.projectId
                    ? businessProjects.find((p) => p.id === goal.projectId)
                    : null;
                  return (
                    <div
                      key={goal.id}
                      className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs mb-1">
                          <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg">
                            {goal.horizon}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                              {goal.progressPercent}%
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteOkr(goal.id)}
                              className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                              title="Eliminar OKR"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                          {goal.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Meta: {goal.targetDate}</span>
                          {linkedProj && (
                            <button
                              type="button"
                              onClick={() => handleSelectProjectForKanban(linkedProj.id)}
                              className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold hover:underline cursor-pointer"
                            >
                              Proyecto: {linkedProj.name}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.06]">
                        {goal.milestones.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleToggleOkrMilestone(goal.id, m.id)}
                            className="w-full flex items-start gap-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                m.done ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                            <span className={m.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                              {m.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Team Directory */}
      {activeTab === 'team' && (
        <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-lg dark:shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Directorio del Equipo &amp; Delegación
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registra nuevos responsables y envía tareas delegadas por correo o app externa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInlineMemberForm((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registrar Nuevo Responsable</span>
            </button>
          </div>

          {showInlineMemberForm && (
            <form
              onSubmit={handleCreateTeamMember}
              className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
            >
              <input
                type="text"
                required
                placeholder="Nombre completo"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Cargo / Especialidad"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="email"
                placeholder="correo@empresa.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Miembro
                </button>
                <button
                  type="button"
                  onClick={() => setShowInlineMemberForm(false)}
                  className="px-3 py-2 text-xs text-slate-500 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {businessTeam.map((member) => {
              const memberTasks = businessTasks.filter(
                (t) => t.delegatedToId === member.id && t.status !== 'done'
              );
              return (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/90 dark:border-white/[0.06] space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                        {member.name.charAt(0)}
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg">
                        {memberTasks.length} activas
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white pt-1">{member.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{member.role}</p>
                    <span className="text-[11px] text-slate-400 block">{member.email}</span>
                  </div>

                  {memberTasks.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] space-y-1.5">
                      {memberTasks.slice(0, 3).map((mt) => (
                        <div
                          key={mt.id}
                          className="p-2 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/70 dark:border-white/[0.05] flex items-center justify-between gap-2 text-[11px]"
                        >
                          <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                            {mt.title}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={buildMailtoHref(mt, member)}
                              title="Enviar por Correo"
                              className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                            >
                              <Mail className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleSendToExternalApp(mt, member)}
                              title="Enviar a App Externa"
                              className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Strategy & Decisions */}
      {activeTab === 'strategy' && (
        <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-lg dark:shadow-2xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Repositorio de Decisiones & Estrategia
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bitácora de decisiones trascendentales, análisis de contexto y resultados esperados.
            </p>
          </div>

          <div className="space-y-3">
            {businessDecisions.map((dec) => (
              <div
                key={dec.id}
                className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/90 dark:border-white/[0.06] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{dec.title}</span>
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-lg border border-blue-500/30">
                    {dec.quarter} · {dec.date}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-500">Contexto:</span> {dec.context}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-semibold text-slate-500">Decisión adoptada:</span> {dec.decision}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-500">Impacto esperado:</span>{' '}
                  {dec.expectedOutcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
