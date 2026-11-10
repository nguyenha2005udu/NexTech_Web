"use client";

import type { ReactNode } from "react";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { antdTheme } from "@/config/theme";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ConfigProvider theme={antdTheme} locale={viVN}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
