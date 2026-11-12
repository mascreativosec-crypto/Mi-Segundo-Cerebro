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
    <div className="space-y-6">
      {/* Top Multi-Company Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              Ecosistema Multi-Empresa
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            {currentBusiness?.logoEmoji} {currentBusiness?.name}
          </h1>
          <p className="text-xs text-slate-400">{currentBusiness?.description}</p>
        </div>

        {/* Company Switcher Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {data.businesses.map((biz) => (
            <button
              key={biz.id}
              onClick={() => setSelectedBusinessId(biz.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                biz.id === currentBusiness?.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-950 font-bold'
                  : 'bg-[#0c1812] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{biz.logoEmoji}</span>
              <span>{biz.name}</span>
            </button>
          ))}

          <button
            onClick={() => setShowAddBiz(true)}
            className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer"
            title="Crear Nueva Empresa"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Add Business */}
      {showAddBiz && (
        <div className="p-4 rounded-2xl bg-[#0d1a13] border border-emerald-500/30">
          <h3 className="text-sm font-bold text-white mb-2">Crear Nueva Empresa / Proyecto Empresarial</h3>
          <form onSubmit={handleCreateBusiness} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Emoji (ej: 🚀, 💎)"
              value={newBizEmoji}
              onChange={(e) => setNewBizEmoji(e.target.value)}
              className="w-16 bg-[#08100c] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center text-slate-200"
            />
            <input
              type="text"
              placeholder="Nombre del Negocio"
              value={newBizName}
              onChange={(e) => setNewBizName(e.target.value)}
              className="flex-1 min-w-[200px] bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
            <input
              type="text"
              placeholder="Sector (ej: E-commerce, Inmobiliario)"
              value={newBizSector}
              onChange={(e) => setNewBizSector(e.target.value)}
              className="flex-1 min-w-[200px] bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg cursor-pointer"
            >
              Registrar Negocio
            </button>
            <button
              type="button"
              onClick={() => setShowAddBiz(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Business KPIs Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0c1812] border border-emerald-500/15">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Ingresos Actuales</span>
          <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block tabular-nums">
            ${currentBusiness?.actualRevenue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">Meta: ${currentBusiness?.revenueTarget.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1812] border border-emerald-500/15">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Proyectos en Marcha</span>
          <span className="text-xl font-mono font-bold text-white mt-1 block">
            {businessProjects.length} Proyectos
          </span>
          <span className="text-[10px] text-emerald-400">100% en cronograma</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1812] border border-emerald-500/15">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Equipo Asignado</span>
          <span className="text-xl font-mono font-bold text-white mt-1 block">
            {businessTeam.length} Colaboradores
          </span>
          <span className="text-[10px] text-slate-500">Liderazgo delegado</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1812] border border-emerald-500/15">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Decisiones Clave</span>
          <span className="text-xl font-mono font-bold text-white mt-1 block">
            {businessDecisions.length} Registradas
          </span>
          <span className="text-[10px] text-slate-500">Actas & OKRs vigentes</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-emerald-500/15 pb-2">
        <button
          onClick={() => setActiveTab('projects_tasks')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'projects_tasks'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Proyectos & Tablero Kanban
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'team'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Equipo & Delegación ({businessTeam.length})
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'strategy'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Dirección Estratégica & Decisiones
        </button>
      </div>

      {/* Tab: Projects & Kanban */}
      {activeTab === 'projects_tasks' && (
        <div className="space-y-6">
          {/* Projects Bar */}
          <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Proyectos Estratégicos de {currentBusiness?.name}</h3>
                <p className="text-xs text-slate-400">Objetivos tácticos con presupuesto y fecha límite.</p>
              </div>
              <button
                onClick={() => setShowAddProject(!showAddProject)}
                className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Proyecto
              </button>
            </div>

            {showAddProject && (
              <form onSubmit={handleCreateProject} className="mb-4 p-4 rounded-xl bg-[#08100c] border border-emerald-500/20 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre del proyecto"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                  <input
                    type="number"
                    placeholder="Presupuesto ($)"
                    value={newProjectBudget}
                    onChange={(e) => setNewProjectBudget(Number(e.target.value))}
                    className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-500 text-black font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    Crear Proyecto
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {businessProjects.map((proj) => (
                <div key={proj.id} className="p-4 rounded-xl bg-[#08100c] border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{proj.name}</span>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">Fin: {proj.deadline}</span>
                    <span className="font-mono text-emerald-400 font-bold">{proj.progressPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban Board */}
          <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Tablero Kanban de Tareas</h3>
                <p className="text-xs text-slate-400">Flujo de trabajo ágil con delegación de responsabilidades.</p>
              </div>

              {/* Quick Add Task */}
              <form onSubmit={handleCreateTask} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Nueva tarea ejecutiva..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="bg-[#08100c] border border-emerald-500/20 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="bg-[#08100c] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300"
                >
                  <option value="">Asignar a mí mismo</option>
                  {businessTeam.map((m) => (
                    <option key={m.id} value={m.id}>Delegar a {m.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Añadir
                </button>
              </form>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Inbox */}
              <div className="p-3 rounded-xl bg-[#08100c] border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400 font-mono">
                  <span>BANDEJA / INBOX</span>
                  <span>{businessTasks.filter((t) => t.status === 'inbox').length}</span>
                </div>
                <div className="space-y-2">
                  {businessTasks.filter((t) => t.status === 'inbox').map((t) => (
                    <div key={t.id} className="p-2.5 rounded-lg bg-[#0c1812] border border-slate-800 text-xs text-slate-200 space-y-2">
                      <p className="font-medium">{t.title}</p>
                      <button
                        onClick={() => moveTaskStatus(t.id, 'todo')}
                        className="text-[10px] text-emerald-400 hover:underline block"
                      >
                        Mover a Por Hacer →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* To-Do */}
              <div className="p-3 rounded-xl bg-[#08100c] border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-xs font-semibold text-amber-400 font-mono">
                  <span>POR HACER</span>
                  <span>{businessTasks.filter((t) => t.status === 'todo').length}</span>
                </div>
                <div className="space-y-2">
                  {businessTasks.filter((t) => t.status === 'todo').map((t) => (
                    <div key={t.id} className="p-2.5 rounded-lg bg-[#0c1812] border border-slate-800 text-xs text-slate-200 space-y-2">
                      <p className="font-medium">{t.title}</p>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-mono">{t.dueDate}</span>
                        <button
                          onClick={() => moveTaskStatus(t.id, 'in_progress')}
                          className="text-emerald-400 hover:underline"
                        >
                          Iniciar →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress */}
              <div className="p-3 rounded-xl bg-[#08100c] border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-xs font-semibold text-blue-400 font-mono">
                  <span>EN PROGRESO</span>
                  <span>{businessTasks.filter((t) => t.status === 'in_progress').length}</span>
                </div>
                <div className="space-y-2">
                  {businessTasks.filter((t) => t.status === 'in_progress').map((t) => (
                    <div key={t.id} className="p-2.5 rounded-lg bg-[#0c1812] border border-emerald-500/20 text-xs text-slate-200 space-y-2">
                      <p className="font-medium">{t.title}</p>
                      <button
                        onClick={() => moveTaskStatus(t.id, 'done')}
                        className="text-[10px] text-emerald-400 hover:underline block"
                      >
                        Completar ✓
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Done */}
              <div className="p-3 rounded-xl bg-[#08100c] border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-xs font-semibold text-emerald-400 font-mono">
                  <span>COMPLETADAS</span>
                  <span>{businessTasks.filter((t) => t.status === 'done').length}</span>
                </div>
                <div className="space-y-2">
                  {businessTasks.filter((t) => t.status === 'done').map((t) => (
                    <div key={t.id} className="p-2.5 rounded-lg bg-[#0c1812] border border-slate-800 text-xs text-slate-400 line-through">
                      <p>{t.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Team Directory */}
      {activeTab === 'team' && (
        <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Directorio del Equipo & Delegación</h3>
            <p className="text-xs text-slate-400">Supervisa las responsabilidades y tareas delegadas a cada miembro.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {businessTeam.map((member) => (
              <div key={member.id} className="p-4 rounded-xl bg-[#08100c] border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-300">
                  {member.name.charAt(0)}
                </div>
                <h4 className="text-xs font-bold text-white">{member.name}</h4>
                <p className="text-[11px] text-slate-400">{member.role}</p>
                <span className="text-[10px] text-slate-500 font-mono block">{member.email}</span>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-mono">
                  {member.delegatedTasksCount} compromisos activos
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Strategy & Decisions */}
      {activeTab === 'strategy' && (
        <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Repositorio de Decisiones & Estrategia</h3>
            <p className="text-xs text-slate-400">Bitácora de decisiones trascendentales, análisis de contexto y resultados esperados.</p>
          </div>

          <div className="space-y-3">
            {businessDecisions.map((dec) => (
              <div key={dec.id} className="p-4 rounded-xl bg-[#08100c] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{dec.title}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {dec.quarter} · {dec.date}
                  </span>
                </div>
                <p className="text-xs text-slate-300"><span className="text-slate-500">Contexto:</span> {dec.context}</p>
                <p className="text-xs text-emerald-300"><span className="text-slate-500">Decisión adoptada:</span> {dec.decision}</p>
                <p className="text-xs text-slate-400"><span className="text-slate-500">Impacto esperado:</span> {dec.expectedOutcome}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
