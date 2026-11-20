package ai.ayuswar.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

/**
 * RecordingForegroundService — keeps consultation recording alive when the
 * app is backgrounded (rural-PHC must-have: background recording during long
 * OPD conversations).
 *
 * Honest scope: this service holds NO audio pipeline of its own. The actual
 * capture stays in the WebView (memory-only, consent-gated); this
 * microphone-type foreground service keeps the process and the mic grant
 * alive while the app is in the background, with the OS-required persistent
 * notification visible the whole time. Recording still stops on consent
 * withdraw, on leaving the recorder, or at the 3-minute cap - backgrounding
 * extends capture, it does not bypass any consent or lifecycle rule.
 */
public class RecordingForegroundService extends Service {
    static final String CHANNEL_ID = "ayuswar_recording";
    static final int NOTIFICATION_ID = 4101;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Consultation recording",
                NotificationManager.IMPORTANCE_LOW // no sound; the ongoing notification is the disclosure
            );
            channel.setDescription("Shown while AyuSwar is recording a practice consultation, including in the background.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AyuSwar is recording")
            .setContentText("Microphone is active for the consultation recorder. Return to AyuSwar to stop.")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
