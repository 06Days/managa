import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { Navbar } from "./components/Navbar";

export const metadata: Metadata = {
  title: "Quita — build a city, one clean day at a time",
  description:
    "Track addictions, log relapses, answer your own reflection questions and watch a city grow with every clean day.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f4f6fb",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">{children}</main>
        <footer className="border-top bg-white py-3 mt-auto">
          <div className="container d-flex flex-wrap justify-content-between gap-2 small text-secondary">
            <span>
              <strong className="text-body">quita</strong> · your city grows
              between relapses
            </span>
            <span className="font-monospace">a managa app</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
