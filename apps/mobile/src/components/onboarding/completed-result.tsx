import {Pressable, Text, View} from 'react-native';

import Animated, {FadeInDown, FadeInUp} from 'react-native-reanimated';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {components} from '../../lib/api-schema';
import {LEVEL_CONTENT} from '../../lib/level';
import {LevelIcon} from '../level-icon';
import {NativeWindFeather} from '../nativewind-feather';

type Profile = components['schemas']['ProfilePublic'];

type CompletedResultProps = {
  onStartTraining: () => void;
  profile: Profile;
};

export function CompletedResult({onStartTraining, profile}: CompletedResultProps) {
  const result = LEVEL_CONTENT[profile.level];

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 justify-center px-6">
        <Animated.View
          className="items-center"
          entering={FadeInUp.duration(420).springify().damping(18)}
          style={{alignItems: 'center'}}>
          <LevelIcon contained level={profile.level} size={96} />
          <Text
            className="mt-5 text-center text-foreground-light dark:text-foreground-dark"
            style={{fontSize: 40, fontWeight: '900', lineHeight: 48}}>
            {result.label}
          </Text>
          <Text className="mt-3 max-w-sm text-center text-base font-normal leading-6 text-muted-light dark:text-muted-dark">
            {result.resultDescription}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(360)}>
          <Pressable
            accessibilityRole="button"
            className="mt-10 flex-row items-center justify-center gap-1.5 self-center py-2"
            onPress={onStartTraining}>
            <Text className="text-center font-mono text-xs uppercase tracking-widest text-foreground-light dark:text-foreground-dark">
              Start training
            </Text>
            <NativeWindFeather
              className="text-foreground-light dark:text-foreground-dark"
              name="arrow-right"
              size={14}
            />
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
