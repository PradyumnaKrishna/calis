import {View} from 'react-native';

import {MaterialCommunityIcons} from '@expo/vector-icons';

import {LEVEL_CONTENT, LEVEL_ICON_NAMES, type Level} from '../lib/level';

type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type LevelIconProps = {
  contained?: boolean;
  level: Level;
  size?: number;
};

export function LevelIcon({contained = false, level, size = 72}: LevelIconProps) {
  const icon = (
    <MaterialCommunityIcons
      accessibilityLabel={`${LEVEL_CONTENT[level].label} level`}
      color="#0D74CE"
      name={LEVEL_ICON_NAMES[level] as MaterialCommunityIconName}
      size={size}
    />
  );

  if (!contained) {
    return icon;
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-focus-surface-light dark:bg-focus-surface-dark"
      style={{height: size, width: size}}>
      <MaterialCommunityIcons
        accessibilityLabel={`${LEVEL_CONTENT[level].label} level`}
        color="#0D74CE"
        name={LEVEL_ICON_NAMES[level] as MaterialCommunityIconName}
        size={size * 0.58}
      />
    </View>
  );
}
