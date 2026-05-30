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
  title: "CineMind AI — Stop Scrolling, Start Watching",
  description: "Discover your next favorite movie with CineMind AI. Deep neural-collaborative filtering movie recommendations personalized to your unique taste, mood, and aesthetic preferences.",
  keywords: ["AI Movie Recommendations", "Movie Discovery", "CineMind", "Film Matching", "Personalized Cinema", "Neural Collaborative Filtering"],
  authors: [{ name: "CineMind Tech Team" }],
  openGraph: {
    title: "CineMind AI — Stop Scrolling, Start Watching",
    description: "Deep neural-collaborative filtering movie recommendations personalized to your unique taste and aesthetic preferences.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
