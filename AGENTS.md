# AGENTS.md - Antigravity & AI Assistant Project Instructions

This file sets persistent behavioral rules and project-specific knowledge for all AI coding agents working in this workspace.

---

## Workspace Context
- **Project Name**: Cinema App (React Native)
- **Target Platforms**: **Android Mobile & Android TV / Google TV** (Universal dual-target APK)
- **Framework**: React Native 0.87.1 (React 19, New Architecture compatible, TypeScript)
- **API Provider**: The Movie Database (TMDB) v3 API via `.env`
- **Design Philosophy**: Minimalist, dense table catalog (inspired by Letterboxd / Trakt / clean cinema databases). **Zero "AI slop"** (no fake buttons, no generic cartoonish components, no bloated hero cards that take up the whole screen).

---

## Mandatory Rules for AI Agents

1. **Dual Compatibility Mandate (Android Mobile + Android TV)**:
   - **Every feature must work flawlessly on both Mobile touchscreens and Android TV D-Pad remotes.**
   - **Hardware D-Pad Focus**: All clickable components (buttons, cards, rails, tabs, chips, modal controls) **must** use `TVFocusable` ([src/components/common/TVFocusable.tsx](file:///d:/F/Cinema%20App/cinema-react-native/src/components/common/TVFocusable.tsx)) or implement `focusable={true}` with explicit focus styles (`focusedStyle`, border ring, scale `1.05x`).
   - **Hardware Back Button**: All modals, overlay screens, and sub-tabs must integrate with `BackHandler` in `App.tsx` so the TV remote `Back` key closes modals or returns to `Home` before exiting the app.
   - **Responsive Screen Adaptation**: Always use `useDeviceMode()` ([src/hooks/useDeviceMode.ts](file:///d:/F/Cinema%20App/cinema-react-native/src/hooks/useDeviceMode.ts)) to adapt layout between mobile portrait (3 grid columns, 2:3 vertical billboard) and TV landscape (5–6 grid columns, 16:9 cinematic widescreen billboard).
   - **Leanback Manifest Integrity**: Never remove `<uses-feature android:name="android.software.leanback" android:required="false" />` or `<uses-feature android:name="android.hardware.touchscreen" android:required="false" />` from [AndroidManifest.xml](file:///d:/F/Cinema%20App/cinema-react-native/android/app/src/main/AndroidManifest.xml).

2. **Check Environment First**:
   - Never hardcode API keys or base URLs. Always import from [src/config/env.ts](file:///d:/F/Cinema%20App/cinema-react-native/src/config/env.ts).
   - Variables are defined in [cinema-react-native/.env](file:///d:/F/Cinema%20App/cinema-react-native/.env).

3. **Strict UI Restraint (Anti-Slop Directive)**:
   - High information density: Users should be able to scan 6-8 movie items on screen at a glance.
   - Clean, tabular data: Cover thumbnail, Monospace row index, Title, Original Foreign Title, Year, Language, TMDB Star Rating (`★ X.X`), and Vote Count.
   - Strict segregation between **Movies**, **TV Shows**, and **Anime** (Japanese animation).
   - Zero emojis in navigation and UI controls. Use pure React Native vector icons from [Icons.tsx](file:///d:/F/Cinema%20App/cinema-react-native/src/components/common/Icons.tsx).

4. **Android & ADB Execution Guidelines**:
   - `adb` is located at `C:\Users\karan\AppData\Local\Android\Sdk\platform-tools\adb.exe`.
   - If running adb commands in a terminal session where `adb` is not in global PATH, use `& "C:\Users\karan\AppData\Local\Android\Sdk\platform-tools\adb.exe" ...`.
   - Never stop or restart the Metro dev server unnecessarily if it is already listening on port `8081`.
   - Use `adb reverse tcp:8081 tcp:8081` to keep the physical device attached to the PC's Metro bundler.

5. **Code Quality & Verification**:
   - Run `npx tsc --noEmit` to verify zero TypeScript compiler diagnostics.
   - Run `npm run lint` (`eslint .`) to ensure zero errors and zero warnings.
   - Use pure React Native primitives and styles (`StyleSheet.create`). Never introduce inline styles for static properties.
   - Do not install heavyweight external native UI libraries without explicit requirement, as native linkage requires APK recompilation.
