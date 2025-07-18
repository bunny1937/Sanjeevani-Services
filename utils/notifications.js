// utils/notifications.js - Add this new file
export class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
    this.init();
  }

  async init() {
    if (this.permission === "default") {
      this.permission = await Notification.requestPermission();
    }
  }

  async sendNotification(title, body, options = {}) {
    if (this.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "service-reminder",
        requireInteraction: true,
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      return notification;
    }
  }

  checkPermission() {
    return this.permission === "granted";
  }
}

// Notification service for reminders
export const notificationService = new NotificationManager();

// Function to check and send overdue notifications
export async function checkOverdueReminders() {
  try {
    const response = await fetch("/api/reminders");
    const data = await response.json();

    if (data.overdueReminders && data.overdueReminders.length > 0) {
      data.overdueReminders.forEach((reminder) => {
        notificationService.sendNotification(
          `🚨 OVERDUE: ${reminder.propertyName}`,
          `${reminder.serviceType} service was scheduled for ${new Date(
            reminder.scheduledDate
          ).toLocaleDateString("en-GB")}\nContact: ${reminder.keyPerson} (${
            reminder.contact
          })`,
          {
            tag: `overdue-${reminder._id}`,
            requireInteraction: true,
          }
        );
      });
    }

    // Check today's reminders
    if (data.reminders && data.reminders.length > 0) {
      data.reminders.forEach((reminder) => {
        notificationService.sendNotification(
          `📅 TODAY: ${reminder.propertyName}`,
          `${reminder.serviceType} service is scheduled for today\nContact: ${reminder.keyPerson} (${reminder.contact})`,
          {
            tag: `today-${reminder._id}`,
          }
        );
      });
    }
  } catch (error) {
    console.error("Error checking reminders:", error);
  }
}
