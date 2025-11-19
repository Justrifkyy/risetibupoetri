"use client";

import { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { X } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  role: "ORGANIZER" | "PARTICIPANT";
}

interface InviteModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  scheduleId: number;
  scheduleTitle: string;
}

if (typeof window !== "undefined") {
  Modal.setAppElement("body");
}

export default function InviteModal({ isOpen, onRequestClose, scheduleId, scheduleTitle }: InviteModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitedUserIds, setInvitedUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        const token = localStorage.getItem("token");
        try {
          setLoading(true);
          const response = await axios.get("http://localhost:4000/auth/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsers(response.data);
          setError("");
        } catch (_err) {
          setError("Gagal memuat daftar pengguna.");
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const handleInvite = async (userIdToInvite: number) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://localhost:4000/attendances/invite", { schedule_id: scheduleId, user_id_to_invite: userIdToInvite }, { headers: { Authorization: `Bearer ${token}` } });
      setInvitedUserIds((prev) => new Set(prev).add(userIdToInvite));
    } catch (_err) {
      alert("Gagal mengirim undangan. Pengguna mungkin sudah diundang.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Invite Users Modal"
      className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl mx-auto my-16 outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Undang Peserta</h2>
          <p className="text-slate-600 mt-1">
            Untuk Jadwal: <strong className="text-indigo-600">{scheduleTitle}</strong>
          </p>
        </div>
        <button
          onClick={onRequestClose}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100"
          aria-label="Tutup modal" // Perbaikan untuk aksesibilitas
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto pr-2">
        {loading && <p className="text-slate-500 text-center">Loading users...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}
        {!loading && users.length === 0 && <p className="text-slate-500 text-center">Tidak ada pengguna (Organizer/Participant) untuk diundang.</p>}

        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-900">
                <span className="font-semibold">{user.username}</span>
                <span className="block text-sm text-slate-500">
                  {user.email} - <span className="font-medium capitalize">{user.role.toLowerCase()}</span>
                </span>
              </div>
              <button
                onClick={() => handleInvite(user.id)}
                disabled={invitedUserIds.has(user.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${invitedUserIds.has(user.id) ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-green-500 text-white hover:bg-green-600"}`}
              >
                {invitedUserIds.has(user.id) ? "Terkirim" : "Undang"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
