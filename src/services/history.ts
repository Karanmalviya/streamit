import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaItem } from './tmdb';

const HISTORY_KEY = '@cinema_watch_history';

export interface WatchHistoryItem {
  media: MediaItem;
  lastWatchedAt: number; // timestamp
  progress: number; // in seconds
  duration: number; // in seconds
  season?: number;
  episode?: number;
}

export async function getWatchHistory(): Promise<WatchHistoryItem[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load watch history', e);
    return [];
  }
}

export async function addToWatchHistory(item: WatchHistoryItem): Promise<void> {
  try {
    const history = await getWatchHistory();
    // Remove if already exists to place it at the top
    const filteredHistory = history.filter((h) => h.media.id !== item.media.id);
    filteredHistory.unshift(item); // Add to the beginning
    
    // Limit history to 100 items to prevent huge storage
    if (filteredHistory.length > 100) {
      filteredHistory.length = 100;
    }
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (e) {
    console.error('Failed to save watch history', e);
  }
}

export async function removeFromWatchHistory(mediaId: number): Promise<void> {
  try {
    const history = await getWatchHistory();
    const filteredHistory = history.filter((h) => h.media.id !== mediaId);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (e) {
    console.error('Failed to remove from watch history', e);
  }
}

export async function clearWatchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear watch history', e);
  }
}
