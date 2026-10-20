import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "managa — app manager",
    template: "%s · managa",
  },
  description:
    "Install, toggle and manage your self-productivity apps from one dashboard.",
};

export const viewport: Viewport = {
  themeColor: "#0b0f17",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="ambient" aria-hidden="true">
          <span className="orb orb-a" />
          <span className="orb orb-b" />
        </div>
        <Header />
        <main className="shell page">{children}</main>
        <footer className="shell site-footer">
          <span>
            <strong>managa</strong> · self-productivity app manager
          </span>
          <span className="mono">
            server :5100 · apps on :3100–:4199
          </span>
        </footer>
      </body>
    </html>
  );
}
