"use client";

import { useState } from "react";
import axios, { isAxiosError } from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(""); // Tambahan input nomor telepon
  const [role, setRole] = useState("PARTICIPANT");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:4000/auth/register", {
        username,
        email,
        password,
        phone, // kirim phone ke backend
        role,
      });
      toast.success(response.data.message + " Silakan login.");
      router.push("/login");
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Registrasi gagal. Silakan coba lagi.");
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Buat Akun Baru</h1>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>

          {/* Nomor Telepon */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              No. Telepon (Format: 628...)
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="628123456789"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>

          {/* Pilihan Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Daftar sebagai</label>
            <div className="mt-2 flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input type="radio" name="role" value="PARTICIPANT" checked={role === "PARTICIPANT"} onChange={(e) => setRole(e.target.value)} className="form-radio text-indigo-600" />
                <span className="ml-2 text-gray-800">Participant</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" name="role" value="ORGANIZER" checked={role === "ORGANIZER"} onChange={(e) => setRole(e.target.value)} className="form-radio text-indigo-600" />
                <span className="ml-2 text-gray-800">Organizer</span>
              </label>
            </div>
          </div>

          {/* Tombol Submit */}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 
                         border border-transparent rounded-md shadow-sm hover:bg-indigo-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register
            </button>
          </div>
        </form>

        {/* Link Login dan Lupa Password */}
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Login
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
              Lupa password?
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
