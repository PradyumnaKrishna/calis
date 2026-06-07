import {useEffect} from 'react';

import {ActivityIndicator, Text, View} from 'react-native';

import {useQuery} from '@tanstack/react-query';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';

import {OnboardingScreen} from '../screens/onboarding';
import {getStoredProfileId} from '../lib/profile-storage';

export default function HomeScreen() {
  const router = useRouter();
  const {data: profileId, isLoading} = useQuery({
    queryKey: ['stored-profile-id'],
    queryFn: getStoredProfileId,
  });

  useEffect(() => {
    if (profileId) {
      router.replace({
        pathname: '/onboarded' as never,
        params: {onboarded: 'true'},
      });
    }
  }, [profileId, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
          <Text className="mt-4 text-base font-semibold text-muted-light dark:text-muted-dark">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileId) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center p-6">
          <ActivityIndicator color="#63635E" />
        </View>
      </SafeAreaView>
    );
  }

  return <OnboardingScreen />;
}
