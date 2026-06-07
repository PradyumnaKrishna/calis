import { Text, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardedScreen() {
  const { level } = useLocalSearchParams<{ level?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 justify-center p-6">
        <Text className="text-sm font-semibold uppercase text-muted-light dark:text-muted-dark">
          Your level
        </Text>
        <Text className="mt-3 text-4xl font-bold text-foreground-light dark:text-foreground-dark">
          {level}
        </Text>
      </View>
    </SafeAreaView>
  );
}
