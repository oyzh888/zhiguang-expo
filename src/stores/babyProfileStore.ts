import AsyncStorage from '@react-native-async-storage/async-storage';
import { BabyProfile } from '../types';

const KEY = 'zhiguang_baby_profiles';
const DRAFT_KEY = 'zhiguang_baby_draft';

export async function loadProfiles(): Promise<BabyProfile[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveProfile(profile: BabyProfile): Promise<void> {
  const profiles = await loadProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  await AsyncStorage.setItem(KEY, JSON.stringify(profiles));
}

export async function saveDraft(draft: Partial<BabyProfile>): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export async function loadDraft(): Promise<Partial<BabyProfile> | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

export function createProfile(nickname: string, birthday?: string, gender?: 'boy' | 'girl'): BabyProfile {
  return {
    id: Date.now().toString(),
    nickname: nickname.trim(),
    birthday,
    gender,
    createdAt: new Date().toISOString(),
  };
}
