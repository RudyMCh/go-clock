import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreset } from '../types';

const STORAGE_KEY = '@go_clock_user_presets';

export async function loadUserPresets(): Promise<UserPreset[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UserPreset[];
  } catch {
    return [];
  }
}

export async function saveUserPresets(presets: UserPreset[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export async function addUserPreset(presets: UserPreset[], preset: UserPreset): Promise<UserPreset[]> {
  const next = [...presets, preset];
  await saveUserPresets(next);
  return next;
}

export async function removeUserPreset(presets: UserPreset[], index: number): Promise<UserPreset[]> {
  const next = presets.filter((_, i) => i !== index);
  await saveUserPresets(next);
  return next;
}
