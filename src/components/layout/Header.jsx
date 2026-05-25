"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { catalogProducts } from "@/lib/catalog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import CartOverlay from "@/components/cart/CartOverlay";

import SearchOverlay from "./SearchOverlay";
import styles from "./Header.module.scss";

const navigation = [
  {
    key: "zapatos",
    href: "/zapatos",
    labelKey: "shoes",
    promoKey: "shoesPromo",
    links: [
      { href: "/zapatos?subtype=casuales", labelKey: "casual" },
      { href: "/zapatos?subtype=chunkys", labelKey: "chunky" },
      { href: "/zapatos?subtype=formales", labelKey: "formal" },
      { href: "/zapatos?subtype=botines", labelKey: "ankleBoots" },
      { href: "/zapatos?subtype=botas-cuero", labelKey: "leatherBoots" },
      { href: "/zapatos?subtype=botas-microfibra", labelKey: "microfiberBoots" },
    ],
  },
  {
    key: "ropa",
    href: "/ropa",
    labelKey: "apparel",
    promoKey: "apparelPromo",
    links: [
      { href: "/ropa?subtype=casual", labelKey: "casualWear" },
      { href: "/ropa?subtype=ternos-de-vestir", labelKey: "suits" },
      { href: "/ropa?subtype=vestidos", labelKey: "dresses" },
      { href: "/ropa?subtype=abrigos", labelKey: "coats" },
      { href: "/ropa?subtype=chaquetas", labelKey: "jackets" },
    ],
  },
];

