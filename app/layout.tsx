import type { Metadata, Viewport } from "next";
import { Orbitron, Exo_2 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "WP_MNGR — Gérez WordPress avec l'IA",
    template: "%s | WP_MNGR",
  },
  description:
    "Gérez vos sites WordPress et WooCommerce grâce à l'intelligence artificielle. Installez des plugins, créez du contenu, configurez WooCommerce — en quelques secondes.",
  keywords: [
    "WordPress",
    "WooCommerce",
    "IA",
    "Intelligence Artificielle",
    "Gestion WordPress",
    "Automatisation",
    "Claude",
    "Agent IA",
  ],
  authors: [{ name: "WP_MNGR" }],
  creator: "WP_MNGR",
  // Open Graph
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "WP_MNGR",
    title: "WP_MNGR — Gérez WordPress avec l'IA",
    description:
      "Gérez vos sites WordPress et WooCommerce grâce à l'intelligence artificielle. Installez des plugins, créez du contenu, configurez WooCommerce — en quelques secondes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WP_MNGR — Gestion WordPress par IA",
      },
    ],
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "WP_MNGR — Gérez WordPress avec l'IA",
    description:
      "Gérez vos sites WordPress et WooCommerce grâce à l'intelligence artificielle.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WP_MNGR",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1d4ed8" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Priority Hints — ressources critiques */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${orbitron.variable} ${exo2.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
