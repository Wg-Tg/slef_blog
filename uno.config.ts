import { defineConfig, presetWind, presetTypography } from 'unocss';

export default defineConfig({
  presets: [
    presetWind(),
    presetTypography(),
  ],
  theme: {
    colors: {
      // 主色调
      bg: '#FBF9F8',
      surface: '#FFFFFF',
      text: '#3D405B',
      'text-light': '#6C6E8A',

      // 强调色 — 天蓝 + 浅粉紫
      accent: '#7EB8DA',
      'accent-deep': '#5A9FC0',
      'accent-pink': '#D4A5C4',
      'accent-purple': '#B8A9D4',
      'accent-warm': '#F0C4C0',

      // 边框
      border: '#E8E4E2',
      'border-light': '#F0EDEB',

      // 太空色（太阳系页保留）
      space: '#0B0A0A',
    },
    fontFamily: {
      body: "'Noto Sans SC', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      heading: "'Playfair Display', 'Noto Sans SC', Georgia, serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
  },
  shortcuts: {
    'card': 'bg-surface border border-border rounded-xl p-7 shadow-sm hover:shadow-md hover:border-accent transition-all duration-300',
    'btn': 'inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white font-500 rounded-lg cursor-pointer shadow-sm hover:bg-accent-deep hover:shadow-md hover:-translate-y-0.5 transition-all duration-250',
    'input': 'w-full px-4 py-2.5 border border-border rounded-lg bg-surface text-text text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 transition-all duration-200',
  },
});
