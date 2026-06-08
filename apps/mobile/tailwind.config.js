/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#FFFFFF',
          dark: '#111110',
        },
        foreground: {
          light: '#21201C',
          dark: '#EEEEEC',
        },
        muted: {
          light: '#63635E',
          dark: '#B5B3AD',
        },
        border: {
          light: '#DAD9D6',
          dark: '#3B3A37',
        },
        surface: {
          light: '#F1F0EF',
          dark: '#222221',
        },
        primary: {
          light: '#21201C',
          dark: '#EEEEEC',
        },
        danger: {
          light: '#D13415',
          dark: '#FF977D',
          surface: {
            light: '#FEEBE7',
            dark: '#391714',
          },
          border: {
            light: '#FDBDAF',
            dark: '#6E2920',
          },
        },
        success: {
          light: '#2A7E3B',
          dark: '#71D083',
          surface: {
            light: '#E9F6E9',
            dark: '#1B2A1E',
          },
          border: {
            light: '#B2DDB5',
            dark: '#2D5736',
          },
        },
        warning: {
          light: '#AB6400',
          dark: '#FFCA16',
          surface: {
            light: '#FFF7C2',
            dark: '#302008',
          },
          border: {
            light: '#F3D673',
            dark: '#5C3D05',
          },
        },
        focus: {
          light: '#0D74CE',
          dark: '#70B8FF',
          surface: {
            light: '#E6F4FE',
            dark: '#0D2847',
          },
          border: {
            light: '#ACD8FC',
            dark: '#104D87',
          },
        },
      },
    },
  },
  plugins: [],
};
