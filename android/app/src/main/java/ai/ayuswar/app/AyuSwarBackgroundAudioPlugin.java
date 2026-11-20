package ai.ayuswar.app;

import android.content.Intent;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * AyuSwarBackgroundAudioPlugin — start/stop the microphone-type foreground
 * service used during backgrounded consultation recording. The service holds
 * no audio data; capture stays in the WebView under the existing
 * recording-consent rules. Every start is paired with the OS-mandated
 * persistent notification (visible disclosure). Whether capture actually
 * continues on a given device is unproven without physical-device testing.
 */
@CapacitorPlugin(name = "AyuSwarBackgroundAudio")
public class AyuSwarBackgroundAudioPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(getContext(), RecordingForegroundService.class);
                ContextCompat.startForegroundService(getContext(), intent);
                JSObject result = new JSObject();
                result.put("started", true);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Background recording could not start (foreground service rejected): " + error.getMessage());
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(getContext(), RecordingForegroundService.class);
                getContext().stopService(intent);
            } catch (Exception ignored) {}
            call.resolve();
        });
    }
}
