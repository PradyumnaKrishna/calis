import {useEffect} from 'react';

import {useQuery, useQueryClient} from '@tanstack/react-query';
import {usePathname, useRouter} from 'expo-router';

import {useApi} from './api';
import {storeProfileId} from './profile-storage';

export function useProfile() {
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const {
    data: profile,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const {data, error} = await api.GET('/api/v1/profile');

      if (error || !data) {
        throw error ?? Error();
      }

      return data;
    },
  });

  useEffect(() => {
    void (async () => {
      if (!profile) {
        return;
      }

      queryClient.setQueryData(['stored-profile-id'], profile.profileId);
      await storeProfileId(profile.profileId);

      if (!profile.onboarded && pathname !== '/onboarding') {
        router.replace('/onboarding');
      }
    })();
  }, [pathname, profile, queryClient, router]);

  return {
    profile,
    isError,
    isLoading,
    refetch,
  };
}
