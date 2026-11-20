package ai.ayuswar.app;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyInfo;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * AyuSwarKeystorePlugin — Android Keystore-backed AES-256-GCM for offline
 * data at rest (rural-PHC must-have: native key protection).
 *
 * The AES key is generated inside AndroidKeyStore and never leaves it; this
 * plugin only ever returns ciphertext. Whether the key is actually held in
 * secure hardware (TEE/StrongBox) is device-dependent, so hardwareBacked is
 * read at runtime from KeyInfo.isInsideSecureHardware() and reported
 * honestly as true/false — and as JSON null ("unknown") when the device key
 * does not exist yet or the check itself fails. No hardware guarantee is
 * claimed without that runtime proof.
 */
@CapacitorPlugin(name = "AyuSwarKeystore")
public class AyuSwarKeystorePlugin extends Plugin {
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String KEY_ALIAS = "ayuswar_offline_storage_v1";
    private static final int GCM_TAG_BITS = 128;
    private static final int GCM_IV_BYTES = 12;

    private SecretKey getKey() throws Exception {
        KeyStore ks = KeyStore.getInstance(ANDROID_KEYSTORE);
        ks.load(null);
        KeyStore.Entry entry = ks.getEntry(KEY_ALIAS, null);
        if (entry instanceof KeyStore.SecretKeyEntry) {
            return ((KeyStore.SecretKeyEntry) entry).getSecretKey();
        }
        return null;
    }

    private SecretKey createKey() throws Exception {
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build());
        return generator.generateKey();
    }

    // null = unknown (no key yet, or the runtime check failed). Never guess.
    private Boolean hardwareBacked(SecretKey key) {
        if (key == null) return null;
        try {
            KeyFactory factory = KeyFactory.getInstance(key.getAlgorithm(), ANDROID_KEYSTORE);
            KeyInfo info = factory.getKeySpec(key, KeyInfo.class);
            return info.isInsideSecureHardware();
        } catch (Exception error) {
            return null;
        }
    }

    @PluginMethod
    public void status(PluginCall call) {
        try {
            SecretKey key = getKey();
            JSObject result = new JSObject();
            result.put("available", true);
            result.put("hasKey", key != null);
            result.put("hardwareBacked", key == null ? null : hardwareBacked(key));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Android Keystore is unavailable on this device: " + error.getMessage());
        }
    }

    @PluginMethod
    public void ensureKey(PluginCall call) {
        try {
            SecretKey key = getKey();
            if (key == null) key = createKey();
            JSObject result = new JSObject();
            result.put("hasKey", true);
            result.put("hardwareBacked", hardwareBacked(key));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not create the device key: " + error.getMessage());
        }
    }

    @PluginMethod
    public void encrypt(PluginCall call) {
        String plain = call.getString("data");
        if (plain == null) { call.reject("Missing data to encrypt."); return; }
        try {
            SecretKey key = getKey();
            if (key == null) key = createKey();
            byte[] iv = new byte[GCM_IV_BYTES];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(Base64.decode(plain, Base64.NO_WRAP));
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            JSObject result = new JSObject();
            result.put("data", Base64.encodeToString(combined, Base64.NO_WRAP));
            result.put("hardwareBacked", hardwareBacked(key));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Encryption failed; nothing was stored: " + error.getMessage());
        }
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        String packed = call.getString("data");
        if (packed == null) { call.reject("Missing data to decrypt."); return; }
        try {
            SecretKey key = getKey();
            if (key == null) { call.reject("No device key exists; the data cannot be decrypted."); return; }
            byte[] combined = Base64.decode(packed, Base64.NO_WRAP);
            if (combined.length <= GCM_IV_BYTES) { call.reject("Stored payload is malformed."); return; }
            byte[] iv = new byte[GCM_IV_BYTES];
            byte[] ciphertext = new byte[combined.length - GCM_IV_BYTES];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_BYTES);
            System.arraycopy(combined, GCM_IV_BYTES, ciphertext, 0, ciphertext.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] plain = cipher.doFinal(ciphertext);
            JSObject result = new JSObject();
            result.put("data", Base64.encodeToString(plain, Base64.NO_WRAP));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Decryption failed; the stored record may be unreadable: " + error.getMessage());
        }
    }

    @PluginMethod
    public void deleteKey(PluginCall call) {
        try {
            KeyStore ks = KeyStore.getInstance(ANDROID_KEYSTORE);
            ks.load(null);
            ks.deleteEntry(KEY_ALIAS);
            JSObject result = new JSObject();
            result.put("deleted", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not delete the device key: " + error.getMessage());
        }
    }
}
