// Modern Light Theme Colors

export const COLORS = {
  // Primary Colors
  bg: {
    primary: '#F8F9FA',    // Very light gray
    surface: '#FFFFFF',    // White
    hover: '#F3F4F6',      // Slightly darker gray
    active: '#E5E7EB',     // Medium light gray
  },

  // Text Colors
  text: {
    primary: '#1A1A1A',    // Dark gray/black
    secondary: '#6B7280',  // Medium gray
    tertiary: '#9CA3AF',   // Light gray
    disabled: '#D1D5DB',   // Very light gray
  },

  // Border Colors
  border: {
    light: '#E5E7EB',      // Light border
    medium: '#D1D5DB',     // Medium border
    dark: '#9CA3AF',       // Dark border
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',    // Green
    warning: '#F59E0B',    // Amber
    error: '#EF4444',      // Red
    info: '#3B82F6',       // Blue
    disabled: '#9CA3AF',   // Gray
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
};

// Spacing (base unit: 4px)
export const SPACING = {
  xs: '4px',    // 1 unit
  sm: '8px',    // 2 units
  md: '12px',   // 3 units
  lg: '16px',   // 4 units
  xl: '20px',   // 5 units
  '2xl': '24px', // 6 units
  '3xl': '32px', // 8 units
  '4xl': '40px', // 10 units
  '5xl': '48px', // 12 units
  '6xl': '56px', // 14 units
  '7xl': '64px', // 16 units
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: 'system-ui, -apple-system, sans-serif',

  // Font Sizes
  size: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },

  // Font Weights
  weight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// Responsive Breakpoints
export const BREAKPOINTS = {
  mobile: '375px',
  tablet: '640px',
  desktop: '1024px',
  wide: '1280px',
};

// CSS Variables for use in styles
export const getCSSVariables = () => `
  :root {
    /* Primary Colors */
    --color-bg-primary: ${COLORS.bg.primary};
    --color-bg-surface: ${COLORS.bg.surface};
    --color-bg-hover: ${COLORS.bg.hover};
    --color-bg-active: ${COLORS.bg.active};

    /* Text Colors */
    --color-text-primary: ${COLORS.text.primary};
    --color-text-secondary: ${COLORS.text.secondary};
    --color-text-tertiary: ${COLORS.text.tertiary};
    --color-text-disabled: ${COLORS.text.disabled};

    /* Border Colors */
    --color-border-light: ${COLORS.border.light};
    --color-border-medium: ${COLORS.border.medium};
    --color-border-dark: ${COLORS.border.dark};

    /* Semantic Colors */
    --color-success: ${COLORS.semantic.success};
    --color-warning: ${COLORS.semantic.warning};
    --color-error: ${COLORS.semantic.error};
    --color-info: ${COLORS.semantic.info};
    --color-disabled: ${COLORS.semantic.disabled};

    /* Shadows */
    --shadow-sm: ${COLORS.shadow.sm};
    --shadow-md: ${COLORS.shadow.md};
    --shadow-lg: ${COLORS.shadow.lg};
    --shadow-xl: ${COLORS.shadow.xl};

    /* Spacing */
    --spacing-xs: ${SPACING.xs};
    --spacing-sm: ${SPACING.sm};
    --spacing-md: ${SPACING.md};
    --spacing-lg: ${SPACING.lg};
    --spacing-xl: ${SPACING.xl};
    --spacing-2xl: ${SPACING['2xl']};
    --spacing-3xl: ${SPACING['3xl']};

    /* Typography */
    --font-family: ${TYPOGRAPHY.fontFamily};
    --font-size-base: ${TYPOGRAPHY.size.base};
    --font-weight-normal: ${TYPOGRAPHY.weight.normal};
    --font-weight-medium: ${TYPOGRAPHY.weight.medium};
    --font-weight-semibold: ${TYPOGRAPHY.weight.semibold};
    --font-weight-bold: ${TYPOGRAPHY.weight.bold};

    /* Breakpoints */
    --breakpoint-mobile: ${BREAKPOINTS.mobile};
    --breakpoint-tablet: ${BREAKPOINTS.tablet};
    --breakpoint-desktop: ${BREAKPOINTS.desktop};
  }
`;

// Helper function to get color value
export const getColor = (path: string): string => {
  const parts = path.split('.');
  let value: any = COLORS;
  for (const part of parts) {
    value = value[part];
  }
  return value;
};
