import "./globals.css";

export const metadata = {
  title: "BoxLog",
  description: "AI-WOD-generaattori, treenilogi ja kehitysraportit CrossFit-urheilijoille",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  );
}
