/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /*
         * The palette is taken from the materials of a Tamil Nadu village
         * doorway at dawn: rice flour, red earth, turmeric, paddy.
         * Every value below is AA on its paired text colour.
         */
        arisi: { // rice flour — the page ground a kolam is drawn with
          50: '#FDFBF5', 100: '#FBF6EA', 200: '#F3EAD7',
          300: '#E7D9BE', 400: '#D4C09B'
        },
        semmann: { // செம்மண் — the red laterite earth kolam is drawn on
          50: '#FBF0ED', 100: '#F6DED8', 200: '#E9B6AA',
          400: '#C4674F', 600: '#A03E2A', 700: '#873223', 800: '#6B271B'
        },
        manjal: { // turmeric — highlight and focus only, never a surface
          100: '#FDF1D4', 300: '#F2CE72', 500: '#E0A317', 700: '#9A6C05'
        },
        pachai: { // paddy green — health, and every primary action
          50: '#EFF6F0', 100: '#D9EADD', 300: '#8FBF9C',
          600: '#3A8351', 700: '#2E6B41', 800: '#235433', 900: '#183A24'
        },
        kummayam: { // oxblood — the authority band of an official masthead
          700: '#5E1B2B', 800: '#4A1522', 900: '#360F19'
        },
        mai: { // ink — brown-black, warmer than slate against rice flour
          500: '#6B5B52', 600: '#4A3830', 700: '#3D2E27', 900: '#2A1D18'
        }
      },
      backgroundImage: {
        // "pulli" are the dot grid a kolam is drawn around. A faint dot lattice
        // over a dark ground, so the masthead reads as drawn rather than filled.
        // An inline SVG carries its own tile size, so this needs no companion
        // bg-size utility — which would otherwise collide on the `bg-pulli` name.
        pulli:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23FBF6EA' fill-opacity='0.14'/%3E%3C/svg%3E\")"
      },
      fontFamily: {
        // One Tamil-designed family across both scripts keeps a bilingual
        // masthead from looking like two different websites stapled together.
        display: ['"Anek Tamil"', 'system-ui', 'sans-serif'],
        body: ['"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
        data: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      fontSize: {
        // Bumped for outdoor phone use by people who may not see well.
        base: ['1.0625rem', '1.6'],
        lg: ['1.1875rem', '1.6']
      },
      keyframes: {
        // The signature: a kolam drawing itself, the way one is drawn at dawn.
        kolamDraw: { from: { strokeDashoffset: '1' }, to: { strokeDashoffset: '0' } },
        pulliPop: { from: { opacity: '0', transform: 'scale(0)' }, to: { opacity: '1', transform: 'scale(1)' } },
        riseIn: { from: { opacity: '0', transform: 'translateY(0.75rem)' }, to: { opacity: '1', transform: 'none' } },
        ticker: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        sway: { '0%,100%': { transform: 'rotate(-2.5deg)' }, '50%': { transform: 'rotate(2.5deg)' } }
      },
      animation: {
        kolam: 'kolamDraw 2.6s cubic-bezier(.4,0,.2,1) forwards',
        pulli: 'pulliPop .4s cubic-bezier(.34,1.56,.64,1) forwards',
        rise: 'riseIn .5s cubic-bezier(.2,.7,.3,1) forwards',
        ticker: 'ticker 32s linear infinite',
        sway: 'sway 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
