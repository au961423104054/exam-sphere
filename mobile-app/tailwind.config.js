/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        success: {
          DEFAULT: '#16A34A',
          bg: '#DCFCE7',
          border: '#BBF7D0',
          dark: '#15803D',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FEF3C7',
          border: '#FDE68A',
          dark: '#92400E',
        },
        danger: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
          border: '#FECACA',
          dark: '#991B1B',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'Inter_500Medium', 'Inter_600SemiBold', 'Inter_700Bold', 'sans-serif'],
        inter: ['Inter_400Regular', 'Inter_500Medium', 'Inter_600SemiBold', 'Inter_700Bold'],
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
