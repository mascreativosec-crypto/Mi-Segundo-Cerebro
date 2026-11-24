let inMemoryAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryAuthToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryAuthToken;
}

export function clearAuthToken() {
  inMemoryAuthToken = null;
}

export async function fetchJsonWithTimeout<T = Record<string, any>>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 70000
): Promise<{ ok: boolean; status: number; data: T }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(options.headers || {});
  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  }
  if (inMemoryAuthToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryAuthToken}`);
  }

  try {
    const resp = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
      signal: controller.signal,
    });
    const text = await resp.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {
        error: resp.ok
          ? 'Respuesta inesperada del servidor.'
          : `El servidor devolvió un error HTTP ${resp.status} (respuesta no JSON). Verifica que el backend Node.js esté activo.`,
      };
    }
    return { ok: resp.ok, status: resp.status, data: data as T };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(
        `El asistente IA superó el tiempo máximo de espera (${Math.round(timeoutMs / 1000)}s). El proveedor puede estar saturado; intenta nuevamente.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
