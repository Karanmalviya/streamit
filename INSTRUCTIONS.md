# Cinema App - AI Engineering & Architecture Instructions

> **Notice to AI Assistants & Developers**:
> This document specifies the architectural conventions, design principles, API integrations, and code quality expectations for the Cinema App React Native codebase. All AI assistants must adhere strictly to these guidelines.

---

## 1. Dual Target Architecture: Android Mobile & Android TV / Google TV

The application is built as a single universal React Native APK targeting both **touchscreen mobile devices** and **Android TV / Google TV / Android TV Boxes** with D-pad remote controls.

### Android TV Guidelines for All Future Features:
1. **Remote D-Pad Navigation**:
   - Every interactive element (poster card, action button, filter pill, tab, modal close button) **must** be reachable and actionable via remote D-pad.
   - Use the centralized `TVFocusable` component ([src/components/common/TVFocusable.tsx](file:///d:/F/Cinema%20App/cinema-react-native/src/components/common/TVFocusable.tsx)) or ensure `focusable={true}` with explicit focus styles.
   - Provide a distinct visual focus ring / highlight (`borderColor: '#FFFFFF', borderWidth: 2`, elevation, scale `1.05x`) on focus so users sitting 10 feet away have crystal-clear spatial awareness of where their cursor is.

2. **Adaptive Layouts (Mobile Portrait vs TV Landscape)**:
   - Use `useDeviceMode()` ([src/hooks/useDeviceMode.ts](file:///d:/F/Cinema%20App/cinema-react-native/src/hooks/useDeviceMode.ts)) to detect TV / landscape widescreen mode vs mobile portrait mode.
   - **Poster Grids**: 3 columns on mobile portrait; dynamically expand to 5–6 columns on TV / wide screens so cards remain properly proportioned.
   - **Hero Billboard**: On mobile portrait, display full 2:3 vertical poster; on TV, display the 16:9 cinematic backdrop (`hero.backdrop || hero.poster`) taking ~65% screen height with a left-to-right fade overlay.
   - **Initial Focus**: Set `hasTVPreferredFocus={true}` on primary action targets (e.g. "Watch Now" on the billboard, or primary search input).

3. **Remote Hardware Back Key Handling**:
   - Any new modal, overlay, or sub-screen must register with `BackHandler` in `App.tsx` so pressing the remote `Back` button closes the modal or returns to the Home tab rather than abruptly killing the app.

4. **Native Android TV Manifest Integrity**:
   - [AndroidManifest.xml](file:///d:/F/Cinema%20App/cinema-react-native/android/app/src/main/AndroidManifest.xml) must always preserve:
     - `<uses-feature android:name="android.software.leanback" android:required="false" />`
     - `<uses-feature android:name="android.hardware.touchscreen" android:required="false" />`
     - `<category android:name="android.intent.category.LEANBACK_LAUNCHER" />`
     - `android:banner="@mipmap/ic_launcher"`

---

## 2. Core Principles: No "AI Slop" & Minimalist Aesthetics

- **Minimalist & Modern OTT UI (Netflix / Hotstar / Prime Video Inspired)**:
  - **Hero Billboard**: Cinematic billboard with multi-stage gradient fading cleanly into dark obsidian background (`#08090D`). High-contrast **▶ Watch Now** and **+ Watchlist** action buttons.
  - **Netflix-Style "Top 10" Rank Rail**: Stylized giant outlined numeric ranks (1, 2, 3... 10) positioned behind poster cards.
  - **Prime Video Widescreen 16:9 Landscape Rail**: Backdrop cards for blockbuster and critically acclaimed cinema.
  - **Pure Poster Grid for Catalogs**: Dedicated Movies, Series, and Anime tabs display clean poster artwork with subcategory filter pills (`Trending`, `Popular`, `Top Rated`, `In Theatres`).
  - **No Emojis**: Pixel-perfect vector line icons (Home, Movies, Series, Anime, Watchlist, Search, Play, Plus, Check) rendered via pure React Native primitives in [Icons.tsx](file:///d:/F/Cinema%20App/cinema-react-native/src/components/common/Icons.tsx).
  - **Hotstar / Prime Style Detail Sheet**: Interactive bottom sheet with 4K/Dolby audio tags, storyline, original titles, and trailer alert.
  - **Hardware-Accelerated Loading Skeletons**: High-density pulsing shimmer skeletons in [HomeSkeleton.tsx](file:///d:/F/Cinema%20App/cinema-react-native/src/components/skeletons/HomeSkeleton.tsx) and [GridSkeleton.tsx](file:///d:/F/Cinema%20App/cinema-react-native/src/components/skeletons/GridSkeleton.tsx) with `useNativeDriver: true`.

- **Data Integrity**:
  - Always use real data from the TMDB API.
  - Correctly handle missing fields (e.g. missing poster images, missing overview, missing release dates).
  - Strictly avoid fabricating fake JSON or hardcoded placeholder items when the API is live.

- **Performance & Native Polish**:
  - Use `FlatList` with `keyExtractor`, `numColumns`, and proper `onEndReachedThreshold` for infinite scrolling.
  - Optimize re-renders with `useCallback` and `useMemo`.
  - Never block the UI thread; always handle async network errors gracefully with retry states.

---

## 3. Separate Domains & Categorization

The application maintains strict segregation across three core content types:

1. **Movies** (`movie`):
   - Endpoints: `/movie/popular`, `/movie/top_rated`, `/movie/now_playing`, `/search/movie`.
   - Primary attributes: `title`, `release_date`, `runtime`.

2. **TV Shows** (`tv`):
   - Endpoints: `/tv/popular`, `/tv/top_rated`, `/tv/on_the_air`, `/search/tv`.
   - Primary attributes: `name`, `first_air_date`, episode counts.

3. **Anime** (`anime`):
   - Endpoints: `/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc`.
   - Special handling: Preserve and show original Japanese title (`original_name`) where applicable alongside English localized title.

---

## 4. Environment Variables & Security

- All API keys, base URLs, and image CDN URLs are stored in `.env`.
- Variables defined in `.env`:
  - `VITE_TMDB_API_KEY`: Authentication key for TMDB v3 API.
  - `VITE_TMDB_BASE_URL`: Base endpoint (`https://api.themoviedb.org/3`).
  - `VITE_TMDB_IMAGE_BASE_URL`: Image CDN endpoint (`https://image.tmdb.org/t/p`).
- In React Native, access environment variables through `src/config/env.ts`.
- `babel.config.js` is configured to inline `.env` variables into the bundle safely at build time.

---

## 5. Architecture: Componentization & Separation of Concerns

The codebase strictly adheres to modular architecture principles. **Never bloat `App.tsx` into a monolith.**

```text
src/
├── components/
│   ├── common/         # Icons.tsx (Vector SVGs), FadedOverlay.tsx, TVFocusable.tsx
│   ├── navigation/     # TopNavbar.tsx, BottomTabBar.tsx
│   ├── home/           # HomeBillboard.tsx, Top10Rail.tsx, PosterRail.tsx, LandscapeRail.tsx
│   ├── catalog/        # CategoryPills.tsx, PosterGrid.tsx
│   ├── modals/         # MediaDetailModal.tsx, WatchlistModal.tsx
│   └── skeletons/      # SkeletonBox.tsx, HomeSkeleton.tsx, GridSkeleton.tsx
├── hooks/
│   └── useDeviceMode.ts # Screen dimensions, isTV, isLandscape, gridColumns
├── screens/
│   ├── HomeScreen.tsx    # Assembles billboard & horizontal rails
│   ├── CatalogScreen.tsx # Assembles category filters & responsive poster grid
│   └── SearchScreen.tsx  # Assembles search bar, type chips & results
├── services/           # tmdb.ts (Pure API integrations & normalization)
└── config/             # env.ts (Environment variables)
```

- **Componentization**: Every reusable UI element resides in its own isolated file with dedicated TypeScript interfaces.
- **Separation of Concerns**: Screens handle layout assembly, services handle data fetching, and components handle presentation.
- **Component Composition**: `App.tsx` serves strictly as the root orchestrator (state management, navigation switching, modal triggers, hardware back handling).
- **Verification Rule**: Before completing any task, always run:
  1. `npx tsc --noEmit` (Must have 0 errors)
  2. `npm run lint` (Must have 0 errors and 0 warnings)
