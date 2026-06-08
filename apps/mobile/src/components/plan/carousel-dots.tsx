import {Pressable, View} from 'react-native';

type CarouselDotsProps = {
  activeIndex: number;
  count: number;
  onSelectIndex: (index: number) => void;
};

export function CarouselDots({activeIndex, count, onSelectIndex}: CarouselDotsProps) {
  return (
    <View className="h-10 items-center justify-center">
      <View className="flex-row items-center justify-center gap-2">
        {Array.from({length: count}, (_, index) => (
          <Pressable
            accessibilityLabel={`Go to exercise ${index + 1}`}
            accessibilityRole="button"
            className="h-8 items-center justify-center"
            key={index}
            onPress={() => onSelectIndex(index)}>
            <View
              className={[
                'h-2 rounded-full',
                index === activeIndex
                  ? 'w-6 bg-foreground-light dark:bg-foreground-dark'
                  : 'w-2 bg-border-light dark:bg-border-dark',
              ].join(' ')}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
