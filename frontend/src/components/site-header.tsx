"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container-wide header-inner">
        <Link href="/" className="brand">
          <span className="brand-dot" aria-hidden="true" />
          busserzXcodehoppers
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "active-link" : ""}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}