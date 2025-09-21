const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/layouts/**/*.html',
    './.duct/**/*.{js,ts,html}'
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for fractal web visualization
        'fractal': {
          'bg': '#0b0f14',
          'sidebar': 'rgba(20, 26, 33, 0.96)',
          'border': '#1f2937',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}

export default config