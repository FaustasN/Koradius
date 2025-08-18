// Simplified notification utilities for admin dashboard (no sound)

// Simple notification utilities for payment pages
export const notificationUtils = {
  showSuccess: (message: string) => {
    console.log('✅ Success:', message);
    // You can add toast notification here later
  },
  showError: (message: string) => {
    console.error('❌ Error:', message);
    // You can add toast notification here later
  }
};

export class NotificationManager {
  private static instance: NotificationManager;
  private readonly originalTitle: string;
  private titleInterval: number | null = null;
  private isFlashing: boolean = false;

  private constructor() {
    this.originalTitle = document.title;
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Request notification permissions
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Show browser notification
  public showBrowserNotification(title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium'): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/Icon/Logo_Koradius_EN-max-300x228.png',
        badge: '/Icon/Logo_Koradius_EN-max-300x228.png',
        requireInteraction: priority === 'high',
        silent: false,
        tag: 'koradius-admin'
      });

      // Auto-close notification after 5 seconds (except for high priority)
      if (priority !== 'high') {
        setTimeout(() => notification.close(), 5000);
      }

      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  // Start flashing the browser tab title
  public startTitleFlashing(unreadCount: number): void {
    if (this.isFlashing) return;

    this.isFlashing = true;
    let showAlert = true;

    this.titleInterval = window.setInterval(() => {
      if (showAlert) {
        document.title = `(${unreadCount}) 🔔 Koradius Admin`;
      } else {
        document.title = `(${unreadCount}) Koradius Admin`;
      }
      showAlert = !showAlert;
    }, 1000);
  }

  // Stop flashing the browser tab title
  public stopTitleFlashing(): void {
    if (this.titleInterval) {
      clearInterval(this.titleInterval);
      this.titleInterval = null;
    }
    this.isFlashing = false;
    document.title = this.originalTitle;
  }

  // Update title with unread count (without flashing)
  public updateTitleWithCount(unreadCount: number): void {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Koradius Admin`;
    } else {
      document.title = this.originalTitle;
    }
  }

  // Clean up resources
  public dispose(): void {
    this.stopTitleFlashing();
  }
}

// Hook for managing notifications in React components
export const useNotificationManager = () => {
  const manager = NotificationManager.getInstance();

  return {
    requestPermission: manager.requestNotificationPermission.bind(manager),
    showBrowserNotification: manager.showBrowserNotification.bind(manager),
    startTitleFlashing: manager.startTitleFlashing.bind(manager),
    stopTitleFlashing: manager.stopTitleFlashing.bind(manager),
    updateTitleWithCount: manager.updateTitleWithCount.bind(manager),
    dispose: manager.dispose.bind(manager)
  };
};
