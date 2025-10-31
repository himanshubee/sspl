import "./globals.css";

export const metadata = {
  title: "SSPL Season 2026 Registration",
  description: "Official SSPL Season 2026 player registration portal.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
