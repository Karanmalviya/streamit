# Coding Standards & Quality Constraints

1. **No External Native Dependencies Without Prior Confirmation**:
   - Adding native packages (e.g. `react-native-navigation`, native video players) requires running native Gradle syncs or rebuilding APKs.
   - Prefer React Native core primitives (`FlatList`, `Modal`, `ScrollView`, `TextInput`, `TouchableOpacity`, `Image`, `StatusBar`) unless explicitly requested.

2. **Strict TypeScript Standards**:
   - Every media data structure must adhere to `MediaItem` or an extension of it.
   - No implicit `any`. Always specify return types on service fetch functions.
   - Run `npx tsc --noEmit` before concluding changes.

3. **Data Fetching & Resilience**:
   - Always implement pull-to-refresh (`RefreshControl`).
   - Implement pagination (incremental `page + 1`) with duplicate filtering by item ID.
   - Gracefully handle titles with missing poster art by showing a fallback badge instead of crashing or breaking layout dimensions.

4. **Minimalist Design Contract**:
   - Strictly avoid "AI slop": no generic gradient buttons, no fake placeholder stats, no unfunctional mock widgets.
   - Keep layout margins, paddings, and typography balanced and functional.
