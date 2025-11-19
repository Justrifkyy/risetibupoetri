"use client";

import { useState } from "react";
import axios, { isAxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:4000/auth/login", {
        email,
        password,
      });

      const token = response.data.token;
      login(token); // Gunakan fungsi login dari context

      toast.success("Login berhasil! Mengarahkan ke dasbor...");
      router.push("/schedules"); // Arahkan ke halaman jadwal
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Login gagal. Silakan coba lagi.");
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Sign In</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email-login" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email-login"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="password-login" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              {/* == LINK BARU DITAMBAHKAN DI SINI == */}
              <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Lupa password?
              </Link>
            </div>
            <input
              id="password-login"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Login
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
