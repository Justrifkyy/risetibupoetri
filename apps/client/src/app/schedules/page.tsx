"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import Select from "react-select";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Calendar,
  FileText,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MapPin, // <-- Icon baru
} from "lucide-react";

/* ============================
   Interfaces & Types
   ============================ */
interface Schedule {
  id: number;
  title: string;
  description: string;
  schedule_time: string;
  location?: string; // <-- Tambahan field lokasi
}

interface UserOption {
  value: number;
  label: string;
  role: string;
}

type InviteType = "GLOBAL" | "ORGANIZER_ONLY" | "PARTICIPANT_ONLY" | "SPECIFIC";

/* ============================
   InviteModal (inline)
   ============================ */
interface InviteModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  scheduleId: number;
  scheduleTitle: string;
  userList: UserOption[];
  refreshSchedules: () => void;
}

function InviteModal({ isOpen, onRequestClose, scheduleId, scheduleTitle, userList, refreshSchedules }: InviteModalProps) {
  const [inviteType, setInviteType] = useState<InviteType>("GLOBAL");
  const [selectedUsers, setSelectedUsers] = useState<readonly UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // reset setiap kali modal dibuka
    if (!isOpen) {
      setInviteType("GLOBAL");
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const handleSendInvites = async () => {
    if (!scheduleId) {
      toast.error("Jadwal tidak valid.");
      return;
    }

    let invitedUserIds: number[] = [];
    if (inviteType === "GLOBAL") {
      invitedUserIds = userList.map((u) => u.value);
    } else if (inviteType === "ORGANIZER_ONLY") {
      invitedUserIds = userList.filter((u) => u.role === "ORGANIZER").map((u) => u.value);
    } else if (inviteType === "PARTICIPANT_ONLY") {
      invitedUserIds = userList.filter((u) => u.role === "PARTICIPANT").map((u) => u.value);
    } else if (inviteType === "SPECIFIC") {
      invitedUserIds = selectedUsers.map((u) => u.value);
    }

    if (invitedUserIds.length === 0) {
      toast.warn("Pilih setidaknya satu peserta untuk diundang.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:4000/attendances/invite-batch",
        { schedule_id: scheduleId, user_ids: invitedUserIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Undangan terkirim!");
      refreshSchedules();
      onRequestClose();
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirim undangan.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div aria-modal role="dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => onRequestClose()} />
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Undang Peserta — {scheduleTitle}</h3>
            <p className="text-sm text-slate-500 mt-1">Pilih target undangan untuk jadwal ini.</p>
          </div>
          <button onClick={() => onRequestClose()} className="text-slate-400 hover:text-slate-600" aria-label="Tutup modal">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Undangan</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(
              [
                ["GLOBAL", "SEMUA"],
                ["ORGANIZER_ONLY", "DOSEN"],
                ["PARTICIPANT_ONLY", "USER"],
                ["SPECIFIC", "ORANG"],
              ] as [InviteType, string][]
            ).map(([type, label]) => (
              <label
                key={type}
                className={`block p-3 border rounded-lg text-center cursor-pointer transition ${
                  inviteType === type ? "bg-indigo-100 border-indigo-400 text-indigo-700 font-semibold" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <input type="radio" name="inviteType" value={type} checked={inviteType === type} onChange={(e) => setInviteType(e.target.value as InviteType)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </div>

        {inviteType === "SPECIFIC" && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Peserta</label>
            <Select instanceId="invite-modal-select" isMulti options={userList} value={selectedUsers} onChange={(v) => setSelectedUsers(v)} placeholder="Cari atau pilih peserta..." className="text-slate-900" />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => onRequestClose()} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            Batal
          </button>
          <button onClick={handleSendInvites} disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            {loading ? "Mengirim..." : "Kirim Undangan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================
   Main Page Component
   ============================ */
export default function SchedulesPage() {
  const { user } = useAuth();
  const router = useRouter();

  // schedules & form
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [location, setLocation] = useState(""); // <-- State baru
  const [error, setError] = useState("");

  // users & invite controls
  const [userList, setUserList] = useState<UserOption[]>([]);
  const [inviteType, setInviteType] = useState<InviteType>("GLOBAL");
  const [selectedUsers, setSelectedUsers] = useState<readonly UserOption[]>([]);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number>(0);
  const [selectedScheduleTitle, setSelectedScheduleTitle] = useState<string>("");

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ----------------------------
     Fetch Functions
     ---------------------------- */
  const fetchSchedules = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      if (!token) router.push("/login");
      return;
    }
    try {
      let response;
      if (user.role === "ADMIN") {
        response = await axios.get("http://localhost:4000/schedules", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await axios.get("http://localhost:4000/attendances/my-schedules", { headers: { Authorization: `Bearer ${token}` } });
      }
      setSchedules(response.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data jadwal.");
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router, user]);

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await axios.get("http://localhost:4000/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const options = response.data.map((u: any) => ({
        value: u.id,
        label: `${u.username} (${u.email})`,
        role: u.role,
      }));
      setUserList(options);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat daftar pengguna.");
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    if (user?.role === "ADMIN") fetchUsers();
  }, [fetchSchedules, fetchUsers, user]);

  /* ----------------------------
     Pagination Logic
     ---------------------------- */
  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchedules = schedules.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [schedules.length, currentPage, totalPages]);

  /* ----------------------------
     Handlers: Create, Delete, Attendance, Export
     ---------------------------- */
  const handleCreateScheduleAndInvite = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Token tidak ditemukan. Silakan login ulang.");
      router.push("/login");
      return;
    }

    const formattedTime = scheduleTime.replace("T", " ") + ":00";

    let invitedUserIds: number[] = [];
    if (inviteType === "GLOBAL") {
      invitedUserIds = userList.map((u) => u.value);
    } else if (inviteType === "ORGANIZER_ONLY") {
      invitedUserIds = userList.filter((u) => u.role === "ORGANIZER").map((u) => u.value);
    } else if (inviteType === "PARTICIPANT_ONLY") {
      invitedUserIds = userList.filter((u) => u.role === "PARTICIPANT").map((u) => u.value);
    } else if (inviteType === "SPECIFIC") {
      invitedUserIds = selectedUsers.map((u) => u.value);
    }

    if (invitedUserIds.length === 0) {
      toast.warn("Anda harus memilih setidaknya satu peserta untuk diundang.");
      return;
    }

    try {
      const scheduleResponse = await axios.post("http://localhost:4000/schedules", { title, description, schedule_time: formattedTime, location }, { headers: { Authorization: `Bearer ${token}` } });
      const newScheduleId = scheduleResponse.data.scheduleId;

      await axios.post(
        "http://localhost:4000/attendances/invite-batch",
        {
          schedule_id: newScheduleId,
          user_ids: invitedUserIds,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Jadwal dibuat & undangan terkirim!");
      setTitle("");
      setDescription("");
      setScheduleTime("");
      setLocation("");
      setSelectedUsers([]);
      setInviteType("GLOBAL");
      fetchSchedules();
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat jadwal atau mengirim undangan.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:4000/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Jadwal berhasil dihapus.");
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus jadwal.");
    }
  };

  const handleAttendance = async (scheduleId: number, status: "ATTENDING" | "NOT_ATTENDING" | "COMPLETED" | "MISSED") => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post("http://localhost:4000/attendances", { schedule_id: scheduleId, status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(response.data.message || "Status kehadiran diperbarui!");
      fetchSchedules();
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || "Gagal memperbarui status.";
      toast.error(message);
    }
  };

  const handleExport = async (scheduleId: number, title: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`http://localhost:4000/attendances/report/${scheduleId}`, { headers: { Authorization: `Bearer ${token}` } });

      if (!response.data || response.data.length === 0) {
        toast.warn("Tidak ada data kehadiran untuk diekspor.");
        return;
      }

      const csv = Papa.unparse(response.data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `Laporan-Kehadiran-${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Laporan berhasil diunduh.");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengekspor laporan.");
    }
  };

  const openInviteModal = (schedule: Schedule) => {
    setSelectedScheduleId(schedule.id);
    setSelectedScheduleTitle(schedule.title);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{user?.role === "ADMIN" ? "Schedules Management" : "My Schedules"}</h1>
          <p className="text-slate-600">{user?.role === "ADMIN" ? "Kelola, buat, dan undang peserta ke jadwal." : "Lihat jadwal yang Anda diundang."}</p>
        </div>

        {user?.role === "ADMIN" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Plus className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Buat Jadwal Baru</h2>
            </div>

            <form onSubmit={handleCreateScheduleAndInvite} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Judul Jadwal</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Masukkan judul jadwal"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Deskripsi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masukkan deskripsi jadwal"
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Waktu Jadwal</label>
                <input
                  placeholder="waktu"
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Tambahan lokasi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Lokasi</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Masukkan lokasi acara (opsional)"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Jenis undangan */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Undangan</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(
                    [
                      ["GLOBAL", "SEMUA"],
                      ["ORGANIZER_ONLY", "DOSEN"],
                      ["PARTICIPANT_ONLY", "USER"],
                      ["SPECIFIC", "ORANG"],
                    ] as [InviteType, string][]
                  ).map(([type, label]) => (
                    <label
                      key={type}
                      className={`block p-3 border rounded-lg text-center cursor-pointer transition ${
                        inviteType === type ? "bg-indigo-100 border-indigo-400 text-indigo-700 font-semibold" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <input type="radio" name="inviteType" value={type} checked={inviteType === type} onChange={(e) => setInviteType(e.target.value as InviteType)} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {inviteType === "SPECIFIC" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Peserta Tertentu</label>
                  <Select instanceId="create-schedule-select" isMulti options={userList} value={selectedUsers} onChange={(v) => setSelectedUsers(v)} placeholder="Cari atau pilih peserta..." className="text-slate-900" />
                </div>
              )}

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex justify-end">
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Tambah Jadwal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* === Daftar Jadwal === */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-sky-100 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-sky-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Daftar Jadwal</h2>
          </div>

          {currentSchedules.length === 0 ? (
            <p className="text-slate-600">Belum ada jadwal yang tersedia.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Judul</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Lokasi</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSchedules.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{s.title}</td>
                      <td className="py-3 px-4 text-slate-700">{s.description}</td>
                      <td className="py-3 px-4 text-slate-700">{new Date(s.schedule_time).toLocaleString("id-ID")}</td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          {s.location || "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          {user?.role === "ADMIN" ? (
                            <>
                              <button onClick={() => openInviteModal(s)} className="p-2 rounded-lg bg-sky-100 text-sky-600 hover:bg-sky-200 transition" title="Undang Peserta">
                                <UserPlus className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleExport(s.id, s.title)} className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition" title="Export Laporan">
                                <Download className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition" title="Hapus Jadwal">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleAttendance(s.id, "ATTENDING")} className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition" title="Hadir">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleAttendance(s.id, "NOT_ATTENDING")} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition" title="Tidak Hadir">
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleAttendance(s.id, "COMPLETED")} className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition" title="Selesai">
                                <Clock className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* === Pagination === */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg border ${currentPage === 1 ? "border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-100"} flex items-center gap-1`}
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>

              <span className="text-slate-600">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg border ${currentPage === totalPages ? "border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-100"} flex items-center gap-1`}
              >
                Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === Modal Undangan === */}
      <InviteModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} scheduleId={selectedScheduleId} scheduleTitle={selectedScheduleTitle} userList={userList} refreshSchedules={fetchSchedules} />
    </main>
  );
}
