import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Background } from "@/components/layout/Background";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export const metadata: Metadata = {
  title: "SIMOUX",
  description: "Tableau de bord modulaire — shell glassmorphism.",
};

export const viewport: Viewport = {
  themeColor: "#e8edf5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        {/* Fixed blurred orbs behind everything. */}
        <Background />

        {/* Fixed glass navigation rail. */}
        <Sidebar />

        {/* Content area — offset to clear the fixed sidebar.
            Widths: 5.5rem on mobile (icon rail), 16.5rem from md (full rail). */}
        <div className="min-h-screen py-3 pl-[5.5rem] pr-3 md:pl-[16.5rem]">
          <Topbar />
          <main className="mt-3">{children}</main>
        </div>
      </body>
    </html>
  );
}
