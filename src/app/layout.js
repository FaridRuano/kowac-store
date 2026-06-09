import { Montserrat } from "next/font/google";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

import "@/app/globals.scss";

const displayFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const bodyFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Kowac Store",
  description: "Tienda online de Kowac para moda y calzado.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <LanguageProvider>
          <div className="site-shell">
            <Header />
            <main className="site-main">{children}</main>
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
