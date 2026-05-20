"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";

import styles from "./Footer.module.scss";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/kowac.ec/",
    icon: "/assets/instagram.svg",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100063500201067",
    icon: "/assets/facebook.svg",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@kowac.ec",
    icon: "/assets/tiktok.svg",
  },
];

const legalLinks = [
  { href: "/terminos-condiciones", key: "terms" },
  { href: "/politica-devoluciones", key: "returns" },
  { href: "/politica-cookies", key: "cookies" },
  { href: "/politica-privacidad", key: "privacy" },
];

const sitemapLinks = [
  { href: "/", key: "home" },
  { href: "/tienda", key: "shop" },
  { href: "/zapatos", key: "shoes" },
  { href: "/ropa", key: "apparel" },
  { href: "/contacto", key: "contact" },
];

const helpLinks = [
  { href: "/faq", key: "faq" },
  { href: "/informacion-envio", key: "shipping" },
  { href: "/hacer-devolucion", key: "returnsHelp" },
  { href: "/ordenes", key: "orders" },
];

export default function Footer() {
  const { dictionary, language, setLanguage, supportedLanguages } = useLanguage();
  const [openSections, setOpenSections] = useState({
    sitemap: false,
    help: false,
    social: false,
    contact: false,
    language: false,
  });

  function toggleSection(sectionKey) {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Image
            src="/assets/logo-kowac-2.webp"
            alt="Isotipo Kowac"
            width={40}
            height={40}
            className={styles.mark}
          />
          <div className={styles.brandCopy}>
            <strong>Kowac</strong>
          </div>
        </div>

        <div className={styles.metaBlock}>
          <div className={styles.sitemapBlock}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => toggleSection("sitemap")}
              aria-expanded={openSections.sitemap}
            >
              <span className={styles.linksLabel}>{dictionary.footer.sitemap}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.9}
                className={`${styles.toggleIcon} ${openSections.sitemap ? styles.toggleIconOpen : ""}`}
              />
            </button>
            <div className={`${styles.sectionContentPanel} ${openSections.sitemap ? styles.sectionContentOpen : ""}`}>
              <div className={styles.sitemapLinks}>
                {sitemapLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={styles.sitemapLink}>
                    {dictionary.footer[item.key]}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.helpBlock}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => toggleSection("help")}
              aria-expanded={openSections.help}
            >
              <span className={styles.linksLabel}>{dictionary.footer.help}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.9}
                className={`${styles.toggleIcon} ${openSections.help ? styles.toggleIconOpen : ""}`}
              />
            </button>
            <div className={`${styles.sectionContentPanel} ${openSections.help ? styles.sectionContentOpen : ""}`}>
              <div className={styles.helpLinks}>
                {helpLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={styles.helpLink}>
                    {dictionary.footer[item.key]}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.linksBlock}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => toggleSection("social")}
              aria-expanded={openSections.social}
            >
              <span className={styles.linksLabel}>{dictionary.footer.followUs}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.9}
                className={`${styles.toggleIcon} ${openSections.social ? styles.toggleIconOpen : ""}`}
              />
            </button>
            <div className={`${styles.sectionContentPanel} ${openSections.social ? styles.sectionContentOpen : ""}`}>
              <div className={styles.socialLinks}>
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.name}
                    className={styles.socialLink}
                  >
                    <Image
                      src={link.icon}
                      alt={link.name}
                      width={20}
                      height={20}
                      className={styles.socialIcon}
                    />
                    <span>{link.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.contactBlock}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => toggleSection("contact")}
              aria-expanded={openSections.contact}
            >
              <span className={styles.linksLabel}>{dictionary.footer.contactUs}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.9}
                className={`${styles.toggleIcon} ${openSections.contact ? styles.toggleIconOpen : ""}`}
              />
            </button>
            <div className={`${styles.sectionContentPanel} ${openSections.contact ? styles.sectionContentOpen : ""}`}>
              <div className={styles.contactContent}>
                <a
                  href="https://wa.me/593960510473"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.contactLink}
                >
                  <Image
                    src="/assets/whastapp.svg"
                    alt="WhatsApp"
                    width={18}
                    height={18}
                    className={styles.contactIcon}
                  />
                  <span>+593 96 051 0473</span>
                </a>
              </div>
            </div>
          </div>

          <div className={styles.languageBlock}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => toggleSection("language")}
              aria-expanded={openSections.language}
            >
              <span className={styles.linksLabel}>{dictionary.languageSwitcher.label}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.9}
                className={`${styles.toggleIcon} ${openSections.language ? styles.toggleIconOpen : ""}`}
              />
            </button>
            <div className={`${styles.sectionContentPanel} ${openSections.language ? styles.sectionContentOpen : ""}`}>
              <div
                className={styles.languageOptions}
                aria-label={dictionary.languageSwitcher.selectLanguage}
              >
                {supportedLanguages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`${styles.languageOption} ${language === item.code ? styles.languageOptionActive : ""}`}
                    onClick={() => setLanguage(item.code)}
                    aria-pressed={language === item.code}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.legalBar}>
        <div className={styles.policyLinks}>
          {legalLinks.map((item) => (
            <Link key={item.href} href={item.href} className={styles.policyLink}>
              {dictionary.footer[item.key]}
            </Link>
          ))}
        </div>
        <p>{dictionary.footer.legal}</p>
      </div>
    </footer>
  );
}
