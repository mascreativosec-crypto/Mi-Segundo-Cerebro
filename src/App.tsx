/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StorageService, AppStoreData, initialStoreData } from './services/storage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { PersonalDashboardView } from './components/views/PersonalDashboardView';
import { MiDiaView } from './components/views/MiDiaView';
import { BusinessView } from './components/views/BusinessView';
import { PhysicalTrainerView } from './components/views/PhysicalTrainerView';
import { WisdomLibraryView } from './components/views/WisdomLibraryView';
import { MindsetCoachView } from './components/views/MindsetCoachView';
import { FinancesView } from './components/views/FinancesView';
import { SpiritualEmotionalView } from './components/views/SpiritualEmotionalView';
import { SecondBrainView } from './components/views/SecondBrainView';
import { ActivationCenterView } from './components/views/ActivationCenterView';
import { BackupSettingsView } from './components/views/BackupSettingsView';
import { GeneralTasksView } from './components/views/GeneralTasksView';
import { StrategyView } from './components/views/StrategyView';
import { HabitsAndGoalsView } from './components/views/HabitsAndGoalsView';
import { SuperMorningModule } from './modules/super-morning/SuperMorningModule';
import { SuperNightModule } from './modules/super-night/SuperNightModule';
import { PersonalModule } from './modules/personal/PersonalModule';
import { QuickCaptureModal } from './components/modals/QuickCaptureModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { Menu } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<AppStoreData>(() => StorageService.load());
  // Default landing view: Personal 5 Pillars growth dashboard (as chosen in Q3)
  const [activeView, setActiveView] = useState<string>('personal_dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Apple Liquid Glass Theme State (dark vs light)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('apple_liquid_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  // Keep <html class="dark"> in sync with theme state
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('apple_liquid_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync to local storage on state update
  const updateData = (updater: (prev: AppStoreData) => AppStoreData) => {
    setData((prev) => {
      const next = updater(prev);
      StorageService.save(next);
      return next;
    });
  };

  // Global hotkey Cmd+K or Ctrl+K for quick capture
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleExportBackup = () => {
    StorageService.exportBackup(data);
  };

  const handleImportBackup = async (file: File) => {
    try {
      const imported = await StorageService.importBackup(file);
      setData(imported);
      alert('Respaldo restaurado con éxito.');
    } catch (err: any) {
      alert(`Error al importar: ${err.message}`);
    }
  };

  const markAllNotificationsRead = () => {
    updateData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const clearAllNotifications = () => {
    updateData((prev) => ({
      ...prev,
      notifications: [],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-[#070e0a]/80 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-300 transition-colors duration-200">
      {/* Top Bar Contract Navigation */}
      <Navbar
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        notifications={data.notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        userName={data.profile.name}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Mobile hamburger trigger */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 bg-white/80 dark:bg-[#0c1219] border border-slate-300/80 dark:border-white/[0.1] rounded-2xl text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs font-medium cursor-pointer shadow-sm"
            >
              <Menu className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Menú de Módulos</span>
            </button>
          </div>

          {/* Views Router */}
          {activeView === 'personal_dashboard' && (
            <PersonalDashboardView
              data={data}
              onNavigate={setActiveView}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
              onUpdateData={updateData}
            />
          )}

          {activeView === 'mi_dia' && (
            <MiDiaView
              data={data}
              onNavigate={setActiveView}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
              onUpdateData={updateData}
            />
          )}

          {activeView === 'tasks_general' && (
            <GeneralTasksView
              data={data}
              onUpdateData={updateData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeView === 'personal' && (
            <PersonalModule
              data={data}
              onUpdateData={updateData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeView === 'habits_goals' && (
            <HabitsAndGoalsView
              data={data}
              onUpdateData={updateData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeView === 'super_morning' && (
            <SuperMorningModule
              routine={data.superMorning}
              onUpdate={(updated) =>
                updateData((prev) => ({ ...prev, superMorning: updated }))
              }
              onTriggerActivationCoach={() => setActiveView('mindset')}
              onNavigateToSuperNight={() => setActiveView('super_night')}
            />
          )}

          {activeView === 'super_night' && (
            <SuperNightModule
              review={data.superNight}
              onUpdate={(updated) =>
                updateData((prev) => ({ ...prev, superNight: updated }))
              }
              onTriggerReflectionCoach={() => setActiveView('mindset')}
              onNavigateToSuperMorning={() => setActiveView('super_morning')}
            />
          )}

          {activeView === 'business' && (
            <BusinessView
              data={data}
              onUpdateData={updateData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeView === 'strategy' && (
            <StrategyView
              data={data}
              onUpdateData={updateData}
            />
          )}

          {activeView === 'physical_trainer' && (
            <PhysicalTrainerView
              data={data}
              onUpdateData={updateData}
            />
          )}

          {activeView === 'wisdom_library' && (
            <WisdomLibraryView
              data={data}
              onUpdateData={updateData}
            />
          )}

          {activeView === 'mindset' && (
            <MindsetCoachView
              data={data}
              onUpdateData={updateData}
            />
          )}

          {activeView === 'personal_finances' && (
            <FinancesView
              data={data}
              onUpdateData={updateData}
            />
          )}

          {activeView === 'spiritual_emotional' && (
            <SpiritualEmotionalView
              data={data}
              onUpdateData={updateData}
            />
          )}

          {activeView === 'second_brain' && (
            <SecondBrainView
              data={data}
              onUpdateData={updateData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeView === 'activation_center' && (
            <ActivationCenterView
              data={data}
              onUpdateData={updateData}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'backup_settings' && (
            <BackupSettingsView
              data={data}
              onUpdateData={updateData}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        data={data}
        onUpdateData={updateData}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={data.notifications}
        onMarkAllAsRead={markAllNotificationsRead}
        onClearNotifications={clearAllNotifications}
      />
    </div>
  );
}
