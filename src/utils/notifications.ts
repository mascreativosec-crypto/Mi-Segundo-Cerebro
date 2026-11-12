// Browser notification service for habit transitions and routine completion

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch {
      return false;
    }
  }

  public hasPermission(): boolean {
    return this.permission === 'granted';
  }

  public send(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (this.permission !== 'granted') return;

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        silent: true, // We use Web Audio for sound
        ...options,
      });
    } catch {
      // Ignore background restrictions
    }
  }
}

export const appNotifications = new NotificationService();
