import { useState, useRef, useEffect } from "react";
import { authClient } from "../lib/auth-client";
import { useNavigate, Link } from "react-router-dom";

// Standardize the type based on Better Auth
type UserWithRole = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned?: boolean;
  createdAt: Date | string;
};

export default function UserRow({
  user,
  selfId,
  refetchUsers,
}: Readonly<{
  user: UserWithRole;
  selfId: string;
  refetchUsers: () => void;
}>) {
  const isSelf = user.id === selfId;
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getRoleStyleClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "financeadmin":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "superadmin":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role === "financeadmin" ? "Admin Kewangan" : role || "Pengguna";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-hide feedback toast after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  };

  async function handleImpersonateUser() {
    await authClient.admin.impersonateUser(
      { userId: user.id },
      {
        onError: (error: { error?: { message?: string } }) => showToast('error', error.error?.message || "Gagal menyamar sebagai pengguna."),
        onSuccess: () => {
          setIsMenuOpen(false);
          navigate("/");
        },
      }
    );
  }

  async function handleRevokeSessions() {
    await authClient.admin.revokeUserSessions(
      { userId: user.id },
      {
        onError: (error: { error?: { message?: string } }) => showToast('error', error.error?.message || "Gagal membatalkan sesi pengguna."),
        onSuccess: () => {
          showToast('success', "Semua sesi pengguna telah dibatalkan.");
          setIsMenuOpen(false);
        },
      }
    );
  }

  async function handleUnbanUser() {
    await authClient.admin.unbanUser(
      { userId: user.id },
      {
        onError: (error: { error?: { message?: string } }) => showToast('error', error.error?.message || "Gagal membatalkan larangan (unban)."),
        onSuccess: () => {
          showToast('success', "Akaun pengguna telah diaktifkan semula.");
          refetchUsers();
          setIsMenuOpen(false);
        },
      }
    );
  }

  async function handleBanUser() {
    await authClient.admin.banUser(
      { userId: user.id },
      {
        onError: (error: { error?: { message?: string } }) => showToast('error', error.error?.message || "Gagal mengharamkan pengguna (ban)."),
        onSuccess: () => {
          showToast('success', "Akaun pengguna telah diharamkan.");
          refetchUsers();
          setIsMenuOpen(false);
        },
      }
    );
  }

  async function handleRemoveUser() {
    await authClient.admin.removeUser(
      { userId: user.id },
      {
        onError: (error: { error?: { message?: string } }) => showToast('error', error.error?.message || "Gagal memadam pengguna."),
        onSuccess: () => {
          showToast('success', "Pengguna berjaya dipadamkan.");
          setIsDeleteDialogOpen(false);
          refetchUsers();
        },
      }
    );
  }

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        {/* User Info Column */}
        <td className="px-6 py-4">
          <div>
            <div className="font-medium text-slate-900">{user.name || "Tiada Nama"}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
            <div className="flex items-center gap-2 mt-1.5">
              {user.banned && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                  Diharamkan
                </span>
              )}
              {isSelf && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Anda
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Role Column */}
        <td className="px-6 py-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleStyleClass(user.role)}`}>
            {getRoleDisplayName(user.role)}
          </span>
        </td>

        {/* Date Column */}
        <td className="px-6 py-4 text-sm text-slate-500">
          {new Date(user.createdAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
        </td>

        {/* Actions Column */}
        <td className="px-6 py-4 text-right relative">
          {!isSelf && (
            <div ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>

              {/* Tailwind Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-8 top-10 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10 py-1 text-left">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    Tindakan
                  </div>
                  
                  {/* EDIT BUTTON ADDED HERE */}
                  <Link 
                    to={`/admin/users/${user.id}`}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                  >
                    Sunting Pengguna
                  </Link>

                  <button onClick={handleImpersonateUser} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                    Menyamar (Impersonate)
                  </button>
                  <button onClick={handleRevokeSessions} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                    Batal Sesi Aktif
                  </button>
                  
                  {user.banned ? (
                    <button onClick={handleUnbanUser} className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                      Batal Haram (Unban)
                    </button>
                  ) : (
                    <button onClick={handleBanUser} className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors">
                      Haramkan (Ban)
                    </button>
                  )}
                  
                  <div className="border-t border-slate-100 my-1"></div>
                  
                  <button 
                    onClick={() => {
                      setIsDeleteDialogOpen(true);
                      setIsMenuOpen(false);
                    }} 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors"
                  >
                    Padam Pengguna
                  </button>
                </div>
              )}
            </div>
          )}
        </td>
      </tr>

      {/* Tailwind Modal for Delete Confirmation */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-left animate-in zoom-in-95">
            <h3 className="text-lg font-semibold text-slate-900">Padam Pengguna</h3>
            <p className="mt-2 text-sm text-slate-500">
              Adakah anda pasti mahu memadam akaun <span className="font-semibold text-slate-700">{user.email}</span>? Tindakan ini tidak boleh dipulihkan.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRemoveUser}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Padam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Feedback Toast (Replaces Alerts) */}
      {feedback && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg font-medium text-sm text-white flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in ${
          feedback.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {feedback.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {feedback.message}
        </div>
      )}
    </>
  );
}