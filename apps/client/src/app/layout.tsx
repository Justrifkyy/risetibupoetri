import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "./components/Navbar";
import "./globals.css";

// 1. IMPORT LIBRARY TOAST
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manajemen Jadwal",
  description: "Dibuat dengan arsitektur Microservice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>

          {/* 2. TAMBAHKAN WADAH TOAST DI SINI */}
          {/* Ini akan menangani semua notifikasi di aplikasi Anda */}
          <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
        </AuthProvider>
      </body>
    </html>
  );
}
