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
  icons: { icon: "/favicon.svg" },
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
    <html lang="en" data-bs-theme="dark">
      <head>
        <link rel="stylesheet" href="/vendor/bootstrap/bootstrap.min.css" />
        <link
          rel="stylesheet"
          href="/vendor/bootstrap-icons/bootstrap-icons.min.css"
        />
      </head>
      <body className="d-flex flex-column min-vh-100 bg-body text-body">
        <Header />
        <main className="container flex-grow-1 py-4">{children}</main>
        <footer className="border-top mt-auto py-3 small text-secondary">
          <div className="container d-flex flex-wrap justify-content-between gap-2">
            <span>
              <strong className="text-body">managa</strong> · self-productivity
              app manager
            </span>
            <span className="font-monospace">
              server :5100 · apps on dynamic ports
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
