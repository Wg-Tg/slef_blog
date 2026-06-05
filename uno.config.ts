import { defineConfig, presetWind, presetTypography } from 'unocss';

export default defineConfig({
  presets: [
    presetWind(),
    presetTypography(),
  ],
  theme: {
    colors: {
      bg: '#FBF9F6',
      surface: '#FFFFFF',
      text: '#1A1A1A',
      accent: '#E63946',
      accentAlt: '#F4A261',
      border: '#2B2B2B',
      muted: '#6B6B6B',
      space: '#0B0A0A',
      star: '#EAEAEA',
    },
    fontFamily: {
      body: 'Georgia, "Times New Roman", serif',
      heading: '"DM Sans", system-ui, sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
  },
  shortcuts: {
    'card': 'bg-surface border-2 border-border shadow-[6px_6px_0px_#2B2B2B] rounded-[4px] p-6',
    'card-hover': 'hover:shadow-[2px_2px_0px_#2B2B2B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150',
    'btn': 'border-2 border-border bg-surface text-text font-heading font-bold px-6 py-3 cursor-pointer shadow-[6px_6px_0px_#2B2B2B] transition-all duration-150 hover:shadow-[2px_2px_0px_#2B2B2B] hover:translate-x-[2px] hover:translate-y-[2px]',
    'input': 'border-2 border-border bg-surface px-4 py-3 font-body text-text focus:border-accent outline-none transition-colors duration-200',
    'divider': 'border-t-2 border-dashed border-border',
  },
});
