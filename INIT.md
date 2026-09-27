# Cinema App - Project Setup & Initialization Guide (INIT.md)

This document provides step-by-step instructions to initialize, build, run, and debug the Cinema App React Native project on Windows with Android mobile and Android TV devices.

---

## 1. Prerequisites

- **Node.js**: >= 22.11.0 (verified working with current LTS)
- **Java Development Kit (JDK)**: OpenJDK 17 or Eclipse Temurin 17
- **Android SDK**:
  - `platform-tools` (containing `adb.exe`)
  - Target SDK: 35 / Min SDK: 24
- **Physical Device, Android Emulator, or Android TV**:
  - **Mobile Phone**: USB Debugging enabled (Settings -> Developer Options -> USB Debugging)
  - **Android TV / Fire TV / Google TV**: Developer Options -> ADB Debugging over Network enabled

---

## 2. Environment Setup

The application reads configuration from `.env` in the project root:

```env
VITE_TMDB_API_KEY=61e2290429798c561450eb56b26de19b
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

### Adding ADB to Path (Windows PowerShell)

If `adb` is not recognized globally, add the Android SDK path to your PowerShell session or Windows System Environment Variables:

```powershell
# Add to current session:
$env:PATH += ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"

# Verify device is detected:
adb devices
```

---

## 3. Daily Development Workflow

### Step 1: Start Metro Bundler
Keep Metro running in a dedicated terminal window:
```powershell
cd "d:\F\Cinema App\cinema-react-native"
npx react-native start
```

### Step 2: Reverse Metro Port to Connected Device
Forward Metro port 8081 to your connected phone or TV box:
```powershell
adb reverse tcp:8081 tcp:8081
```

### Step 3: Run / Launch the Application

**First-time build / Native manifest change:**
```powershell
npx react-native run-android --no-packager
```

**Mobile Launch:**
```powershell
adb shell am start -n com.cinema_app/com.cinema_app.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
```

**Android TV Leanback Launch:**
```powershell
adb shell am start -n com.cinema_app/com.cinema_app.MainActivity -a android.intent.action.MAIN -c android.intent.category.LEANBACK_LAUNCHER
```

---

## 4. Testing Android TV Remote & D-Pad Navigation

You can test TV D-pad remote interactions on physical TV, emulator, or even on a connected phone using ADB keyevents:

| TV Remote Button | Keycode | ADB Simulation Command |
| :--- | :--- | :--- |
| **D-Pad Up** | 19 | `adb shell input keyevent 19` |
| **D-Pad Down** | 20 | `adb shell input keyevent 20` |
| **D-Pad Left** | 21 | `adb shell input keyevent 21` |
| **D-Pad Right** | 22 | `adb shell input keyevent 22` |
| **D-Pad Select / OK** | 23 | `adb shell input keyevent 23` |
| **Back Button** | 4 | `adb shell input keyevent 4` |
| **Menu Button** | 82 | `adb shell input keyevent 82` |

### Connecting to Android TV over WiFi / LAN:
```powershell
adb connect <TV_IP_ADDRESS>:5555
adb reverse tcp:8081 tcp:8081
```

---

## 5. Troubleshooting Reference

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `'adb' is not recognized` | `platform-tools` not in system PATH | Add `$env:LOCALAPPDATA\Android\Sdk\platform-tools` to PATH |
| `listen EADDRINUSE :::8081` | Metro is already running in background | Check running terminals before re-running `npx react-native start` |
| `No Android device connected` | USB debugging revoked or unplugged | Run `adb kill-server`, `adb start-server`, `adb devices` and accept prompt |
| Blank screen on device | Metro bundler disconnected | Run `adb reverse tcp:8081 tcp:8081` and reload |
| TV D-pad doesn't highlight card | Missing focusable style | Ensure card is wrapped with `TVFocusable` from `src/components/common/TVFocusable` |
| TV Remote Back exits app | Missing BackHandler registration | Ensure modal or view handles `hardwareBackPress` in `App.tsx` |
| TypeScript check errors | Type mismatch | Run `npx tsc --noEmit` to verify zero type diagnostics |
| ESLint check warnings | Styling or unused vars | Run `npm run lint` (`eslint .`) to verify clean code standards |
