/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      animation: {
        'neural-pulse': 'neural-pulse 3s ease-in-out infinite',
        'data-flow': 'data-flow 8s linear infinite',
        'connection-pulse': 'connection-pulse 4s ease-in-out infinite',
      },
      keyframes: {
        'neural-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'data-flow': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(120vh)', opacity: '0' },
        },
        'connection-pulse': {
          '0%, 100%': { strokeOpacity: '0.3' },
          '50%': { strokeOpacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
