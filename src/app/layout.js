import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "BoksiLoki",
  description: "AI-WOD-generaattori, treenilogi ja kehitysraportit CrossFit-urheilijoille",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/favicon-32.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#1F2421",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
