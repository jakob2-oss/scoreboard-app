/**
 * Brücke zur iPhone-App (Capacitor): Teilen und Vibration nativ, im Browser wie bisher über die Web-Schnittstellen.
 */
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';

/** Läuft als installierte iPhone-App (nicht im Browser) */
export const isNative = () => Capacitor.isNativePlatform();

async function base64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Datei teilen (Bild, Sicherung); ohne Teilen-Menü im Browser: herunterladen. Abbrechen wirft. */
export async function shareFile(blob: Blob, name: string, title: string): Promise<void> {
  if (isNative()) {
    const { uri } = await Filesystem.writeFile({ path: name, data: await base64(blob), directory: Directory.Cache });
    await Share.share({ title, files: [uri] });
    return;
  }
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title }); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Text teilen; liefert false, wenn das Gerät kein Teilen-Menü hat */
export async function shareText(text: string, title: string): Promise<boolean> {
  if (isNative()) { await Share.share({ title, text }); return true; }
  if (!navigator.share) return false;
  await navigator.share({ title, text }); return true;
}

/** Vibration in der App; false: nicht nativ, der Aufrufer nutzt den Browser-Weg */
export function nativeHaptic(kind: 'tap' | 'success'): boolean {
  if (!isNative()) return false;
  (kind === 'success' ? Haptics.notification({ type: NotificationType.Success }) : Haptics.impact({ style: ImpactStyle.Light })).catch(() => undefined);
  return true;
}

/** Statusleiste passend zum Design (hell: dunkle Schrift, dunkel: helle Schrift) */
export function nativeStatusBar(dark: boolean) {
  if (isNative()) StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => undefined);
}
