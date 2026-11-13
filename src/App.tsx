/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { StorageService, AppStoreData, initialStoreData } from './services/storage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MobileQuickActionSheet } from './components/layout/MobileQuickActionSheet';
import { MobileModulesView } from './components/views/MobileModulesView';
import { PersonalDashboardView } from './components/views/PersonalDashboardView';
import { MiDiaView } from './components/views/MiDiaView';
import { BusinessView } from './components/views/BusinessView';
import { PhysicalTrainerView } from './components/views/PhysicalTrainerView';
import { WisdomLibraryView } from './components/views/WisdomLibraryView';
import { MindsetCoachView } from './components/views/MindsetCoachView';
import { FinancesView } from './components/views/FinancesView';
import { SpiritualView } from './components/views/SpiritualView';
import { EmotionalView } from './components/views/EmotionalView';
import { SecondBrainView } from './components/views/SecondBrainView';
import { ActivationCenterView } from './components/views/ActivationCenterView';
import { BackupSettingsView } from './components/views/BackupSettingsView';
import { GeneralTasksView } from './components/views/GeneralTasksView';
import { StrategyView, StrategyStudioAction } from './components/views/StrategyView';
import { HabitsAndGoalsView } from './components/views/HabitsAndGoalsView';
import { PersonalExperimentsView } from './components/views/PersonalExperimentsView';
import { AiAssistantView } from './components/views/AiAssistantView';
import { SuperMorningModule } from './modules/super-morning/SuperMorningModule';
import { SuperNightModule } from './modules/super-night/SuperNightModule';
import { PersonalModule } from './modules/personal/PersonalModule';
import { QuickCaptureModal } from './components/modals/QuickCaptureModal';
import { NotificationsModal } from './components/modals/NotificationsModal';

