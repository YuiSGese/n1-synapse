import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // <--- Import Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "N1 Synapse",
  description: "Ứng dụng học tiếng Nhật N1 tối ưu hóa tư duy liên kết.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster /> 
      </body>
    </html>
  );
}