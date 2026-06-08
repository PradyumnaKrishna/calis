import {Pressable, Text} from 'react-native';

import {useQueryClient} from '@tanstack/react-query';
import {useRouter} from 'expo-router';

import {clearStoredProfileId} from '../lib/profile-storage';

type ResetProfileButtonProps = {
  label?: string;
};

export function ResetProfileButton({label = 'Onboard again'}: ResetProfileButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function resetProfile() {
    await clearStoredProfileId();
    queryClient.setQueryData(['stored-profile-id'], null);
    queryClient.removeQueries({queryKey: ['profile']});
    queryClient.removeQueries({queryKey: ['plan']});
    queryClient.removeQueries({queryKey: ['today-plan']});
    router.replace('/' as never);
  }

  return (
    <Pressable
      accessibilityRole="button"
      className="h-12 items-center justify-center rounded-full border border-border-light px-6 dark:border-border-dark"
      onPress={resetProfile}>
      <Text className="text-base font-semibold text-foreground-light dark:text-foreground-dark">
        {label}
      </Text>
    </Pressable>
  );
}
