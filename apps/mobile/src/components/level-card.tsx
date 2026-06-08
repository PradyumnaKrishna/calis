import {useEffect, useState, type ComponentProps} from 'react';

import {Animated, Easing, Text, View} from 'react-native';

import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useQuery} from '@tanstack/react-query';

import {useApi} from '../lib/api';
import {LEVEL_CONTENT, LEVEL_ICON_NAMES, LEVEL_ORDER} from '../lib/level';

export function LevelCard() {
  const api = useApi();
  const [trackWidth, setTrackWidth] = useState(0);
  const [progressAnim] = useState(() => new Animated.Value(0));

  const {data: profile} = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const {data, error} = await api.GET('/api/v1/profile');

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const level = profile?.currentPlanLevel ?? profile?.level;
  const activeIndex = level ? LEVEL_ORDER.indexOf(level) : -1;
  const progress = level ? (activeIndex + 1) / LEVEL_ORDER.length : 0;
  const animatedProgressWidth = Animated.multiply(progressAnim, trackWidth);

  useEffect(() => {
    Animated.timing(progressAnim, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
      toValue: progress,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  if (!level) {
    return null;
  }

  const content = LEVEL_CONTENT[level];

  return (
    <View className="p-4">
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className="font-mono text-xs uppercase tracking-widest text-muted-light dark:text-muted-dark">
            Current level
          </Text>
          <Text className="mt-1 text-xl font-black text-foreground-light dark:text-foreground-dark">
            {content.label}
          </Text>
          <Text className="mt-1 text-sm font-normal leading-5 text-muted-light dark:text-muted-dark">
            {content.dashboardDescription}
          </Text>
        </View>
      </View>

      <View className="mt-5">
        <View
          className="h-2 overflow-hidden rounded-full bg-surface-light dark:bg-surface-dark"
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
          <Animated.View
            style={{
              backgroundColor: '#0D74CE',
              borderRadius: 999,
              height: '100%',
              width: animatedProgressWidth,
            }}
          />
        </View>

        <View className="mt-3 flex-row items-start justify-between">
          {LEVEL_ORDER.map((item) => {
            const isActive = item === level;
            const iconColor = isActive ? '#0D74CE' : '#63635E';

            return (
              <View className="w-20 items-center gap-1" key={item}>
                <MaterialCommunityIcons
                  color={iconColor}
                  name={
                    LEVEL_ICON_NAMES[item] as ComponentProps<
                      typeof MaterialCommunityIcons
                    >['name']
                  }
                  size={18}
                />
                <Text
                  className={[
                    'text-center text-[10px] font-bold uppercase leading-3',
                    isActive
                      ? 'text-foreground-light dark:text-foreground-dark'
                      : 'text-muted-light dark:text-muted-dark',
                  ].join(' ')}>
                  {LEVEL_CONTENT[item].label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
