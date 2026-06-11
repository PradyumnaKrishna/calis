import {type ComponentProps, useState} from 'react';

import {ActivityIndicator, Pressable, Text, TextInput, View} from 'react-native';

import {useMutation, useQueryClient} from '@tanstack/react-query';

import {useApi} from '../../lib/api';
import type {components} from '../../lib/api-schema';
import {BottomSheet} from '../bottom-sheet';
import {NativeWindFeather} from '../nativewind-feather';

export type PlanFeedbackRating = components['schemas']['PlanFeedbackRequest']['rating'];

type FeatherName = ComponentProps<typeof NativeWindFeather>['name'];

type FeedbackOption = {
  label: string;
  value: PlanFeedbackRating;
  icon: FeatherName;
};

const feedbackOptions: FeedbackOption[] = [
  {label: 'Too hard', value: 'too_hard', icon: 'alert-circle'},
  {label: 'Manageable', value: 'manageable', icon: 'check-circle'},
  {label: 'Easy', value: 'easy', icon: 'zap'},
  {label: 'Pain', value: 'pain', icon: 'activity'},
  {label: 'Skipped', value: 'skipped', icon: 'x-circle'},
];

type FeedbackSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function FeedbackSheet({isOpen, onClose}: FeedbackSheetProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [selectedFeedback, setSelectedFeedback] =
    useState<PlanFeedbackRating>('manageable');
  const [feedbackNote, setFeedbackNote] = useState('');
  const feedbackMutation = useMutation({
    mutationFn: async (feedback: {rating: PlanFeedbackRating; note: string | null}) => {
      const {data, error} = await api.POST('/api/v1/plans/today/feedback', {
        body: feedback,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (response) => {
      if (response?.plan) {
        queryClient.setQueryData(['today-plan'], response.plan);
      }

      queryClient.invalidateQueries({queryKey: ['plan']});
      queryClient.invalidateQueries({queryKey: ['profile']});
      setFeedbackNote('');
      setSelectedFeedback('manageable');
      onClose();
    },
  });

  function submitFeedback() {
    feedbackMutation.mutate({
      rating: selectedFeedback,
      note: feedbackNote.trim() || null,
    });
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <Text className="text-2xl font-black text-foreground-light dark:text-foreground-dark">
        How did it feel?
      </Text>
      <View className="mt-5 gap-2">
        {feedbackOptions.map((option) => {
          const isSelected = selectedFeedback === option.value;

          return (
            <Pressable
              accessibilityRole="button"
              className={[
                'h-12 flex-row items-center gap-3 rounded-lg border px-4',
                isSelected
                  ? 'border-foreground-light bg-surface-light dark:border-foreground-dark dark:bg-surface-dark'
                  : 'border-border-light dark:border-border-dark',
              ].join(' ')}
              key={option.value}
              onPress={() => setSelectedFeedback(option.value)}>
              <NativeWindFeather
                className="text-muted-light dark:text-muted-dark"
                name={option.icon}
                size={18}
              />
              <Text className="text-base font-black text-foreground-light dark:text-foreground-dark">
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        className="mt-4 min-h-24 rounded-lg border border-border-light p-4 text-base font-semibold text-foreground-light dark:border-border-dark dark:text-foreground-dark"
        multiline
        onChangeText={setFeedbackNote}
        placeholder="Add a note"
        placeholderTextColor="#8A8982"
        textAlignVertical="top"
        value={feedbackNote}
      />

      {feedbackMutation.isError ? (
        <Text className="mt-3 text-sm font-bold text-danger-light dark:text-danger-dark">
          Could not save feedback. Try again.
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        className={[
          'mt-4 h-12 flex-row items-center justify-center gap-2 rounded-full bg-foreground-light dark:bg-foreground-dark',
          feedbackMutation.isPending ? 'opacity-70' : '',
        ].join(' ')}
        disabled={feedbackMutation.isPending}
        onPress={submitFeedback}>
        {feedbackMutation.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <NativeWindFeather
            className="text-background-light dark:text-background-dark"
            name="send"
            size={18}
          />
        )}
        <Text className="text-base font-black text-background-light dark:text-background-dark">
          Submit
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
