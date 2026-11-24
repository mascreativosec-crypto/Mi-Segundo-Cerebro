import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Compass,
  Building2,
  Bot,
  NotebookPen,
  ShieldCheck,
} from 'lucide-react';
import { fetchJsonWithTimeout, setAuthToken } from '../../utils/fetchWithTimeout';
import loginBg from '../../assets/images/login_liquid_glass_bg_1795486368488.jpg';

export interface AuthSuccessPayload {
  username: string;
  displayName?: string;
  token?: string;
}

interface LoginViewProps {
  configured: boolean;
  onAuthenticated: (payload: AuthSuccessPayload) => void;
}

const VALUE_HIGHLIGHTS = [
  {
    icon: Compass,
    iconBg: 'bg-blue-500/15 border-blue-400/25 text-blue-300',
    title: '5 Pilares',
    detail: 'Hábitos, salud y enfoque diario.',
  },
  {
    icon: Building2,
    iconBg: 'bg-indigo-500/15 border-indigo-400/25 text-indigo-300',
    title: 'Multi-Negocio',
    detail: 'Proyectos, tareas y estrategia.',
  },
  {
    icon: Bot,
    iconBg: 'bg-sky-500/15 border-sky-400/25 text-sky-300',
    title: 'IA & Voz',
    detail: 'Actas y acuerdos desde audio.',
  },
  {
    icon: NotebookPen,
    iconBg: 'bg-purple-500/15 border-purple-400/25 text-purple-300',
    title: 'Notas & Finanzas',
    detail: 'Plan anual, calendario y gastos.',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ configured, onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bgFailed, setBgFailed] = useState(false);

  const isSetupMode = !configured;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      setErrorMessage('Ingresa un usuario de al menos 3 caracteres.');
      return;
    }

    if (isSetupMode) {
      if (password.length < 6) {
        setErrorMessage('Crea una contraseña de al menos 6 caracteres.');
        return;
      }
    } else if (!password) {
      setErrorMessage('Ingresa tu contraseña para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isSetupMode ? '/api/auth/setup' : '/api/auth/login';
      const { ok, data } = await fetchJsonWithTimeout<{
        authenticated?: boolean;
        username?: string;
        displayName?: string;
        token?: string;
        error?: string;
      }>(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUser, displayName: cleanUser, password }),
        },
        20000
      );

      if (!ok || !data.authenticated) {
        setErrorMessage(data.error || 'No se pudo validar tu acceso. Verifica usuario y contraseña.');
        return;
      }

      if (data.token) {
        setAuthToken(data.token);
      }

      const resolvedUsername = data.username || cleanUser;
      onAuthenticated({
        username: resolvedUsername,
        displayName: resolvedUsername,
        token: data.token,
      });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error de conexión con el servidor. Intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[#080b11] text-white flex flex-col justify-between selection:bg-blue-500/30 selection:text-blue-200">
      {/* Full-bleed Apple Liquid Glass Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {!bgFailed && (
          <img
            src={loginBg}
            alt="Estudio ejecutivo minimalista de alta productividad estilo Apple Liquid Glass"
            referrerPolicy="no-referrer"
            onError={() => setBgFailed(true)}
            className="w-full h-full object-cover object-center scale-[1.01]"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#070a12]/88 via-[#0a1020]/68 to-[#080b14]/88"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(59,130,246,0.22),transparent_48%),radial-gradient(circle_at_82%_26%,rgba(139,92,246,0.18),transparent_46%),radial-gradient(circle_at_70%_84%,rgba(244,63,94,0.11),transparent_42%)]"
          aria-hidden="true"
        />
      </div>

      {/* Top Subtle Apple Liquid Glass Brand Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 p-[1.5px] shadow-lg shadow-blue-500/25">
            <div className="w-full h-full rounded-[14px] bg-[#080d14]/95 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-blue-400" />
            </div>
          </div>
          <div>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-white block leading-tight">
              Mi Segundo Cerebro <span className="text-blue-400">4.0</span>
            </span>
            <span className="text-[11px] text-slate-300/85 block leading-tight">
              Sistema Operativo de Ultra Productividad Personal y Directiva
            </span>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] text-xs font-medium text-blue-200/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Acceso Privado
        </span>
      </header>

      {/* Main Split Stage */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 py-4 sm:py-8 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          {/* Mobile Compact Intro (keeps login form above the fold on mobile) */}
          <div className="lg:hidden space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
              Claridad mental · Ejecución implacable
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-[1.15]">
              Tu centro de mando para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-300 to-violet-300">
                pensar mejor y crecer cada día.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/85 leading-relaxed">
              Unifica tus 5 Pilares personales, negocios, finanzas, notas anuales y asistentes IA en
              un solo espacio privado.
            </p>
          </div>

          {/* Left Narrative Column on Desktop (appears below login card on mobile) */}
          <section className="order-2 lg:order-1 lg:col-span-7 space-y-5">
            <div className="hidden lg:block space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                Claridad mental · Ejecución implacable
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.7rem] font-extrabold tracking-tight text-white leading-[1.12]">
                Tu centro de mando para{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-300 to-violet-300">
                  pensar mejor, decidir rápido y crecer cada día.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-200/85 leading-relaxed max-w-xl">
                Mi Segundo Cerebro 4.0 unifica tu vida personal y tus negocios en un solo ecosistema
                inteligente. Convierte tus rutinas, notas, finanzas, juntas y metas anuales en
                acciones concretas sin dispersión.
              </p>
            </div>

            {/* Apple Liquid Glass 2x2 feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VALUE_HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-2xl border border-white/[0.13] shadow-[0_12px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] hover:border-blue-400/35 hover:bg-white/[0.09] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.iconBg}`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-white leading-tight">
                          {item.title}
                        </h2>
                        <p className="text-xs text-slate-300/85 leading-snug mt-0.5">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column on Desktop / First Card on Mobile: Apple Liquid Glass Login Card */}
          <section className="order-1 lg:order-2 lg:col-span-5 w-full">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0d1424]/65 backdrop-blur-3xl border border-white/[0.16] shadow-[0_28px_80px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.2)] space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {isSetupMode ? 'Configura tu Acceso Inicial' : 'Iniciar Sesión'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300/85 leading-relaxed">
                  {isSetupMode
                    ? 'Define el usuario y contraseña con los que ingresarás a tu Segundo Cerebro.'
                    : 'Ingresa tus credenciales para acceder a tu espacio privado y asistentes IA.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-semibold text-slate-200"
                  >
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ej: Rommel o tu usuario"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.15] text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-200"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSetupMode ? 'new-password' : 'current-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSetupMode ? 'Mínimo 6 caracteres' : 'Ingresa tu contraseña'}
                      className="w-full h-12 pl-10 pr-12 rounded-xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.15] text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/35 text-xs font-semibold text-rose-200"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 border border-white/15 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <span>
                    {isSubmitting
                      ? 'Validando acceso...'
                      : isSetupMode
                      ? 'Crear Acceso y Entrar'
                      : 'Entrar a Mi Segundo Cerebro'}
                  </span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                </button>
              </form>

              <p className="text-[11px] text-slate-300/75 leading-relaxed pt-2 border-t border-white/[0.1]">
                {isSetupMode
                  ? 'Solo tú tendrás acceso con estas credenciales. En producción también puedes fijarlas mediante variables de entorno del servidor.'
                  : 'Tu sesión se valida de forma segura en el servidor para proteger tus datos y herramientas de inteligencia artificial.'}
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-4 text-center sm:text-left text-[11px] text-slate-300/70">
        Mi Segundo Cerebro 4.0 · Enfoque, claridad y crecimiento integral
      </footer>
    </div>
  );
};
