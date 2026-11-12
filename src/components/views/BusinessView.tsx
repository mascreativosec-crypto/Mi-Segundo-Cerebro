import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { Business, BusinessProject, BusinessTask, TeamMember, StrategicDecision } from '../../types';
import {
  Building2,
  Plus,
  FolderGit2,
  Users,
  CheckSquare,
  TrendingUp,
  DollarSign,
  Layers,
  ArrowRight,
  Clock,
  UserPlus
} from 'lucide-react';

interface BusinessViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenQuickCapture: () => void;
}

export const BusinessView: React.FC<BusinessViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(
    data.businesses[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'projects_tasks' | 'team' | 'strategy' | 'finances'>('projects_tasks');

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<BusinessTask['priority']>('important');

  // New project modal state
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState(5000);

  // New business modal state
  const [showAddBiz, setShowAddBiz] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizSector, setNewBizSector] = useState('');
  const [newBizEmoji, setNewBizEmoji] = useState('💼');

  const currentBusiness = data.businesses.find((b) => b.id === selectedBusinessId) || data.businesses[0];

  const businessProjects = data.projects.filter((p) => p.businessId === currentBusiness?.id);
  const businessTasks = data.tasks.filter((t) => t.businessId === currentBusiness?.id);
  const businessTeam = data.teamMembers.filter((m) => m.businessId === currentBusiness?.id);
  const businessDecisions = data.strategicDecisions.filter((d) => d.businessId === currentBusiness?.id || !d.businessId);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentBusiness) return;
    const newTask: BusinessTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      scope: 'business',
      businessId: currentBusiness.id,
      priority: newTaskPriority,
      status: 'todo',
      isDelegated: Boolean(newTaskAssignee),
      delegatedToId: newTaskAssignee || undefined,
      dueDate: new Date().toISOString().split('T')[0],
      tags: ['Empresarial', currentBusiness.name],
    };

    onUpdateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    setNewTaskTitle('');
    setNewTaskAssignee('');
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !currentBusiness) return;
    const newProj: BusinessProject = {
      id: `proj_${Date.now()}`,
      businessId: currentBusiness.id,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Proyecto estratégico de crecimiento.',
      status: 'in_progress',
      progressPercent: 10,
      deadline: '2026-12-31',
      budget: Number(newProjectBudget) || 5000,
    };

    onUpdateData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
    setShowAddProject(false);
    setNewProjectName('');
    setNewProjectDesc('');
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

  const moveTaskStatus = (taskId: string, newStatus: BusinessTask['status']) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner - Apple Liquid Glass with Squircle Icon */}
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

          {/* Company Switcher Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {data.businesses.map((biz) => (
              <button
                key={biz.id}
                onClick={() => setSelectedBusinessId(biz.id)}
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
      </div>

      {/* Modal Add Business */}
      {showAddBiz && (
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/[0.1] shadow-2xl space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Crear Nueva Empresa / Proyecto Empresarial</h3>
          <form onSubmit={handleCreateBusiness} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Emoji (🚀, 💎)"
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
              placeholder="Sector (ej: E-commerce, Inmobiliario)"
              value={newBizSector}
              onChange={(e) => setNewBizSector(e.target.value)}
              className="flex-1 min-w-[200px] bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
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
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Ingresos Actuales</span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block tracking-tight">
            ${currentBusiness?.actualRevenue.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Meta: ${currentBusiness?.revenueTarget.toLocaleString()}
          </span>
        </div>

        <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Proyectos en Marcha</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {businessProjects.length} Proyectos
          </span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5 block">
            100% en cronograma
          </span>
        </div>

        <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Equipo Asignado</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {businessTeam.length} Colaboradores
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Liderazgo delegado
          </span>
        </div>

        <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Decisiones Clave</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {businessDecisions.length} Registradas
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Actas & OKRs vigentes
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
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
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Proyectos Estratégicos de {currentBusiness?.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Objetivos tácticos con presupuesto y fecha límite.</p>
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
              <form onSubmit={handleCreateProject} className="mb-4 p-4 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              {businessProjects.map((proj) => (
                <div key={proj.id} className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/90 dark:border-white/[0.06] flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{proj.name}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Fin: {proj.deadline}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{proj.progressPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban Board */}
          <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-lg dark:shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Tablero Kanban de Tareas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Flujo de trabajo ágil con delegación de responsabilidades.</p>
              </div>

              {/* Quick Add Task */}
              <form onSubmit={handleCreateTask} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Nueva tarea ejecutiva..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                >
                  <option value="">Asignar a mí mismo</option>
                  {businessTeam.map((m) => (
                    <option key={m.id} value={m.id}>Delegar a {m.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Añadir
                </button>
              </form>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Inbox */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Bandeja / Inbox</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-white/[0.08]">{businessTasks.filter((t) => t.status === 'inbox').length}</span>
                </div>
                <div className="space-y-2">
                  {businessTasks.filter((t) => t.status === 'inbox').map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-white/[0.08] shadow-xs text-xs text-slate-800 dark:text-slate-200 space-y-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                      <button
                        onClick={() => moveTaskStatus(t.id, 'todo')}
                        className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline block cursor-pointer"
                      >
                        Mover a Por Hacer →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* To-Do */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span>Por Hacer</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/15">{businessTasks.filter((t) => t.status === 'todo').length}</span>
                </div>
                <div className="space-y-2">
                  {businessTasks.filter((t) => t.status === 'todo').map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-white/[0.08] shadow-xs text-xs text-slate-800 dark:text-slate-200 space-y-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">{t.dueDate}</span>
                        <button
                          onClick={() => moveTaskStatus(t.id, 'in_progress')}
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                        >
                          Iniciar →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <span>En Progreso</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/15">{businessTasks.filter((t) => t.status === 'in_progress').length}</span>
                </div>
                <div className="space-y-2">
                  {businessTasks.filter((t) => t.status === 'in_progress').map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-500/30 shadow-xs text-xs text-slate-800 dark:text-slate-200 space-y-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                      <button
                        onClick={() => moveTaskStatus(t.id, 'done')}
                        className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline block cursor-pointer"
                      >
                        Completar ✓
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Done */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-teal-700 dark:text-teal-300">
                  <span>Completadas</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/15">{businessTasks.filter((t) => t.status === 'done').length}</span>
                </div>
                <div className="space-y-2">
                  {businessTasks.filter((t) => t.status === 'done').map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-black/20 border border-slate-200/60 dark:border-white/[0.04] text-xs text-slate-400 line-through">
                      <p>{t.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Team Directory */}
      {activeTab === 'team' && (
        <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-lg dark:shadow-2xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Directorio del Equipo & Delegación</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Supervisa las responsabilidades y tareas delegadas a cada miembro.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {businessTeam.map((member) => (
              <div key={member.id} className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/90 dark:border-white/[0.06] space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                  {member.name.charAt(0)}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{member.name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{member.role}</p>
                <span className="text-[11px] text-slate-400 block">{member.email}</span>
                <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  {member.delegatedTasksCount} compromisos activos
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Strategy & Decisions */}
      {activeTab === 'strategy' && (
        <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-lg dark:shadow-2xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Repositorio de Decisiones & Estrategia</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bitácora de decisiones trascendentales, análisis de contexto y resultados esperados.</p>
          </div>

          <div className="space-y-3">
            {businessDecisions.map((dec) => (
              <div key={dec.id} className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/90 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{dec.title}</span>
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-lg border border-blue-500/30">
                    {dec.quarter} · {dec.date}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-semibold text-slate-500">Contexto:</span> {dec.context}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300"><span className="font-semibold text-slate-500">Decisión adoptada:</span> {dec.decision}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-500">Impacto esperado:</span> {dec.expectedOutcome}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
