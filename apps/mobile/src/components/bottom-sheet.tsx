import type {PropsWithChildren} from 'react';

import {Modal, Pressable, View} from 'react-native';

type BottomSheetProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
}>;

export function BottomSheet({children, isOpen, onClose}: BottomSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={isOpen} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="rounded-t-3xl border border-border-light bg-background-light p-6 dark:border-border-dark dark:bg-background-dark">
          <View className="mb-4 items-center">
            <View className="h-1 w-12 rounded-full bg-border-light dark:bg-border-dark" />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
