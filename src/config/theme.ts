import type { ThemeConfig } from "antd";

// Token màu/typo lấy từ Figma "NexTech · User | Web App".
export const colors = {
  ink: "#1a1a2e",
  inkMuted: "#4b5565",
  primary: "#c2410c",
  primaryText: "#9a3412",
  primarySoft: "#fff1e9",
  primarySoftBorder: "#f8cdb9",
  price: "#b51e2a",
  rating: "#824313",
  border: "#e5e8ef",
  borderInput: "#d3d8e2",
  surface: "#ffffff",
  surfaceMuted: "#eef0f5",
} as const;

export const antdTheme: ThemeConfig = {
  cssVar: { key: "nextech" },
  hashed: false,
  token: {
    colorPrimary: colors.primary,
    colorLink: colors.primaryText,
    colorText: colors.ink,
    colorTextSecondary: colors.inkMuted,
    colorTextPlaceholder: colors.inkMuted,
    colorTextHeading: colors.ink,
    colorBorder: colors.borderInput,
    colorBorderSecondary: colors.border,
    colorSplit: colors.border,
    fontFamily: "var(--font-body), system-ui, sans-serif",
    fontSize: 14,
    fontSizeLG: 15,
    borderRadius: 9,
    borderRadiusLG: 13,
    controlHeight: 43,
    controlHeightLG: 49,
  },
  components: {
    Button: {
      fontWeight: 800,
      primaryShadow: "none",
      defaultShadow: "none",
      paddingInline: 16,
      paddingInlineLG: 16,
      contentFontSizeLG: 16,
      borderRadiusLG: 13,
    },
    Input: {
      activeShadow: "0 0 0 3px rgba(194, 65, 12, 0.12)",
      paddingInlineLG: 13,
      inputFontSizeLG: 15,
    },
    InputNumber: {
      activeShadow: "0 0 0 3px rgba(194, 65, 12, 0.12)",
    },
    Form: {
      labelFontSize: 15,
      labelColor: colors.ink,
      verticalLabelPadding: "0 0 7px",
      itemMarginBottom: 17,
    },
    Checkbox: {
      borderRadiusSM: 4,
    },
    Tabs: {
      itemColor: colors.inkMuted,
      itemSelectedColor: colors.primaryText,
      itemHoverColor: colors.primaryText,
      inkBarColor: colors.primary,
      titleFontSize: 14,
      horizontalItemPadding: "9px 0",
      horizontalItemGutter: 18,
    },
    Modal: {
      borderRadiusLG: 16,
    },
  },
};
