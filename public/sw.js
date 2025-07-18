// public/sw.js
self.addEventListener("push", (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/favicon.ico",
    badge: "/badge-icon.png",
    requireInteraction: true,
    actions: [
      { action: "view", title: "View Reminders" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
