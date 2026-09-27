---
name: cinema-app
description: Standard workflows, architecture conventions, ADB operations, and design guidelines for developing the Cinema App React Native project.
---

# Cinema App Development Skill

This skill guides AI agents and developers through working with the Cinema App codebase.

## 1. Project Topology

- **App Entry**: `App.tsx`
- **Config & Environment**: `src/config/env.ts` (fed by `.env` via `babel.config.js`)
- **API Client & Types**: `src/services/tmdb.ts`
- **Android Native Project**: `android/`
- **Port**: 8081 (default Metro bundler port)

## 2. Standard ADB Operations

When interacting with the connected physical device on Windows:

```powershell
# Exact path to ADB binary:
$adb = "C:\Users\karan\AppData\Local\Android\Sdk\platform-tools\adb.exe"

# 1. Reverse Metro port (essential for physical device to reach Metro server)
& $adb reverse tcp:8081 tcp:8081

# 2. Check attached devices
& $adb devices

# 3. Bring app to foreground
& $adb shell am start -n com.cinema_app/com.cinema_app.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
```

## 3. Aesthetic & UI Philosophy ("Anti-Slop")

1. **Information-Dense Minimalism**:
   - Aim for a high-density, cleanly structured tabular view inspired by Letterboxd and database indexes.
   - Do not fill the screen with giant cards or flashy hero banners that force the user to scroll through pages to see 2 items.
   - Clean column alignments: `#` | `COVER` | `TITLE & GENRE` | `YEAR` | `SCORE`.

2. **Categorical Segregation**:
   - Always maintain distinct categories: **Movies**, **TV Shows**, and **Anime**.
   - For Anime, use TMDB query: `with_genres=16` and `with_original_language=ja`.

3. **Color Palette Tokens**:
   - Dark Background: `#090A0D`
   - Row Surface: `#0E1017` / `#13151D`
   - Text Primary: `#EDEDF2`
   - Text Secondary/Muted: `#656C82`
   - Rating Star / Gold: `#F4C042`
   - Active Tab / Indicator: `#202434` / `#00E599`

## 4. Verification Checklist

Before completing any code modifications:
- [ ] Run `npx tsc --noEmit` in `cinema-react-native` to ensure 0 TypeScript compilation errors.
- [ ] Verify environment variables are consumed through `src/config/env.ts`.
- [ ] Ensure non-blocking async network calls with loading and empty state handling.