export default function Header() {
  const { dictionary } = useLanguage();
  const [activeMenuKey, setActiveMenuKey] = useState(null);
  const [activeMobileMenuKey, setActiveMobileMenuKey] = useState(navigation[0].key);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authUser, setAuthUser] = useState(null);

  const activeMenu = navigation.find((item) => item.key === activeMenuKey) || null;
  const activeMobileMenu = navigation.find((item) => item.key === activeMobileMenuKey) || navigation[0];
  const hasOverlay = Boolean(activeMenu || searchOpen || mobileMenuOpen || cartOpen);
  const profileHref = authUser?.role === "admin" ? "/admin" : authUser ? "/perfil" : "/login";
  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return catalogProducts.slice(0, 6);
    }

    return catalogProducts.filter((product) => {
      return [
        product.name,
        product.brand,
        product.type,
        product.categoryLabel,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await response.json();

        if (isMounted) {
          setAuthUser(data.user?.email ? data.user : null);
        }
      } catch (error) {
        if (isMounted) {
          setAuthUser(null);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleOpenSearch() {
    setActiveMenuKey(null);
    setMobileMenuOpen(false);
    setCartOpen(false);
    setSearchOpen(true);
  }

  function handleCloseSearch() {
    setSearchOpen(false);
  }

  function handleCloseNavigation() {
    setActiveMenuKey(null);
    setMobileMenuOpen(false);
  }

  function handleToggleMobileMenu() {
    setSearchOpen(false);
    setCartOpen(false);
    setActiveMenuKey(null);
    setActiveMobileMenuKey(navigation[0].key);
    setMobileMenuOpen((currentValue) => !currentValue);
  }

  function handleCloseMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleOpenCart() {
    setActiveMenuKey(null);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(true);
  }

  function handleCloseCart() {
    setCartOpen(false);
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.mobileActions}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={dictionary.actions.menu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={handleToggleMobileMenu}
          >
            <Menu size={18} strokeWidth={1.9} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            aria-label={dictionary.actions.search}
            onClick={handleOpenSearch}
          >
            <Search size={18} strokeWidth={1.9} />
          </button>
        </div>

        <div
          className={styles.menuArea}
          onMouseLeave={() => setActiveMenuKey(null)}
        >
          <nav className={styles.nav} aria-label={dictionary.accessibility.mainNavigation}>
            {navigation.map((item) => (
              <div
                key={item.key}
                className={styles.navItem}
                onMouseEnter={() => {
                  if (searchOpen) {
                    setSearchOpen(false);
                  }

                  setActiveMenuKey(item.key);
                }}
                onFocus={() => setActiveMenuKey(item.key)}
              >
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${activeMenuKey === item.key ? styles.navLinkActive : ""}`}
                  onClick={handleCloseNavigation}
                >
                  {dictionary.nav[item.labelKey]}
                </Link>
              </div>
            ))}
          </nav>

          {activeMenu ? (
            <div className={styles.submenuShell}>
              <div className={styles.submenuSidebar}>
                <div className={styles.submenuLinks}>
                  {activeMenu.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={styles.submenuLink}
                      onClick={handleCloseNavigation}
                    >
                      {dictionary.nav[link.labelKey]}
                    </Link>
                  ))}
                </div>
              </div>

              <div className={styles.submenuMediaColumn}>
                <div className={styles.submenuVisual}>
                  <span className={styles.submenuVisualLabel}>Espacio imagen 01</span>
                  <strong>{dictionary.nav[activeMenu.promoKey]}</strong>
                </div>

                <div className={styles.submenuVisual}>
                  <span className={styles.submenuVisualLabel}>Espacio imagen 02</span>
                  <strong>
                    {dictionary.nav.campaignLabel} {dictionary.nav[activeMenu.labelKey].toLowerCase()}
                  </strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <Link href="/" className={styles.brand} aria-label={dictionary.accessibility.home}>
          <Image
            src="/assets/logo-kowac-2.webp"
            alt="Kowac"
            width={136}
            height={36}
            priority
            className={styles.brandLogo}
          />
        </Link>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.desktopOnlyAction}`}
            aria-label={dictionary.actions.search}
            onClick={handleOpenSearch}
          >
            <Search size={18} strokeWidth={1.9} />
          </button>

          <Link
            href={profileHref}
            className={styles.iconLink}
            aria-label={dictionary.actions.profile}
          >
            <User size={18} strokeWidth={1.9} />
          </Link>

          <Link
            href="/wishlist"
            className={`${styles.iconLink} ${styles.desktopOnlyAction}`}
            aria-label={dictionary.actions.wishlist}
          >
            <Heart size={18} strokeWidth={1.9} />
          </Link>

          <button
            type="button"
            className={styles.iconButton}
            aria-label={dictionary.actions.cart}
            onClick={handleOpenCart}
          >
            <ShoppingBag size={18} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div
          id="mobile-navigation"
          className={styles.mobileMenuPanel}
          role="dialog"
          aria-modal="true"
          aria-label={dictionary.actions.menu}
        >
          <div className={styles.mobileMenuInner}>
            <div className={styles.mobileMenuHeader}>
              <Link
                href="/wishlist"
                className={styles.mobileMenuWishlist}
                aria-label={dictionary.actions.wishlist}
                onClick={handleCloseNavigation}
              >
                <Heart size={20} strokeWidth={1.9} />
              </Link>

              <button
                type="button"
                className={styles.mobileMenuClose}
                aria-label={dictionary.actions.closeMenu}
                onClick={handleCloseMobileMenu}
              >
                <X size={20} strokeWidth={1.9} />
              </button>
            </div>

            <div className={styles.mobileMenuTabs} role="tablist" aria-label={dictionary.accessibility.mainNavigation}>
              {navigation.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={activeMobileMenu.key === item.key}
                  className={`${styles.mobileMenuTab} ${activeMobileMenu.key === item.key ? styles.mobileMenuTabActive : ""}`}
                  onClick={() => setActiveMobileMenuKey(item.key)}
                >
                  {dictionary.nav[item.labelKey]}
                </button>
              ))}
            </div>

            <div className={styles.mobileVisualStack}>
              <div className={styles.mobileVisualCard}>
                <span className={styles.submenuVisualLabel}>Espacio imagen 01</span>
                <strong>{dictionary.nav[activeMobileMenu.promoKey]}</strong>
              </div>

              <div className={styles.mobileVisualCard}>
                <span className={styles.submenuVisualLabel}>Espacio imagen 02</span>
                <strong>
                  {dictionary.nav.campaignLabel} {dictionary.nav[activeMobileMenu.labelKey].toLowerCase()}
                </strong>
              </div>
            </div>

            <nav className={styles.mobileNav} aria-label={dictionary.accessibility.mainNavigation}>
              <div className={styles.mobileNavSection}>
                <div className={styles.mobileNavLinks}>
                  {activeMobileMenu.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={styles.mobileNavLink}
                      onClick={handleCloseNavigation}
                    >
                      {dictionary.nav[link.labelKey]}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      ) : null}

      <SearchOverlay
        isOpen={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchResults}
        onClose={handleCloseSearch}
      />

      <CartOverlay isOpen={cartOpen} onClose={handleCloseCart} />

      <div
        className={`${styles.pageBackdrop} ${hasOverlay ? styles.pageBackdropActive : ""}`}
        aria-hidden="true"
        onClick={() => {
          handleCloseNavigation();
          handleCloseSearch();
          handleCloseMobileMenu();
          handleCloseCart();
        }}
      />
    </header>
  );
}
