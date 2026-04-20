import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import toast from 'react-hot-toast';

export const initPushNotifications = async () => {
    // We only register push notifications on Native platforms
    if (!Capacitor.isNativePlatform()) {
        console.warn('Push notifications are not natively supported on the web.');
        return;
    }

    try {
        // Request permission to use push notifications
        // iOS will prompt user and return if they granted permission or not
        // Android will just grant without prompting
        const result = await PushNotifications.requestPermissions();

        if (result.receive === 'granted') {
            // Register with Apple / Google to receive push via APNS/FCM
            PushNotifications.register();
        } else {
            // Show some error or info user to enable it from settings
            console.warn('Push notification permission denied');
        }

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration',
            (token) => {
                console.log('Push registration success, token: ' + token.value);
                // TODO: Send this token to backend to register for targeted notifications
            }
        );

        // Some issue with our setup and push will not work
        PushNotifications.addListener('registrationError',
            (error) => {
                console.error('Error on registration: ' + JSON.stringify(error));
            }
        );

        // Show us the notification payload if the app is open on our device
        PushNotifications.addListener('pushNotificationReceived',
            (notification) => {
                console.log('Push received: ' + JSON.stringify(notification));
                toast(`New Notification: ${notification.title}`);
            }
        );

        // Method called when tapping on a notification
        PushNotifications.addListener('pushNotificationActionPerformed',
            (notification) => {
                console.log('Push action performed: ' + JSON.stringify(notification));
                // TODO: Deep linking based on notification data
            }
        );
    } catch (error) {
        console.error('Failed to initialize push notifications', error);
    }
};
