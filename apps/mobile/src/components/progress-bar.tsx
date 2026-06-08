import {useEffect, useState} from 'react';

import {Animated, Easing, View} from 'react-native';

type ProgressBarProps = {
  value: number;
};

export function ProgressBar({value}: ProgressBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [progressAnim] = useState(() => new Animated.Value(value));
  const animatedProgressWidth = Animated.multiply(progressAnim, trackWidth);

  useEffect(() => {
    Animated.timing(progressAnim, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
      toValue: value,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, value]);

  return (
    <View className="flex-1 justify-center" style={{height: 40}}>
      <View
        className="overflow-hidden rounded-full bg-surface-light dark:bg-surface-dark"
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={{height: 8}}>
        <Animated.View style={{height: '100%', overflow: 'hidden', width: animatedProgressWidth}}>
          <View className="h-full w-full rounded-full bg-primary-light dark:bg-primary-dark" />
        </Animated.View>
      </View>
    </View>
  );
}
