import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_ID_KEY = 'calis.profileId';

export async function getStoredProfileId() {
  return AsyncStorage.getItem(PROFILE_ID_KEY);
}

export async function storeProfileId(profileId: string) {
  await AsyncStorage.setItem(PROFILE_ID_KEY, profileId);
}

export async function clearStoredProfileId() {
  await AsyncStorage.removeItem(PROFILE_ID_KEY);
}
