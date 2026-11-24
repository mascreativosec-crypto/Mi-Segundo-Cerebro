import React, { useEffect, useState } from 'react';
import { AppStoreData, StorageService } from '../../services/storage';
import {
  FolderGit2,
  Download,
  Upload,
  User,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Trash2,
} from 'lucide-react';

interface BackupSettingsViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

const AVATAR_MAX_DIMENSION = 192;
const AVATAR_MAX_BYTES = 35 * 1024; // ~35 KB hard ceiling for ultra-light storage

function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}

async function compressProfileAvatar(file: File): Promise<{ dataUrl: string; sizeKb: number }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona una imagen válida (JPG, PNG o WebP).');
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('La imagen original supera 12 MB. Elige una foto más pequeña.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
      el.src = objectUrl;
    });

    const side = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const sx = Math.max(0, Math.floor(((img.naturalWidth || img.width) - side) / 2));
    const sy = Math.max(0, Math.floor(((img.naturalHeight || img.height) - side) / 2));

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_MAX_DIMENSION;
    canvas.height = AVATAR_MAX_DIMENSION;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen en este navegador.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION);

    // Try WebP first (smallest weight), fallback to JPEG with progressive quality reduction
    let dataUrl = canvas.toDataURL('image/webp', 0.78);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.78);
    }

    let quality = 0.72;
    while (estimateDataUrlBytes(dataUrl) > AVATAR_MAX_BYTES && quality >= 0.4) {
      const mime = dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
      dataUrl = canvas.toDataURL(mime, quality);
      quality -= 0.12;
    }

    const bytes = estimateDataUrlBytes(dataUrl);
    return {
      dataUrl,
      sizeKb: Math.max(1, Math.round(bytes / 1024)),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const BackupSettingsView: React.FC<BackupSettingsViewProps> = ({
  data,
  onUpdateData,
  onExportBackup,
  onImportBackup,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [userName, setUserName] = useState(data.profile.name);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(data.profile.avatarDataUrl);
  const [avatarInfo, setAvatarInfo] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [userWeight, setUserWeight] = useState(data.profile.weightKg);
  const [userHeight, setUserHeight] = useState(data.profile.heightCm);
  const [dailyIntention, setDailyIntention] = useState(data.profile.dailyIntention || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setUserName(data.profile.name);
    setAvatarDataUrl(data.profile.avatarDataUrl);
  }, [data.profile.name, data.profile.avatarDataUrl]);

  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError(null);
    setAvatarInfo(null);
    setIsCompressingAvatar(true);
    try {
      const { dataUrl, sizeKb } = await compressProfileAvatar(file);
      setAvatarDataUrl(dataUrl);
      setAvatarInfo(`Foto optimizada a ${sizeKb} KB (${AVATAR_MAX_DIMENSION}×${AVATAR_MAX_DIMENSION} px)`);
      onUpdateData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatarDataUrl: dataUrl,
        },
      }));
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'No se pudo optimizar la foto.');
    } finally {
      setIsCompressingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarDataUrl(undefined);
    setAvatarInfo(null);
    setAvatarError(null);
    onUpdateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        avatarDataUrl: undefined,
      },
    }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = userName.trim() || 'Usuario';
    onUpdateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: cleanName,
        avatarDataUrl,
        weightKg: Number(userWeight) || 70,
        heightCm: Number(userHeight) || 168,
        dailyIntention: dailyIntention,
        calculatedBmi: parseFloat(
          ((Number(userWeight) || 70) / Math.pow((Number(userHeight) || 168) / 100, 2)).toFixed(1)
        ),
      },
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        '¿Deseas restablecer los datos al estado inicial? Se recomienda exportar un respaldo primero.'
      )
    ) {
      const reset = StorageService.resetToDefault();
      onUpdateData(() => reset);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Apple Liquid Glass with Slate/Zinc squircle */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-600 via-slate-700 to-zinc-800 flex items-center justify-center text-white shadow-lg shadow-slate-600/25 shrink-0">
            <FolderGit2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Respaldos, Soberanía &amp; Configuración
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Control absoluto de tus datos: exportación completa JSON, importación instantánea y perfil personal.
            </p>
          </div>
        </div>
      </div>

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Backup Card */}
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Exportar Respaldo Completo (JSON)
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Descarga un archivo con toda tu información: Súper Mañana, Súper Noche, empresas, proyectos, tareas, biblioteca de sabiduría, entrenamientos y finanzas.
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
              Última sincronización local: {new Date(data.lastUpdated).toLocaleString()}
            </div>
          </div>
          <button
            onClick={onExportBackup}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            Descargar Respaldo JSON
          </button>
        </div>

        {/* Import Backup Card */}
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Restaurar Respaldo desde JSON
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Carga un archivo de respaldo previo para restaurar tu segundo cerebro en cualquier dispositivo al instante.
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
              Los datos importados reemplazarán el estado actual del navegador de forma segura.
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Upload className="w-4 h-4 text-blue-500" />
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

      {/* User Profile Form with Lightweight Compressed Avatar */}
      <form
        onSubmit={handleSaveProfile}
        className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Perfil Ejecutivo &amp; Físico
            </h2>
          </div>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Guardado con éxito
            </span>
          )}
        </div>

        {/* Profile Photo Uploader (Auto-Compressed <= 35KB) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.07]">
          <div className="relative shrink-0">
            {avatarDataUrl ? (
              <img
                src={avatarDataUrl}
                alt={userName}
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/40 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Foto de Perfil (Optimización Ligera Automática)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Se recorta y comprime automáticamente a 192×192 px (aprox. 8–20 KB) para no consumir espacio en el servidor ni en tus respaldos.
            </p>
            {avatarInfo && (
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {avatarInfo}
              </p>
            )}
            {avatarError && (
              <p className="text-[11px] font-semibold text-rose-500">{avatarError}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isCompressingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCompressingAvatar ? 'Optimizando...' : avatarDataUrl ? 'Cambiar Foto' : 'Subir Foto'}</span>
            </button>
            {avatarDataUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                title="Quitar foto de perfil"
                className="p-2 rounded-xl bg-slate-200/80 dark:bg-white/[0.07] hover:bg-rose-500/15 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarSelected}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Nombre o Cargo
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Estatura (cm)
            </label>
            <input
              type="number"
              value={userHeight}
              onChange={(e) => setUserHeight(Number(e.target.value))}
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              value={userWeight}
              onChange={(e) => setUserWeight(Number(e.target.value))}
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
            Intención Diaria Predeterminada
          </label>
          <input
            type="text"
            value={dailyIntention}
            onChange={(e) => setDailyIntention(e.target.value)}
            className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={handleResetData}
            className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            Restablecer a valores iniciales de fábrica
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

