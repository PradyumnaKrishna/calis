import {TextInput, type TextStyle} from 'react-native';

type TextAnswerInputProps = {
  disabled?: boolean;
  onChangeText: (value: string) => void;
  value: string;
};

export function TextAnswerInput({disabled = false, onChangeText, value}: TextAnswerInputProps) {
  const height = textHeightForValue(value);
  const inputStyle = {
    height,
    outlineStyle: 'none',
    overflow: height >= 176 ? 'scroll' : 'hidden',
  } as TextStyle;

  return (
    <TextInput
      className="mt-6 w-full max-w-sm border-b border-border-light px-0 py-3 text-xl font-semibold leading-7 text-foreground-light outline-none dark:border-border-dark dark:text-foreground-dark"
      editable={!disabled}
      multiline
      numberOfLines={1}
      onChangeText={onChangeText}
      placeholder="Type your answer..."
      placeholderTextColor="#8B8B84"
      returnKeyType="default"
      scrollEnabled={height >= 176}
      style={inputStyle}
      textAlignVertical="top"
      value={value}
    />
  );
}

function textHeightForValue(value: string) {
  if (!value.trim()) {
    return 52;
  }

  const lineCount = value
    .split('\n')
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.length / 22)), 0);

  return Math.max(52, Math.min(52 + (lineCount - 1) * 28, 176));
}
