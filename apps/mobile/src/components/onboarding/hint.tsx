import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '../bottom-sheet';
import { NativeWindFeather } from '../nativewind-feather';

type OnboardingHintProps = {
  defaultOpen?: boolean;
  eyebrow: string;
  hint: string;
};

export function OnboardingHint({ defaultOpen = false, eyebrow, hint }: OnboardingHintProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <>
      <Pressable
        accessibilityLabel="Open hint"
        accessibilityRole="button"
        className="min-h-16 flex-row items-center gap-4 py-2"
        onPress={() => setIsOpen(true)}
      >
        <Text className="flex-1 text-base font-semibold leading-6 text-muted-light dark:text-muted-dark" numberOfLines={2}>
          {hint}
        </Text>
        <View className="h-14 w-14 items-center justify-center rounded-full bg-background-light shadow-xl dark:bg-background-dark">
          <NativeWindFeather className="text-primary-light dark:text-primary-dark" name="chevron-up" size={24} />
        </View>
      </Pressable>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Text className="text-xs font-semibold uppercase text-muted-light dark:text-muted-dark">{eyebrow}</Text>
        <Text className="mt-4 text-2xl font-bold leading-8 text-foreground-light dark:text-foreground-dark">Why this matters</Text>
        <Text className="mt-4 text-base leading-6 text-muted-light dark:text-muted-dark">{hint}</Text>
        <Pressable className="mt-6 h-12 items-center justify-center rounded-full bg-foreground-light dark:bg-foreground-dark" onPress={() => setIsOpen(false)}>
          <Text className="text-base font-bold text-background-light dark:text-background-dark">Got it</Text>
        </Pressable>
      </BottomSheet>
    </>
  );
}
