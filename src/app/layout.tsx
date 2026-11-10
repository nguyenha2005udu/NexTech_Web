import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Be_Vietnam_Pro, Nunito_Sans } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AppProviders } from "@/components/providers/AppProviders";
import { siteConfig } from "@/config/site";
import "./globals.css";

const heading = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const body = Nunito_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" className={`${heading.variable} ${body.variable}`}>
      <body>
        {/* layer: style antd nằm trong @layer antd → CSS Module của dự án luôn ưu tiên hơn */}
        <AntdRegistry layer>
          <AppProviders>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
