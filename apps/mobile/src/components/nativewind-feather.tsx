import {Feather} from '@expo/vector-icons';
import {cssInterop} from 'nativewind';

export const NativeWindFeather = cssInterop(Feather, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      color: true,
    },
  },
});
