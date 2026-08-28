/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deliberately dark enough for AA contrast on white.
        brand: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d'
        }
      },
      fontSize: {
        // Base sizes bumped up: this is used outdoors, on phones, by people
        // who may not have great eyesight.
        base: ['1.0625rem', '1.6'],
        lg: ['1.1875rem', '1.6']
      }
    }
  },
  plugins: []
}
