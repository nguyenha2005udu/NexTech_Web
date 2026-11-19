"use client";

import type { ReactNode } from "react";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { antdTheme } from "@/config/theme";
import { StoreProvider } from "./StoreProvider";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <StoreProvider>
      <ConfigProvider theme={antdTheme} locale={viVN}>
        <App>{children}</App>
      </ConfigProvider>
    </StoreProvider>
  );
}
