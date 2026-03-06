// InvestigatePro Tailwind CSS Brand Extension
// Add to your tailwind.config.js: theme: { extend: require('./tailwind.brand.js') }

module.exports = {
  colors: {
    // Primary - Navy
    navy: {
      50: '#F0F4FF',
      100: '#E0E8FF',
      200: '#C7D4FF',
      300: '#A3B8FF',
      400: '#7A93FF',
      500: '#3D4F70',
      600: '#2A3A5C',
      700: '#1A2744',
      800: '#0F1A3A',
      900: '#0C142E',
      950: '#080E1F',
    },
    // Primary - Cyan (Accent)
    cyan: {
      50: '#F4FCFD',
      100: '#E8F9FC',
      200: '#C8F1F8',
      300: '#A8EAF3',
      400: '#88E0EE',
      500: '#76DCEC',
      600: '#5BC9DB',
      700: '#3FB5C9',
      800: '#2A9AAF',
      900: '#1F7A8C',
    },
    // Semantic
    success: {
      light: '#D1FAE5',
      DEFAULT: '#10B981',
      dark: '#059669',
    },
    warning: {
      light: '#FEF3C7',
      DEFAULT: '#F59E0B',
      dark: '#D97706',
    },
    error: {
      light: '#FEE2E2',
      DEFAULT: '#EF4444',
      dark: '#DC2626',
    },
    info: {
      light: '#DBEAFE',
      DEFAULT: '#3B82F6',
      dark: '#2563EB',
    },
  },
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1.2' }],
  },
  borderRadius: {
    sm: '4px',
    DEFAULT: '8px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
};
