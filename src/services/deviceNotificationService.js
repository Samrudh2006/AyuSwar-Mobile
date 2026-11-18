import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const ANDROID_CHANNEL_ID = 'ayuswar_demo_alerts';

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const getNotificationSupport = () => ({
  native: isNative(),
  browser: typeof window !== 'undefined' && 'Notification' in window
});

export const checkNotificationPermission = async () => {
  const support = getNotificationSupport();
  if (support.native) {
    try {
      const result = await LocalNotifications.checkPermissions();
      return { status: result.display || 'prompt', native: true, supported: true };
    } catch (error) {
      return { status: 'unavailable', native: true, supported: false, error: error?.message || 'native permission check failed' };
    }
  }
  if (!support.browser) return { status: 'unsupported', native: false, supported: false };
  return { status: Notification.permission, native: false, supported: true };
};

export const requestNotificationPermission = async () => {
  const support = getNotificationSupport();
  if (support.native) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return { status: result.display || 'prompt', native: true, supported: true };
    } catch (error) {
      return { status: 'unavailable', native: true, supported: false, error: error?.message || 'native permission request failed' };
    }
  }
  if (!support.browser) return { status: 'unsupported', native: false, supported: false };
  try {
    const status = await Notification.requestPermission();
    return { status, native: false, supported: true };
  } catch (error) {
    return { status: 'unavailable', native: false, supported: false, error: error?.message || 'browser permission request failed' };
  }
};

const ensureAndroidChannel = async () => {
  try {
    await LocalNotifications.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'AyuSwar demo alerts',
      description: 'Synthetic local demo reminders and draft-ready alerts',
      importance: 4,
      vibration: true,
      lights: true,
      lightColor: '#0F4C5C'
    });
  } catch {
    // Channel creation can fail on platforms that do not support channels; scheduling still reports its own result.
  }
};

export const sendLocalDemoNotification = async ({ title, body }) => {
  const support = getNotificationSupport();
  const permission = await checkNotificationPermission();
  if (!permission.supported) return { delivered: false, ...permission };
  if (!['granted', 'limited'].includes(permission.status)) {
    return { delivered: false, ...permission, reason: 'permission_not_granted' };
  }

  if (support.native) {
    try {
      await ensureAndroidChannel();
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now() % 2147483647,
          title,
          body,
          schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
          channelId: ANDROID_CHANNEL_ID,
          iconColor: '#0F4C5C',
          sound: 'default',
          extra: { syntheticDemo: true }
        }]
      });
      return { delivered: true, native: true, status: permission.status, mode: 'local-scheduled' };
    } catch (error) {
      return { delivered: false, native: true, status: permission.status, error: error?.message || 'native local notification failed' };
    }
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/assets/ayuswar_master_emblem.png',
      badge: '/favicon.svg',
      tag: `ayuswar-demo-${Date.now()}`
    });
    return { delivered: true, native: false, status: Notification.permission, mode: 'browser', notification };
  } catch (error) {
    return { delivered: false, native: false, status: permission.status, error: error?.message || 'browser notification failed' };
  }
};
