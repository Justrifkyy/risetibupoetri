"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string; // Ambil token dari URL

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Password tidak cocok!");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal harus 6 karakter.");
      return;
    }

    try {
      // Kirim token dan password baru ke backend
      const response = await axios.post("http://localhost:4000/auth/reset-password", {
        token: token,
        password: password,
      });

      toast.success(response.data.message);
      // Arahkan ke halaman login setelah sukses
      router.push("/login");
    } catch (err: any) {
      const message = err.response?.data?.message || "Gagal mereset password.";
      toast.error(message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Reset Password Anda</h1>
        <p className="text-center text-sm text-gray-600">Masukkan password baru Anda di bawah ini.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Password Baru</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm text-black" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm text-black" />
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Simpan Password Baru
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
