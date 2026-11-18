package ai.ayuswar.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AyuSwarShare")
public class AyuSwarSharePlugin extends Plugin {
    @PluginMethod
    public void whatsapp(PluginCall call) {
        String text = call.getString("text", "");
        if (text.trim().isEmpty() || text.length() > 20000) {
            call.reject("Summary is empty or too long to share.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                String target = null;
                for (String candidate : new String[]{"com.whatsapp", "com.whatsapp.w4b"}) {
                    try { getContext().getPackageManager().getPackageInfo(candidate, 0); target = candidate; break; }
                    catch (PackageManager.NameNotFoundException ignored) {}
                }
                if (target == null) { call.reject("WhatsApp is not installed. Use the general share option or copy the summary."); return; }
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_TEXT, text);
                send.setPackage(target);
                getActivity().startActivity(send);
                JSObject result = new JSObject();
                result.put("launched", true);
                result.put("sent", false);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("WhatsApp could not be opened. No message was sent by AyuSwar.");
            }
        });
    }
}
