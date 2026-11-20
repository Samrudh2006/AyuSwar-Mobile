package ai.ayuswar.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

/**
 * AyuSwarSpeechPlugin — on-device-first speech recognition (rural-PHC
 * must-have: on-device ASR fallback for low-connectivity clinics).
 *
 * Mirrors the call/event contract of @capacitor-community/speech-recognition
 * (requestPermissions / start / stop, "partialResults" and "listeningState"
 * events) so the web layer can swap engines without flow changes, with one
 * difference: this engine PREFERS ON-DEVICE recognition. On Android 13+
 * (API 31) it uses SpeechRecognizer.createOnDeviceSpeechRecognizer(); on
 * older versions it sets EXTRA_PREFER_OFFLINE on the default recognizer.
 *
 * Honest scope: on-device recognition only works when the device has the
 * language pack installed; this plugin reports onDevice=true only when an
 * on-device recognizer was actually created, and the web layer must surface
 * that verbatim. No offline-transcription guarantee is made for recorded
 * files: SpeechRecognizer is microphone-only, so the record-then-transcribe
 * path still needs connectivity (stated in the app copy).
 */
@CapacitorPlugin(
    name = "AyuSwarSpeech",
    permissions = { @Permission(alias = "speechRecognition", strings = { Manifest.permission.RECORD_AUDIO }) }
)
public class AyuSwarSpeechPlugin extends Plugin {
    private SpeechRecognizer recognizer = null;
    private boolean onDevice = false;

    private void createRecognizer() {
        destroyRecognizer();
        onDevice = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                if (SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext())) {
                    recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());
                    onDevice = true;
                }
            } catch (Exception ignored) {
                recognizer = null;
                onDevice = false;
            }
        }
        if (recognizer == null) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
        }
        recognizer.setRecognitionListener(listener);
    }

    private void destroyRecognizer() {
        if (recognizer != null) {
            try { recognizer.destroy(); } catch (Exception ignored) {}
            recognizer = null;
        }
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) {
            JSObject event = new JSObject();
            event.put("status", "started");
            notifyListeners("listeningState", event);
        }
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}
        @Override public void onError(int error) {
            // Expose the real reason instead of a silent stop so the UI can
            // tell the user what actually happened.
            JSObject event = new JSObject();
            event.put("status", "stopped");
            event.put("errorCode", error);
            event.put("errorMessage", errorReason(error));
            notifyListeners("listeningState", event);
        }

        private String errorReason(int error) {
            switch (error) {
                case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "Network timeout during recognition.";
                case SpeechRecognizer.ERROR_NETWORK: return "Network error during recognition.";
                case SpeechRecognizer.ERROR_AUDIO: return "Audio capture error.";
                case SpeechRecognizer.ERROR_SERVER: return "Speech service error.";
                case SpeechRecognizer.ERROR_CLIENT: return "Recognition client error.";
                case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "No speech heard before timeout.";
                case SpeechRecognizer.ERROR_NO_MATCH: return "No speech matched.";
                case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "Recognizer is busy.";
                case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "Microphone permission missing.";
                case SpeechRecognizer.ERROR_TOO_MANY_REQUESTS: return "Too many recognition requests.";
                case SpeechRecognizer.ERROR_SERVER_DISCONNECTED: return "Speech service disconnected.";
                case SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED: return "Language not supported by the recognizer.";
                case SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE: return "Language pack unavailable (offline model not installed).";
                case SpeechRecognizer.ERROR_CANNOT_CHECK_SUPPORT: return "Cannot check language support.";
                default: return "Recognition stopped (code " + error + ").";
            }
        }
        @Override public void onPartialResults(Bundle partialResults) {
            ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (matches != null && !matches.isEmpty()) {
                JSObject event = new JSObject();
                event.put("matches", matches);
                notifyListeners("partialResults", event);
            }
        }
        @Override public void onResults(Bundle results) {
            ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (matches != null && !matches.isEmpty()) {
                JSObject event = new JSObject();
                event.put("matches", matches);
                notifyListeners("partialResults", event);
            }
            JSObject state = new JSObject();
            state.put("status", "stopped");
            notifyListeners("listeningState", state);
        }
        @Override public void onEvent(int eventType, Bundle params) {}
    };

    @PluginMethod
    public void status(PluginCall call) {
        // Honest availability report; the web layer must not upgrade this.
        JSObject result = new JSObject();
        result.put("sdkInt", Build.VERSION.SDK_INT);
        boolean available = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
            && SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext());
        result.put("onDeviceAvailable", available);
        result.put("recognitionAvailable", SpeechRecognizer.isRecognitionAvailable(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (getPermissionState("speechRecognition") != PermissionState.GRANTED) {
            requestPermissionForAlias("speechRecognition", call, "beginAfterPermission");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void beginAfterPermission(PluginCall call) {
        if (getPermissionState("speechRecognition") == PermissionState.GRANTED) {
            begin(call);
        } else {
            call.reject("Microphone / speech recognition permission denied.");
        }
    }

    private void begin(PluginCall call) {
        String language = call.getString("language", "en-IN");
        boolean partialResults = call.getBoolean("partialResults", true);
        // Network recognition may only be used when the caller explicitly
        // allows it for this session (a user-level choice with privacy
        // disclosure). It is never an automatic fallback under offline UI.
        boolean allowNetwork = call.getBoolean("allowNetwork", false);
        getActivity().runOnUiThread(() -> {
            try {
                createRecognizer();
                if (!onDevice && !allowNetwork) {
                    destroyRecognizer();
                    call.reject("ON_DEVICE_UNAVAILABLE: no on-device speech model is installed for this language on this device, and network speech recognition was not allowed for this session. Enable it explicitly (audio is sent to the Android speech service) or install the offline speech pack in system settings.");
                    return;
                }
                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, partialResults);
                // A preference hint only - never presented as an offline
                // guarantee. The onDevice flag in the result is the truth.
                intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
                intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getActivity().getPackageName());
                recognizer.startListening(intent);
                JSObject result = new JSObject();
                result.put("started", true);
                result.put("onDevice", onDevice);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Speech recognition could not start: " + error.getMessage());
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (recognizer != null) {
                try { recognizer.stopListening(); } catch (Exception ignored) {}
            }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        destroyRecognizer();
    }
}
