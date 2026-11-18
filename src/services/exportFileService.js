/**
 * Cross-platform file export for AyuSwar drafts.
 *
 * Web/PWA: classic anchor download.
 * Native Android (Capacitor WebView): anchor downloads silently fail inside the
 * WebView, so the file is written to app cache with the Filesystem plugin and
 * handed to the user's system share sheet. The user picks the destination;
 * the app never sends anything by itself.
 */
import { Capacitor } from '@capacitor/core';

export async function exportTextFile({ filename, text, mime = 'application/json', shareTitle }) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const written = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      recursive: true
    });
    await Share.share({
      title: shareTitle || filename,
      text: shareTitle || filename,
      url: written.uri,
      dialogTitle: shareTitle || filename
    });
    return { mode: 'native-share-sheet', uri: written.uri };
  }

  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return { mode: 'browser-download' };
}
