import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-script",
  display: "swap",
});

const SITE_URL = "https://artesemaroma.konnexy.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Essências e materiais para velas em Suzano | Artes em Aroma",
    template: "%s | Artes em Aroma",
  },
  description:
    "Loja Artes em Aroma em Suzano: essências, ceras, bases e materiais para velas, sabonetes e aromatizadores. Conheça a loja e consulte a disponibilidade.",
  icons: {
    icon: [
      { url: "/favicon.jpg", type: "image/jpeg" },
      { url: "/images/logo-artes-em-aroma.jpg", type: "image/jpeg" },
    ],
    shortcut: "/favicon.jpg",
    apple: "/images/logo-artes-em-aroma.jpg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Loja Artes em Aroma",
    title: "Artes em Aroma | Matéria-Prima para Sabonetes e Velas em Suzano - SP",
    description:
      "Essências, bases, ceras e matérias-primas para dar vida às suas criações de velas aromáticas, sabonetes e perfumaria artesanal em Suzano/SP.",
    images: [
      {
        url: "/images/logo-artes-em-aroma.jpg",
        width: 800,
        height: 800,
        alt: "Logo Oficial Loja Artes em Aroma — Matéria Prima para Sabonetes e Velas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Artes em Aroma | Essências e Matérias-Primas em Suzano/SP",
    description:
      "Essências, bases, ceras e matérias-primas para dar vida às suas criações.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${dmSans.variable} ${caveat.variable}`}
    >
      <body className="min-h-screen bg-brancoQuente font-sans text-marrom antialiased">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
