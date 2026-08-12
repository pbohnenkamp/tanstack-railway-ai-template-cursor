import type { StorybookConfig } from '@storybook/tanstack-react'
import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/tanstack-react',
  async viteFinal(viteConfig) {
    // Ensure Tailwind v4 processes `src/styles.css` even when Storybook's Vite
    // merge drops or reorders app plugins (e.g. Nitro / Start).
    const plugins = (viteConfig.plugins ?? []).flat().filter((plugin) => {
      if (!plugin || typeof plugin !== 'object' || !('name' in plugin)) {
        return true
      }
      const name = String(plugin.name)
      return !name.toLowerCase().includes('nitro')
    })

    return mergeConfig(
      { ...viteConfig, plugins },
      {
        plugins: [tailwindcss()],
        resolve: {
          tsconfigPaths: true,
        },
      },
    )
  },
}

export default config
