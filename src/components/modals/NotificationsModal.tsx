import React from 'react';
import { AppNotification } from '../../types';
import { Bell, X } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearNotifications,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl bg-white dark:bg-slate-900 border-t lg:border border-slate-200 dark:border-white/[0.1] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:p-6 max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4 lg:zoom-in-95 duration-200">
        <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 lg:hidden" />
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Centro de Notificaciones</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs mb-3 text-slate-500 dark:text-slate-400">
          <span>{notifications.length} Avisos Registrados</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-[11px] font-semibold"
            >
              Marcar Leídas
            </button>
            <span>·</span>
            <button
              onClick={onClearNotifications}
              className="text-rose-500 hover:underline cursor-pointer text-[11px] font-semibold"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No tienes notificaciones pendientes.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-all ${
                  notif.read
                    ? 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/[0.04] text-slate-500 dark:text-slate-400'
                    : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-500/20 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    {notif.title}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">{notif.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{notif.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
