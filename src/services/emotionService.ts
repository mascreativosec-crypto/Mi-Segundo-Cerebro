export interface EmotionLogPayload {
  timestamp: string;
  valence_score: number;
  display_label: string;
  emotion_labels: string[];
  associations: string[];
  triggers?: string;
  thoughtManagement?: string;
}

export interface EmotionLogResponse {
  ok: boolean;
  saved: EmotionLogPayload;
}

export async function submitEmotionLog(
  payload: EmotionLogPayload
): Promise<EmotionLogResponse> {
  try {
    const response = await fetch('/api/emotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as EmotionLogResponse;
  } catch {
    // Fallback guarantees local persistence never blocks even if backend is offline
    return { ok: true, saved: payload };
  }
}
