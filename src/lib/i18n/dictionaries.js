export const defaultLanguage = "es";

export const supportedLanguages = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

export const dictionaries = {
  es: {
    languageName: "Español",
    nav: {
      shoes: "Zapatos",
      apparel: "Ropa",
      casual: "Casuales",
      chunky: "Chonkis",
      formal: "Formales",
      ankleBoots: "Botines",
      leatherBoots: "Botas en cuero",
      microfiberBoots: "Botas en microfibra",
      casualWear: "Casual",
      suits: "Ternos de vestir",
      dresses: "Vestidos",
      coats: "Abrigos",
      jackets: "Chaquetas",
      shoesPromo: "Editorial zapatos",
      apparelPromo: "Editorial ropa",
      campaignLabel: "Campaña",
    },
    actions: {
      search: "Buscar",
      profile: "Perfil",
      wishlist: "Wishlist",
      cart: "Carrito",
    },
    search: {
      dialogLabel: "Buscar productos",
      placeholder: "Buscar zapatos, ropa o accesorios",
      resultsFor: 'Resultados para "{query}"',
      startTyping: "Empieza a escribir para buscar productos",
      productCount: "{count} producto(s)",
      imagePlaceholder: "Espacio imagen",
      noResults: "No encontramos coincidencias.",
      tryAnother: "Prueba con otro nombre o categoría.",
    },
    footer: {
      followUs: "Síguenos",
      contactUs: "Contáctanos",
      sitemap: "Páginas",
      help: "Ayuda",
      home: "Inicio",
      shop: "Tienda",
      shoes: "Zapatos",
      apparel: "Ropa",
      contact: "Contacto",
      faq: "FAQ",
      shipping: "Información de envío",
      returnsHelp: "Hacer una devolución",
      orders: "Órdenes",
      policies: "Normativas",
      terms: "Términos y condiciones",
      returns: "Política de devoluciones",
      cookies: "Política de cookies",
      privacy: "Política de privacidad",
      legal: "@2026 Kowac, todos los derechos reservados",
    },
    languageSwitcher: {
      label: "Idioma",
      selectLanguage: "Seleccionar idioma",
    },
    accessibility: {
      mainNavigation: "Navegación principal",
      home: "Inicio",
    },
  },
  en: {
    languageName: "English",
    nav: {
      shoes: "Shoes",
      apparel: "Apparel",
      casual: "Casual",
      chunky: "Chunky",
      formal: "Formal",
      ankleBoots: "Ankle Boots",
      leatherBoots: "Leather Boots",
      microfiberBoots: "Microfiber Boots",
      casualWear: "Casual",
      suits: "Tailored Suits",
      dresses: "Dresses",
      coats: "Coats",
      jackets: "Jackets",
      shoesPromo: "Shoe editorial",
      apparelPromo: "Apparel editorial",
      campaignLabel: "Campaign",
    },
    actions: {
      search: "Search",
      profile: "Profile",
      wishlist: "Wishlist",
      cart: "Cart",
    },
    search: {
      dialogLabel: "Search products",
      placeholder: "Search shoes, apparel, or accessories",
      resultsFor: 'Results for "{query}"',
      startTyping: "Start typing to search products",
      productCount: "{count} product(s)",
      imagePlaceholder: "Image placeholder",
      noResults: "No matches found.",
      tryAnother: "Try a different name or category.",
    },
    footer: {
      followUs: "Follow us",
      contactUs: "Contact us",
      sitemap: "Pages",
      help: "Help",
      home: "Home",
      shop: "Shop",
      shoes: "Shoes",
      apparel: "Apparel",
      contact: "Contact",
      faq: "FAQ",
      shipping: "Shipping information",
      returnsHelp: "Start a return",
      orders: "Orders",
      policies: "Policies",
      terms: "Terms and conditions",
      returns: "Return policy",
      cookies: "Cookie policy",
      privacy: "Privacy policy",
      legal: "@2026 Kowac, all rights reserved",
    },
    languageSwitcher: {
      label: "Language",
      selectLanguage: "Select language",
    },
    accessibility: {
      mainNavigation: "Main navigation",
      home: "Home",
    },
  },
};

export function getDictionary(language) {
  return dictionaries[language] || dictionaries[defaultLanguage];
}

export function formatMessage(template, replacements = {}) {
  return Object.entries(replacements).reduce((message, [key, value]) => {
    return message.replace(`{${key}}`, String(value));
  }, template);
}
