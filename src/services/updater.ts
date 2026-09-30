import { Linking } from 'react-native';

export const CURRENT_APP_VERSION = {
  versionCode: 1,
  versionName: '1.0.0',
};

export interface UpdateInfo {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  changelog: string[];
  releaseDate?: string;
  isMandatory?: boolean;
}

/**
 * Configure your remote update endpoint URL.
 * Checks the GitHub Releases API directly for latest release tag and .apk asset.
 */
export const DEFAULT_UPDATE_URL = 'https://api.github.com/repos/karanmalviya/streamit/releases/latest';

/**
 * Checks for updates from the remote endpoint.
 * Returns UpdateInfo if a newer version is available, or null if up-to-date.
 */
export async function checkForAppUpdate(endpointUrl: string = DEFAULT_UPDATE_URL): Promise<UpdateInfo | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpointUrl, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    // Check if it's a GitHub Releases API response format
    if (data && data.tag_name && Array.isArray(data.assets)) {
      const tag = String(data.tag_name).replace(/^v/i, '');
      const apkAsset = data.assets.find((a: any) =>
        typeof a?.name === 'string' && a.name.endsWith('.apk')
      );
      const downloadUrl = apkAsset?.browser_download_url || data.html_url;

      // Extract build number or version
      const remoteVersionName = tag;
      const remoteVersionCode = parseVersionToCode(remoteVersionName);

      if (remoteVersionCode > CURRENT_APP_VERSION.versionCode) {
        return {
          versionCode: remoteVersionCode,
          versionName: remoteVersionName,
          apkUrl: downloadUrl,
          changelog: parseChangelog(data.body),
          releaseDate: data.published_at ? new Date(data.published_at).toLocaleDateString() : undefined,
          isMandatory: false,
        };
      }
      return null;
    }

    // Standard custom JSON format: { versionCode, versionName, apkUrl, changelog, isMandatory }
    if (data && typeof data.versionCode === 'number') {
      if (data.versionCode > CURRENT_APP_VERSION.versionCode) {
        return {
          versionCode: data.versionCode,
          versionName: data.versionName || `v${data.versionCode}`,
          apkUrl: data.apkUrl || '',
          changelog: Array.isArray(data.changelog)
            ? data.changelog
            : typeof data.changelog === 'string'
            ? parseChangelog(data.changelog)
            : ['General improvements and bug fixes'],
          releaseDate: data.releaseDate,
          isMandatory: !!data.isMandatory,
        };
      }
    }

    return null;
  } catch (error) {
    // Network failure or timeout - silently ignore on automatic checks
    return null;
  }
}

/**
 * Opens the APK download URL or browser to begin downloading/installing the update.
 */
export async function installAppUpdate(apkUrl: string): Promise<boolean> {
  if (!apkUrl) return false;
  try {
    const supported = await Linking.canOpenURL(apkUrl);
    if (supported) {
      await Linking.openURL(apkUrl);
      return true;
    }
  } catch (e) {
    console.warn('[Updater] Failed to open update URL:', e);
  }
  return false;
}

function parseVersionToCode(versionStr: string): number {
  const parts = versionStr.split('.').map(p => parseInt(p, 10) || 0);
  if (parts.length === 3) {
    return parts[0] * 10000 + parts[1] * 100 + parts[2];
  }
  return parseInt(versionStr, 10) || 0;
}

function parseChangelog(bodyText?: string): string[] {
  if (!bodyText) return ['Performance improvements and stability updates'];
  return bodyText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))
    .map(line => line.replace(/^[-*•]\s*/, ''))
    .slice(0, 6);
}
