import { Oswald, Barlow_Semi_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "BF2 Log",
  description: "Battlefield 2 weekly game night map progression tracker",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${barlow.variable} ${plexMono.variable}`}
    >
      <body>
        {children}
        <footer className="site-footer">
          Battlefield 2 &mdash; DICE, 2005 &middot; coop map log
        </footer>
      </body>
    </html>
  );
}
