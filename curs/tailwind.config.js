/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        // Дополнительные акцентные цвета, если понадобятся
        'accent': {
          'light': '#3b82f6',
          'DEFAULT': '#2563eb',
          'dark': '#1d4ed8',
        },
      },
      fontFamily: {
        'sans': [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
        'mono': [
          '"SF Mono"',
          'Monaco',
          '"Cascadia Mono"',
          '"Courier New"',
          'monospace'
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 6px 20px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}