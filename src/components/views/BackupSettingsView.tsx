import React, { useState } from 'react';
import { AppStoreData, StorageService } from '../../services/storage';
import {
  FolderGit2,
  Download,
  Upload,
  RefreshCw,
  Shield,
  User,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface BackupSettingsViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

export const BackupSettingsView: React.FC<BackupSettingsViewProps> = ({
  data,
  onUpdateData,
  onExportBackup,
  onImportBackup,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [userName, setUserName] = useState(data.profile.name);
  const [userWeight, setUserWeight] = useState(data.profile.weightKg);
  const [userHeight, setUserHeight] = useState(data.profile.heightCm);
  const [dailyIntention, setDailyIntention] = useState(data.profile.dailyIntention || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: userName,
        weightKg: Number(userWeight) || 70,
        heightCm: Number(userHeight) || 168,
        dailyIntention: dailyIntention,
        calculatedBmi: parseFloat(((Number(userWeight) || 70) / Math.pow((Number(userHeight) || 168) / 100, 2)).toFixed(1)),
      },
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetData = () => {
    if (window.confirm('¿Deseas restablecer los datos al estado inicial? Se recomienda exportar un respaldo primero.')) {
      const reset = StorageService.resetToDefault();
      onUpdateData(() => reset);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0d1a13] to-[#070e0a] border border-emerald-500/20 p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Respaldos, Soberanía & Configuración</h1>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                PERSISTENCIA LOCAL + JSON
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Control absoluto de tus datos: exportación completa, importación instantánea y privacidad total sin dependencias de red.
            </p>
          </div>
        </div>
      </div>

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Backup Card */}
        <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Exportar Respaldo Completo (JSON)</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Descarga un archivo con toda tu información: Súper Mañana, Súper Noche, empresas, proyectos, tareas, biblioteca de sabiduría, entrenamientos y finanzas.
          </p>
          <div className="p-3 rounded-xl bg-[#08100c] border border-slate-800 text-[11px] font-mono text-slate-400">
            Última sincronización local: {new Date(data.lastUpdated).toLocaleString()}
          </div>
          <button
            onClick={onExportBackup}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-md shadow-emerald-950 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar Respaldo JSON
          </button>
        </div>

        {/* Import Backup Card */}
        <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Restaurar Respaldo desde JSON</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Carga un archivo de respaldo previo para restaurar tu segundo cerebro en cualquier dispositivo al instante.
          </p>
          <div className="p-3 rounded-xl bg-[#08100c] border border-slate-800 text-[11px] text-slate-400">
            Los datos importados reemplazarán el estado actual del navegador de forma segura.
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Seleccionar Archivo JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportBackup(file);
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* User Profile Form */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Perfil Ejecutivo & Físico</h2>
          </div>
          {saveSuccess && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Guardado con éxito
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Nombre o Cargo</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Estatura (cm)</label>
            <input
              type="number"
              value={userHeight}
              onChange={(e) => setUserHeight(Number(e.target.value))}
              className="w-full bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Peso (kg)</label>
            <input
              type="number"
              value={userWeight}
              onChange={(e) => setUserWeight(Number(e.target.value))}
              className="w-full bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Intención Diaria Predeterminada</label>
          <input
            type="text"
            value={dailyIntention}
            onChange={(e) => setDailyIntention(e.target.value)}
            className="w-full bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleResetData}
            className="text-xs text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Restablecer a valores iniciales de fábrica
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl cursor-pointer"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};
