"use client";

import { useMemo, useState } from "react";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { catalogProducts } from "@/lib/catalog";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
      { href: "/zapatos?subtype=chonkis", labelKey: "chunky" },
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeMenu = navigation.find((item) => item.key === activeMenuKey) || null;
  const hasOverlay = Boolean(activeMenu || searchOpen);
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

  function handleOpenSearch() {
    setActiveMenuKey(null);
    setSearchOpen(true);
  }

  function handleCloseSearch() {
    setSearchOpen(false);
  }

  function handleCloseNavigation() {
    setActiveMenuKey(null);
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
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
            className={styles.iconButton}
            aria-label={dictionary.actions.search}
            onClick={handleOpenSearch}
          >
            <Search size={18} strokeWidth={1.9} />
          </button>

          <Link href="/perfil" className={styles.iconLink} aria-label={dictionary.actions.profile}>
            <User size={18} strokeWidth={1.9} />
          </Link>

          <Link href="/wishlist" className={styles.iconLink} aria-label={dictionary.actions.wishlist}>
            <Heart size={18} strokeWidth={1.9} />
          </Link>

          <Link href="/carrito" className={styles.iconLink} aria-label={dictionary.actions.cart}>
            <ShoppingBag size={18} strokeWidth={1.9} />
          </Link>
        </div>
      </div>

      <SearchOverlay
        isOpen={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchResults}
        onClose={handleCloseSearch}
      />

      <div
        className={`${styles.pageBackdrop} ${hasOverlay ? styles.pageBackdropActive : ""}`}
        aria-hidden="true"
        onClick={() => {
          setActiveMenuKey(null);
          handleCloseSearch();
        }}
      />
    </header>
  );
}
