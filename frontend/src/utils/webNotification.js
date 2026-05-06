export const canUseWebNotifications = () =>
  typeof window !== 'undefined' &&
  typeof Notification !== 'undefined' &&
  window.isSecureContext;

export const requestWebNotificationPermission = async () => {
  if (!canUseWebNotifications()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;

  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

export const showWebNotification = (notification = {}, options = {}) => {
  if (!canUseWebNotifications() || Notification.permission !== 'granted') {
    return false;
  }

  const title = String(notification?.title || 'JJSTrack notification').trim();
  const body = String(notification?.message || '').trim();
  const tag = `${options.tagPrefix || 'jjstrack'}-${notification?._id || Date.now()}`;

  try {
    const webNotification = new Notification(title, {
      body,
      tag,
      renotify: false,
    });

    webNotification.onclick = () => {
      window.focus();
      if (typeof options.onClick === 'function') {
        options.onClick(notification);
      }
      webNotification.close();
    };

    return true;
  } catch {
    return false;
  }
};
