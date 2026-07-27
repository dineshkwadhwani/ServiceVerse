import { PushNotifications } from '@capacitor/push-notifications';

export async function registerNativePush(): Promise<string | null> {
  const permission = await PushNotifications.checkPermissions();
  let receive = permission.receive;

  if (receive === 'prompt' || receive === 'prompt-with-rationale') {
    receive = (await PushNotifications.requestPermissions()).receive;
  }

  if (receive !== 'granted') return null;

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value);
    });
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Native push registration failed:', error);
      resolve(null);
    });
    PushNotifications.register();
  });
}
