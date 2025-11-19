"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  // Jika user sudah login, arahkan ke schedules
  if (user) {
    router.push("/schedules");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:4000/auth/forgot-password", { email });
      toast.success(response.data.message);
      setEmail("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengirim email reset.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Lupa Password Anda?</h1>
        <p className="text-center text-sm text-gray-600">Jangan khawatir. Masukkan email Anda di bawah ini dan kami akan mengirimkan link untuk mereset password Anda.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Alamat Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Kirim Link Reset
            </button>
          </div>
        </form>
        <div className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </main>
  );
}
