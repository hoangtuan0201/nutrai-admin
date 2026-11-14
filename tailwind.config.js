/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    // Keep Ant Design button & form element defaults intact without Tailwind reset collisions
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        nutrai: {
          ivory: '#F6F4EC',
          surface: '#FFFFFF',
          alabaster: '#FAF9F3',
          onyx: '#151914',
          saffron: '#FF9114',
          saffronDark: '#D97200',
          green: '#3B7A23',
          scarlet: '#C93826',
          blue: '#3B62D4',
        },
      },
    },
  },
  plugins: [],
};

