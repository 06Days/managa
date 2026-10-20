"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icons";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/catalog", label: "Catalog" },
  { href: "/install", label: "Install" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar navbar-expand-md sticky-top border-bottom bg-body-tertiary">
      <div className="container">
        <Link
          className="navbar-brand d-flex align-items-center gap-2 fw-bold"
          href="/"
          aria-label="managa home"
          onClick={() => setOpen(false)}
        >
          <span className="brand-mark">m</span>
          <span>managa</span>
          <span className="brand-dot" aria-hidden="true" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="managa-nav"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className={`collapse navbar-collapse${open ? " show" : ""}`}
          id="managa-nav"
        >
          <ul className="navbar-nav me-auto mb-2 mb-md-0">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li className="nav-item" key={link.href}>
                  <Link
                    href={link.href}
                    className={`nav-link${active ? " active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
            href="/install"
            onClick={() => setOpen(false)}
          >
            <Icon name="plus" size={15} />
            Install app
          </Link>
        </div>
      </div>
    </header>
  );
}
