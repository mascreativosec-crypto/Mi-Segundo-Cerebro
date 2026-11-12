import React from 'react';
import { AppNotification } from '../../types';
import { Bell, X, CheckCircle2, Clock, Trash2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl bg-[#0c1812] border border-emerald-500/30 p-5 shadow-2xl shadow-emerald-950/60 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Centro de Notificaciones</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs mb-3 text-slate-400">
          <span>{notifications.length} Avisos Registrados</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-emerald-400 hover:underline cursor-pointer text-[11px]"
            >
              Marcar Leídas
            </button>
            <span>·</span>
            <button
              onClick={onClearNotifications}
              className="text-red-400 hover:underline cursor-pointer text-[11px]"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No tienes notificaciones pendientes.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                  notif.read
                    ? 'bg-[#08100c]/60 border-slate-900 text-slate-400'
                    : 'bg-[#08100c] border-emerald-500/30 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    {notif.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{notif.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{notif.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
