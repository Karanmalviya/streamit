import { Linking } from 'react-native';

export const CURRENT_APP_VERSION = {
  versionCode: 3,
  versionName: '1.1.1',
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
 * Endpoints for checking updates:
 * 1. Primary: raw.githubusercontent.com version.json (Fast, no GitHub API rate limit)
 * 2. Fallback: GitHub Releases API (latest release tag and apk asset)
 */
export const PRIMARY_UPDATE_URL =
  'https://raw.githubusercontent.com/Karanmalviya/streamit/main/version.json';
export const FALLBACK_UPDATE_URL =
  'https://api.github.com/repos/Karanmalviya/streamit/releases/latest';

/**
 * Helper to compare semantic versions (e.g., "1.1.2" > "1.1.1")
 */
export function isNewerVersion(remoteVer: string, currentVer: string): boolean {
  const clean = (v: string) =>
    v.replace(/^v/i, '').trim().split('.').map(n => parseInt(n, 10) || 0);
  const r = clean(remoteVer);
  const c = clean(currentVer);
  const maxLen = Math.max(r.length, c.length);

  for (let i = 0; i < maxLen; i++) {
    const rNum = r[i] || 0;
    const cNum = c[i] || 0;
    if (rNum > cNum) return true;
    if (rNum < cNum) return false;
  }
  return false;
}

/**
 * Checks for updates from the remote endpoint.
 * Returns UpdateInfo if a newer version is available, or null if up-to-date.
 */
export async function checkForAppUpdate(): Promise<UpdateInfo | null> {
  console.log(`[Updater] Checking for updates... Current version: v${CURRENT_APP_VERSION.versionName} (${CURRENT_APP_VERSION.versionCode})`);

  // 1. Try Primary Endpoint (version.json on raw GitHub)
  try {
    const primaryInfo = await checkVersionJson(PRIMARY_UPDATE_URL);
    if (primaryInfo) {
      console.log(`[Updater] Update found via version.json: v${primaryInfo.versionName}`);
      return primaryInfo;
    }
  } catch (err) {
    console.warn('[Updater] Primary version.json check failed:', err);
  }

  // 2. Try Fallback Endpoint (GitHub Releases API)
  try {
    const fallbackInfo = await checkGitHubReleases(FALLBACK_UPDATE_URL);
    if (fallbackInfo) {
      console.log(`[Updater] Update found via GitHub Releases: v${fallbackInfo.versionName}`);
      return fallbackInfo;
    }
  } catch (err) {
    console.warn('[Updater] Fallback GitHub Releases check failed:', err);
  }

  console.log('[Updater] App is up to date.');
  return null;
}

async function checkVersionJson(url: string): Promise<UpdateInfo | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'User-Agent': 'Streamit-App',
    },
  });
  clearTimeout(timeoutId);

  if (!res.ok) return null;
  const data = await res.json();

  if (data && (typeof data.versionName === 'string' || typeof data.versionCode === 'number')) {
    const remoteVersionName = String(data.versionName || `v${data.versionCode}`).replace(/^v/i, '');
    const remoteVersionCode = Number(data.versionCode) || 0;

    const hasNewerName = isNewerVersion(remoteVersionName, CURRENT_APP_VERSION.versionName);
    const hasNewerCode = remoteVersionCode > CURRENT_APP_VERSION.versionCode;

    if (hasNewerName || hasNewerCode) {
      return {
        versionCode: remoteVersionCode,
        versionName: remoteVersionName,
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
}

async function checkGitHubReleases(url: string): Promise<UpdateInfo | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'User-Agent': 'Streamit-App',
    },
  });
  clearTimeout(timeoutId);

  if (!res.ok) return null;
  const data = await res.json();

  if (data && data.tag_name) {
    const remoteVersionName = String(data.tag_name).replace(/^v/i, '');
    const apkAsset = Array.isArray(data.assets)
      ? data.assets.find((a: any) => typeof a?.name === 'string' && a.name.endsWith('.apk'))
      : null;
    const downloadUrl = apkAsset?.browser_download_url || data.html_url || '';

    const hasNewerName = isNewerVersion(remoteVersionName, CURRENT_APP_VERSION.versionName);

    if (hasNewerName) {
      return {
        versionCode: parseVersionToCode(remoteVersionName),
        versionName: remoteVersionName,
        apkUrl: downloadUrl,
        changelog: parseChangelog(data.body),
        releaseDate: data.published_at
          ? new Date(data.published_at).toLocaleDateString()
          : undefined,
        isMandatory: false,
      };
    }
  }
  return null;
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

