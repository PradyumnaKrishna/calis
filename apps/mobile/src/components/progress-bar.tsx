import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
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
    <View className="h-10 flex-1 justify-center">
      <View
        className="h-2 overflow-hidden rounded-full bg-surface-light dark:bg-surface-dark"
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View style={{ height: '100%', overflow: 'hidden', width: animatedProgressWidth }}>
          <View className="h-full w-full rounded-full bg-primary-light dark:bg-primary-dark" />
        </Animated.View>
      </View>
    </View>
  );
}
