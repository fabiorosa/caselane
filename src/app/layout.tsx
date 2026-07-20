import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaseLane | Client request operations",
  description: "Receive, triage, own, and resolve client requests in one operational workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