export default function App() {
  const [data, setData] = useState<AppStoreData>(() => StorageService.load());
  // Default landing view: Personal 5 Pillars growth dashboard (as chosen in Q3)
  const [activeView, setActiveView] = useState<string>('personal_dashboard');
  const [lastModuleView, setLastModuleView] = useState<string>('personal_dashboard');
  const [isMobileQuickActionOpen, setIsMobileQuickActionOpen] = useState<boolean>(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [financeInitialAction, setFinanceInitialAction] = useState<'add_tx' | null>(null);
  const [strategyInitialAction, setStrategyInitialAction] = useState<StrategyStudioAction | null>(null);
  const [businessFocusTaskId, setBusinessFocusTaskId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

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

  const handleOpenQuickPayment = () => {
    setFinanceInitialAction('add_tx');
    setActiveView('personal_finances');
  };

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    if (activeView !== 'mobile_modules') {
      setLastModuleView(activeView);
    }
  }, [activeView]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleResize = (e: MediaQueryListEvent) => {
      if (e.matches && activeView === 'mobile_modules') {
        setActiveView(lastModuleView || 'personal_dashboard');
      }
    };
    mq.addEventListener('change', handleResize);
    return () => mq.removeEventListener('change', handleResize);
  }, [activeView, lastModuleView]);

  const handleRecordStrategicMeeting = () => {
    setStrategyInitialAction({ type: 'record' });
    setActiveView('strategy');
  };

  const handleUploadStrategicAudio = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setStrategyInitialAction({
        type: 'upload',
        base64,
        mimeType: file.type || 'audio/mp3',
        fileName: file.name,
      });
      setActiveView('strategy');
      setIsMobileQuickActionOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMorningToReminders = (
    title: string,
    content: string,
    category: 'super_manana' | 'frase' = 'super_manana'
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    updateData((prev) => ({
      ...prev,
      notesReminders: [
        {
          id: `nr_sm_${Date.now()}`,
          title,
          content,
          category,
          originModule: 'super_manana',
          targetView: 'super_morning',
          reminderDate: todayStr,
          showInMiDia: true,
          completed: false,
          pinned: true,
          source: 'super_morning',
          createdAt: new Date().toISOString(),
        },
        ...(prev.notesReminders || []),
      ],
    }));
  };

  return (
    <div className="h-[100dvh] overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-visible bg-slate-100/60 dark:bg-[#070e0a]/80 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-300 transition-colors duration-200">
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
        onOpenMobileMenu={() => {
          setIsMobileQuickActionOpen(false);
          setActiveView('mobile_modules');
        }}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar Navigation (Desktop >= 1024px) */}
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
        />

        {/* Main Content Area (Single native scroll container on mobile) */}
        <main
          ref={mainRef}
          className="flex-1 min-h-0 overflow-y-auto px-3 pt-2.5 pb-20 md:px-6 md:pt-6 lg:p-8 max-w-7xl mx-auto w-full"
        >
          {/* Views Router */}
          {activeView === 'mobile_modules' && (
            <MobileModulesView
              lastModuleView={lastModuleView}
              onSelectModule={(viewId) => {
                setIsMobileQuickActionOpen(false);
                setActiveView(viewId);
              }}
              userName={data.profile.name}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          )}

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
              onOpenQuickPayment={handleOpenQuickPayment}
              onUpdateData={updateData}
            />
          )}

          {activeView === 'ai_assistant' && (
            <AiAssistantView
              data={data}
              onUpdateData={updateData}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'tasks_general' && (
            <GeneralTasksView
              data={data}
              onUpdateData={updateData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
              onOpenBusinessTaskKanban={(task) => {
                setBusinessFocusTaskId(task.id);
                setActiveView('business');
              }}
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

          {activeView === 'personal_experiments' && (
            <PersonalExperimentsView
              data={data}
              onUpdateData={updateData}
              onNavigate={setActiveView}
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
              onNavigateToPhysicalTrainer={() => setActiveView('physical_trainer')}
              onSendToReminders={handleSendMorningToReminders}
            />
          )}

          {activeView === 'super_night' && (() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayMood =
              data.moodEntries.find((m) => m.date === todayStr) || data.moodEntries[0];
            return (
              <SuperNightModule
                review={data.superNight}
                onUpdate={(updated) =>
                  updateData((prev) => ({ ...prev, superNight: updated }))
                }
                onTriggerReflectionCoach={() => setActiveView('mindset')}
                onNavigateToSuperMorning={() => setActiveView('super_morning')}
                todayMood={todayMood}
                onSyncMoodEntry={(entry) =>
                  updateData((prev) => {
                    const exists = prev.moodEntries.some((m) => m.id === entry.id || m.date === entry.date);
                    return {
                      ...prev,
                      moodEntries: exists
                        ? prev.moodEntries.map((m) =>
                            m.id === entry.id || m.date === entry.date ? entry : m
                          )
                        : [entry, ...prev.moodEntries],
                    };
                  })
                }
              />
            );
          })()}

          {activeView === 'business' && (
            <BusinessView
              data={data}
              onUpdateData={updateData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
              initialFocusTaskId={businessFocusTaskId}
              onClearInitialFocusTask={() => setBusinessFocusTaskId(null)}
            />
          )}

          {activeView === 'strategy' && (
            <StrategyView
              data={data}
              onUpdateData={updateData}
              initialStudioAction={strategyInitialAction}
              onClearInitialStudioAction={() => setStrategyInitialAction(null)}
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
              initialAction={financeInitialAction}
              onClearInitialAction={() => setFinanceInitialAction(null)}
            />
          )}

          {(activeView === 'spiritual' || activeView === 'spiritual_emotional') && (
            <SpiritualView
              data={data}
              onUpdateData={updateData}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'emotional' && (
            <EmotionalView
              data={data}
              onUpdateData={updateData}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'second_brain' && (
            <SecondBrainView
              data={data}
              onUpdateData={updateData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
              onNavigate={setActiveView}
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

      {/* Mobile (+) Quick Action Sheet: Grabar Junta / Subir Audio / Captura Rápida */}
      <MobileQuickActionSheet
        isOpen={isMobileQuickActionOpen}
        onClose={() => setIsMobileQuickActionOpen(false)}
        onRecordStrategicMeeting={handleRecordStrategicMeeting}
        onUploadStrategicAudio={handleUploadStrategicAudio}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
      />

      {/* Native Mobile Bottom Tab Bar (lg:hidden) */}
      <MobileBottomNav
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setIsMobileQuickActionOpen(false);
        }}
        onOpenQuickActionSheet={() => {
          setIsMobileQuickActionOpen((prev) => !prev);
        }}
        onOpenModulesMenu={() => {
          setIsMobileQuickActionOpen(false);
          setActiveView('mobile_modules');
        }}
        isQuickActionOpen={isMobileQuickActionOpen}
      />
    </div>
  );
}
