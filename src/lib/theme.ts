import { Shop } from './services/shopService'

export interface ThemeColors {
  primary: string
  secondary: string
  primaryHover: string
  secondaryHover: string
  accent: string
  accentHover: string
}

export interface ShopTheme {
  colors: ThemeColors
  gradients: {
    header: string
    button: string
    buttonHover: string
  }
  borders: {
    selected: string
    selectedBg: string
  }
}

// Define shop themes
const SHOP_THEMES: Record<string, ShopTheme> = {
  'sole-bicycles': {
    colors: {
      primary: '#7DD3C0',
      secondary: '#5FB3A1',
      primaryHover: '#6BC7B3',
      secondaryHover: '#4FA08A',
      accent: '#059669',
      accentHover: '#047857'
    },
    gradients: {
      header: 'linear-gradient(to right, #7DD3C0, #5FB3A1)',
      button: 'linear-gradient(to right, #059669, #047857)',
      buttonHover: 'linear-gradient(to right, #047857, #036749)'
    },
    borders: {
      selected: 'border-teal-500',
      selectedBg: 'bg-teal-50'
    }
  },
  'sd-electric-bike': {
    colors: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      primaryHover: '#2563EB',
      secondaryHover: '#1D4ED8',
      accent: '#2563EB',
      accentHover: '#1D4ED8'
    },
    gradients: {
      header: 'linear-gradient(to right, #3B82F6, #1E40AF)',
      button: 'linear-gradient(to right, #2563EB, #1D4ED8)',
      buttonHover: 'linear-gradient(to right, #1D4ED8, #1E3A8A)'
    },
    borders: {
      selected: 'border-blue-500',
      selectedBg: 'bg-blue-50'
    }
  }
}

// Default theme (fallback)
const DEFAULT_THEME: ShopTheme = SHOP_THEMES['sd-electric-bike']

export function getShopTheme(shop: Shop | { slug: string }): ShopTheme {
  return SHOP_THEMES[shop.slug] || DEFAULT_THEME
}

export function getThemeClasses(shop: Shop | { slug: string }) {
  const theme = getShopTheme(shop)

  return {
    // Header styling
    headerGradient: {
      background: theme.gradients.header
    },

    // Button classes
    primaryButton: `bg-gradient-to-r text-white font-semibold transition-all duration-200`,
    primaryButtonStyle: {
      background: theme.gradients.button
    },
    primaryButtonHoverStyle: {
      background: theme.gradients.buttonHover
    },

    // Selection states
    selectedCard: `${theme.borders.selected} ${theme.borders.selectedBg}`,
    unselectedCard: 'border-slate-200 hover:border-slate-300',

    // CSS custom properties for dynamic styling
    cssVars: {
      '--theme-primary': theme.colors.primary,
      '--theme-secondary': theme.colors.secondary,
      '--theme-accent': theme.colors.accent,
      '--theme-accent-hover': theme.colors.accentHover
    }
  }
}

// Utility to generate inline styles for buttons
export function getButtonStyles(shop: Shop | { slug: string }, hover = false) {
  const theme = getShopTheme(shop)
  return {
    background: hover ? theme.gradients.buttonHover : theme.gradients.button
  }
}

// Utility to check if a shop uses a specific theme
export function isShopTheme(shop: Shop | { slug: string }, themeName: keyof typeof SHOP_THEMES): boolean {
  return shop.slug === themeName
}