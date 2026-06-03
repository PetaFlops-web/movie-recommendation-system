import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SmartMovie — Sistem Rekomendasi Film Cerdas",
  description: "Temukan film favoritmu dengan sistem rekomendasi berbasis Content-Based Filtering. Analisis kemiripan genre, aktor, sutradara, dan sinopsis untuk rekomendasi yang akurat.",
  keywords: ["Rekomendasi Film", "Content-Based Filtering", "Movie Recommendation", "SmartMovie", "Film Indonesia", "Sistem Rekomendasi"],
  authors: [{ name: "SmartMovie Team" }],
  openGraph: {
    title: "SmartMovie — Sistem Rekomendasi Film Cerdas",
    description: "Temukan film favoritmu dengan sistem rekomendasi berbasis Content-Based Filtering. Rekomendasi akurat berdasarkan kemiripan konten.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
