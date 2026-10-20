"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icons";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/catalog", label: "Catalog" },
  { href: "/install", label: "Install" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="managa home">
          <span className="brand-mark">m</span>
          <span className="brand-word">managa</span>
          <span className="brand-dot" />
        </Link>

        <nav className="nav" aria-label="Main navigation">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link className="btn btn-primary btn-sm header-install" href="/install">
          <Icon name="plus" size={16} />
          <span>Install app</span>
        </Link>
      </div>
    </header>
  );
}
