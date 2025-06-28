// tailwind.config.js
module.exports = {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent:    '#3C96EF',
        'light-gray': '#CED2D6',
        primary:      'var(--md-sys-color-primary)',
        onPrimary:    'var(--md-sys-color-on-primary)',
        secondary:    'var(--md-sys-color-secondary)',
        onSecondary:  'var(--md-sys-color-on-secondary)',
        background:   'var(--md-sys-color-background)',
        surface:      'var(--md-sys-color-surface)',
        surfHigh:     'var(--md-sys-color-surface-container-high)',
        surfLow:      'var(--md-sys-color-surface-container-low)',
        onSurface:    'var(--md-sys-color-on-surface)',
      },
      borderRadius: {
        sm:  'var(--md-sys-shape-corner-small)',
        md:  'var(--md-sys-shape-corner-medium)',
        lg:  'var(--md-sys-shape-corner-large)',
        xl:  'var(--md-sys-shape-corner-extra-large)',
      },
      boxShadow: {
        level1: 'var(--md-sys-elevation-level1)',
        level2: 'var(--md-sys-elevation-level2)',
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};