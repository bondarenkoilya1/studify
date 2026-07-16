import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Header } from "@/shared/ui/header";
import { ReactNode } from "react";
import { getMe } from "@/shared/api/server";

export const metadata: Metadata = {
  title: "Studify",
  description: "Web-app to track uni projects",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getMe();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-studify-canvas">
        <Header user={user} />
        <Providers user={user}>{children}</Providers>
      </body>
    </html>
  );
}
