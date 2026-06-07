import {ActivityIndicator, Text, View} from 'react-native';

import {useQuery} from '@tanstack/react-query';
import {useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {getStoredProfileId} from '../lib/profile-storage';
import {DashboardScreen} from '../screens/dashboard';

export default function OnboardedScreen() {
  const {level, profileId: profileIdParam} = useLocalSearchParams<{
    level?: string;
    onboarded?: string;
    profileId?: string;
  }>();
  const {data: storedProfileId, isLoading} = useQuery({
    queryKey: ['stored-profile-id'],
    queryFn: getStoredProfileId,
  });
  const profileId = profileIdParam ?? storedProfileId;

  if (profileId) {
    return <DashboardScreen profileId={profileId} />;
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
          <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 justify-center p-6">
        <Text className="text-sm font-semibold uppercase text-muted-light dark:text-muted-dark">
          Your profile is ready
        </Text>
        <Text className="mt-3 text-4xl font-bold text-foreground-light dark:text-foreground-dark">
          {level ?? 'Onboarded'}
        </Text>
        <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
          Go back home to finish loading your plan.
        </Text>
      </View>
    </SafeAreaView>
  );
}
