import type { ThemeConfig } from 'antd';

/**
 * Ant Design 5 Design Tokens matched to NutrAI's Warm Botanical Editorial palette.
 * High-contrast ink (#151914) on Warm Ivory (#F6F4EC) and Pure Crisp Paper (#FFFFFF).
 */
export const nutraiAntTheme: ThemeConfig = {
  token: {
    fontFamily: "'Manrope', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    colorPrimary: '#151914',
    colorInfo: '#3B62D4',
    colorSuccess: '#3B7A23',
    colorWarning: '#C47B09',
    colorError: '#C93826',
    colorBgLayout: '#F6F4EC',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorText: '#151914',
    colorTextSecondary: '#5C594E',
    colorTextTertiary: '#8A8679',
    colorBorder: 'rgba(21, 25, 20, 0.14)',
    colorBorderSecondary: 'rgba(21, 25, 20, 0.08)',
    borderRadius: 10,
    borderRadiusLG: 14,
    controlHeight: 38,
    fontSize: 14,
  },
  components: {
    Button: {
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Input: {
      activeShadow: '0 0 0 2px rgba(255, 145, 20, 0.22)',
    },
    Select: {
      optionSelectedBg: 'rgba(255, 145, 20, 0.14)',
    },
    Segmented: {
      trackBg: '#EFECE1',
      itemSelectedBg: '#FFFFFF',
      itemSelectedColor: '#151914',
      itemColor: '#5C594E',
    },
    Tabs: {
      inkBarColor: '#FF9114',
      itemActiveColor: '#151914',
      itemSelectedColor: '#151914',
      itemHoverColor: '#151914',
    },
    Tag: {
      borderRadiusSM: 999,
    },
  },
};

