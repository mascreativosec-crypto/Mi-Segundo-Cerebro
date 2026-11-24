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
import { NotesStudioAction } from './types';
import { HabitsAndGoalsView } from './components/views/HabitsAndGoalsView';
import { PersonalExperimentsView } from './components/views/PersonalExperimentsView';
import { AiAssistantView } from './components/views/AiAssistantView';
import { PersonalNotesView } from './components/views/PersonalNotesView';
import { LoginView } from './components/views/LoginView';
import { SuperMorningModule } from './modules/super-morning/SuperMorningModule';
import { SuperNightModule } from './modules/super-night/SuperNightModule';
import { PersonalModule } from './modules/personal/PersonalModule';
import { QuickCaptureModal } from './components/modals/QuickCaptureModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { AppleBookReaderModal } from './components/modals/AppleBookReaderModal';
import { ReminderToastBanner, ReminderToastPayload } from './components/shared/ReminderToastBanner';
import { applyReadingSecondsToStore } from './utils/readingGoal';
import { clearAuthToken, fetchJsonWithTimeout } from './utils/fetchWithTimeout';

export default function App() {
  const [data, setData] = useState<AppStoreData>(() => StorageService.load());
  // Default landing view: Personal 5 Pillars growth dashboard (as chosen in Q3)
  const [activeView, setActiveView] = useState<string>('personal_dashboard');
  const [lastModuleView, setLastModuleView] = useState<string>('personal_dashboard');
  const [isMobileQuickActionOpen, setIsMobileQuickActionOpen] = useState<boolean>(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [financeInitialAction, setFinanceInitialAction] = useState<'add_tx' | null>(null);
  const [notesStudioAction, setNotesStudioAction] = useState<NotesStudioAction | null>(null);
  const [businessFocusTaskId, setBusinessFocusTaskId] = useState<string | null>(null);
  const [personalFocusTaskId, setPersonalFocusTaskId] = useState<string | null>(null);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [readingBookId, setReadingBookId] = useState<string | null>(null);
  const [backupToast, setBackupToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isNotesEditorFullscreen, setIsNotesEditorFullscreen] = useState<boolean>(false);
  const [authState, setAuthState] = useState<{
    checking: boolean;
    configured: boolean;
    authenticated: boolean;
    username: string | null;
  }>({
    checking: true,
    configured: false,
    authenticated: false,
    username: null,
  });
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const { ok, data: statusData } = await fetchJsonWithTimeout<{
          configured?: boolean;
          authenticated?: boolean;
          username?: string | null;
          displayName?: string | null;
        }>('/api/auth/status', { method: 'GET' }, 10000);
        if (!active) return;
        if (ok) {
          const resolvedName = (statusData.displayName || statusData.username || '').trim();
          if (statusData.authenticated && resolvedName) {
            setData((prev) => {
              if (prev.profile.name && prev.profile.name !== 'Director Ejecutivo') return prev;
              const next = {
                ...prev,
                profile: { ...prev.profile, name: resolvedName },
              };
              StorageService.save(next);
              return next;
            });
          }
          setAuthState({
            checking: false,
            configured: Boolean(statusData.configured),
            authenticated: Boolean(statusData.authenticated),
            username: statusData.username || null,
          });
        } else {
          setAuthState({
            checking: false,
            configured: true,
            authenticated: false,
            username: null,
          });
        }
      } catch {
        if (!active) return;
        setAuthState({
          checking: false,
          configured: false,
          authenticated: false,
          username: null,
        });
      }
    };
    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetchJsonWithTimeout('/api/auth/logout', { method: 'POST' }, 8000);
    } catch {
      // ignore network failure during logout
    } finally {
      clearAuthToken();
      setAuthState((prev) => ({
        checking: false,
        configured: true,
        authenticated: false,
        username: null,
      }));
    }
  };

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
      setBackupToast({ type: 'success', text: 'Respaldo restaurado y validado con éxito.' });
    } catch (err: any) {
      setBackupToast({ type: 'error', text: `Error al importar respaldo: ${err.message}` });
    } finally {
      setTimeout(() => setBackupToast(null), 4500);
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

  const handleOpenPersonalNote = (noteId: string) => {
    setFocusedNoteId(noteId);
    setActiveView('personal_notes');
  };

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    if (activeView !== 'mobile_modules') {
      setLastModuleView(activeView);
    }
    if (activeView !== 'personal_notes') {
      setIsNotesEditorFullscreen(false);
      setIsSidebarCollapsed(false);
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'personal_notes') {
      setIsSidebarCollapsed(isNotesEditorFullscreen);
    }
  }, [activeView, isNotesEditorFullscreen]);

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
    setNotesStudioAction({ type: 'record' });
    setActiveView('personal_notes');
  };

  const handleUploadStrategicAudio = (file: File) => {
    const inferMime = (f: File) => {
      if (f.type && f.type.startsWith('audio/')) return f.type.split(';')[0].trim();
      const lower = f.name.toLowerCase();
      if (lower.endsWith('.m4a') || lower.endsWith('.mp4') || lower.endsWith('.aac')) return 'audio/mp4';
      if (lower.endsWith('.wav')) return 'audio/wav';
      if (lower.endsWith('.ogg') || lower.endsWith('.opus')) return 'audio/ogg';
      if (lower.endsWith('.webm')) return 'audio/webm';
      return 'audio/mpeg';
    };
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setNotesStudioAction({
        type: 'upload',
        base64,
        mimeType: inferMime(file),
        fileName: file.name,
      });
      setActiveView('personal_notes');
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

  if (authState.checking) {
    return (
      <div className="min-h-[100dvh] bg-[#080b11] text-white flex flex-col items-center justify-center gap-3 px-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 animate-pulse" />
        <p className="text-xs font-semibold tracking-wide text-slate-300">
          Verificando acceso a Mi Segundo Cerebro 4.0...
        </p>
      </div>
    );
  }

  if (!authState.authenticated) {
    return (
      <LoginView
        configured={authState.configured}
        onAuthenticated={({ username, displayName }) => {
          const resolvedName = (displayName || username || '').trim();
          if (resolvedName) {
            updateData((prev) => ({
              ...prev,
              profile: {
                ...prev.profile,
                name:
                  displayName || prev.profile.name === 'Director Ejecutivo'
                    ? resolvedName
                    : prev.profile.name,
              },
            }));
          }
          setAuthState({
            checking: false,
            configured: true,
            authenticated: true,
            username,
          });
        }}
      />
    );
  }

  const isFullCanvasNotes = activeView === 'personal_notes' && isNotesEditorFullscreen;

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-100/60 dark:bg-[#080b11]/90 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-300 transition-colors duration-200">
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
        userAvatar={data.profile.avatarDataUrl}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        onOpenMobileMenu={() => {
          setIsMobileQuickActionOpen(false);
          setActiveView('mobile_modules');
        }}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar Navigation (Desktop >= 1024px — auto-minimizes in Notes for full-width canvas) */}
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Main Content Area (Single scroll container; Navbar & Sidebar remain fixed) */}
        <main
          ref={mainRef}
          className={`flex-1 min-h-0 overflow-y-auto ${
            isFullCanvasNotes
              ? 'px-2 pt-2 pb-20 lg:p-3'
              : 'px-3 pt-2.5 pb-20 md:px-6 md:pt-6 lg:p-8'
          }`}
        >
          <div className={isFullCanvasNotes ? 'w-full h-full' : 'max-w-7xl mx-auto w-full'}>
          {/* Views Router */}
          {activeView === 'mobile_modules' && (
            <MobileModulesView
              lastModuleView={lastModuleView}
              onSelectModule={(viewId) => {
                setIsMobileQuickActionOpen(false);
                setActiveView(viewId);
              }}
              userName={data.profile.name}
              userAvatar={data.profile.avatarDataUrl}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onLogout={handleLogout}
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
              initialFocusTaskId={personalFocusTaskId}
              onClearInitialFocusTask={() => setPersonalFocusTaskId(null)}
              onOpenBusinessTaskKanban={(task) => {
                setBusinessFocusTaskId(task.id);
                setActiveView('business');
              }}
              onOpenPersonalNote={handleOpenPersonalNote}
            />
          )}

          {activeView === 'personal' && (
            <PersonalModule
              data={data}
              onUpdateData={updateData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeView === 'personal_notes' && (
            <PersonalNotesView
              data={data}
              onUpdateData={updateData}
              onNavigate={setActiveView}
              initialNoteId={focusedNoteId}
              onClearInitialNoteId={() => setFocusedNoteId(null)}
              initialStudioAction={notesStudioAction}
              onClearInitialStudioAction={() => setNotesStudioAction(null)}
              onEditorFullscreenChange={setIsNotesEditorFullscreen}
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
              onOpenPersonalNote={handleOpenPersonalNote}
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
              books={data.books}
              readingGoal={data.readingGoal}
              onOpenBookReader={(bookId) => setReadingBookId(bookId)}
              onNavigateToLibrary={() => setActiveView('wisdom_library')}
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
              onOpenPersonalNote={handleOpenPersonalNote}
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
              onOpenBookReader={(bookId) => setReadingBookId(bookId)}
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
          </div>
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

      {/* Shared Apple Books Fullscreen PDF Reader (accessible from Biblioteca & Súper Mañana) */}
      <AppleBookReaderModal
        book={readingBookId ? data.books.find((b) => b.id === readingBookId) || null : null}
        onClose={() => setReadingBookId(null)}
        onUpdateBook={(bookId, updater) =>
          updateData((prev) => ({
            ...prev,
            books: prev.books.map((b) => (b.id === bookId ? updater(b) : b)),
          }))
        }
        onAddWisdomCapsule={(capsule) =>
          updateData((prev) => ({
            ...prev,
            wisdomCapsules: [capsule, ...prev.wisdomCapsules],
          }))
        }
        readingGoal={data.readingGoal}
        onTrackReadingSeconds={(deltaSeconds) =>
          updateData((prev) => applyReadingSecondsToStore(prev, deltaSeconds))
        }
        backLabel={activeView === 'super_morning' ? 'Súper Mañana' : 'Biblioteca'}
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
      {/* Top Reminder Toast Banner with Soft Alert Sound & Smart Routing */}
      <ReminderToastBanner
        data={data}
        onUpdateData={updateData}
        onSelectToast={(toast: ReminderToastPayload) => {
          if (toast.kind === 'business_task' && toast.linkedTaskId) {
            setBusinessFocusTaskId(toast.linkedTaskId);
            setActiveView('business');
            return;
          }
          if (toast.kind === 'personal_task' && toast.linkedTaskId) {
            setPersonalFocusTaskId(toast.linkedTaskId);
            setActiveView('tasks_general');
            return;
          }
          setActiveView(toast.targetView || 'second_brain');
        }}
      />

      {/* Inline Backup Toast Banner */}
      {backupToast && (
        <div
          className={`fixed top-20 right-4 z-[95] px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl border backdrop-blur-xl ${
            backupToast.type === 'success'
              ? 'bg-emerald-500/90 border-emerald-400/50 text-white'
              : 'bg-rose-600/95 border-rose-400/50 text-white'
          }`}
        >
          {backupToast.text}
        </div>
      )}
    </div>
  );
}
