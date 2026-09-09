import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DemoModeBanner } from "@/components/shell/DemoModeBanner";
import { Providers } from "@/components/shell/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NIRNAY — National Decision Support & Monitoring Engine",
  description:
    "NIRNAY is the centralized monitoring & decision intelligence platform connecting Central Command Directorate, Audit Squad, Agency Portal, State District Authorities, and System Admins.",
  keywords: ["NIRNAY", "DoSJE", "inspection", "NGO monitoring", "government", "surveillance", "GIS"],
  authors: [{ name: "Department of Social Justice & Empowerment" }],
  robots: "noindex, nofollow",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "NIRNAY — National Decision Support Engine",
    description: "National Monitoring & Decision Support Engine",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus:bg-white focus:text-black focus:shadow-md focus:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          Skip to main content
        </a>
        <Providers>
          <DemoModeBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
