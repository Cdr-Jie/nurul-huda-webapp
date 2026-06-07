import React, { useState } from "react";
import { authClient } from "../lib/auth-client";

const SettingsManagement = () => {

  const { data: session } = authClient.useSession();
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // --- ACTIONS ---

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    try {
      await authClient.changePassword({
        newPassword: newPassword,
        currentPassword: currentPassword,
        revokeOtherSessions: true 
      }, {
        onSuccess: () => {
          alert("Password successfully updated.");
          setCurrentPassword("");
          setNewPassword("");
        },
        // Added : any here to fix the TypeScript error
        onError: (ctx: any) => alert(ctx.error.message || "Failed to update password.")
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLinkSocial = async (provider: 'google' | 'facebook') => {
    try {
      await authClient.signIn.social({
        provider: provider,
        callbackURL: "/settings",
      });
    } catch (error) {
      console.error(`Failed to link ${provider}:`, error);
    }
  };


  if (!session) {
    return <div className="p-8 text-center text-gray-500">Memuatkan tetapan...</div>;
  }

  return (
    <div className="space-y-6">
      {/* CARD 1: Profile Info (Read-Only Context) */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Maklumat Profil</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
              {session.user.name?.charAt(0).toUpperCase() || session.user.email.charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-gray-900">{session.user.name || "Tiada nama ditetapkan"}</p>
              <p className="text-sm text-gray-500">{session.user.email}</p>
              <p className="text-xs text-gray-400 mt-1">Peranan: <span className="font-medium">{session.user.role === 'superadmin' ? 'Superadmin' : session.user.role === 'admin' ? 'Admin' : session.user.role === 'financeadmin' ? 'Admin Kewangan' : 'Pengguna'}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Security & Passwords */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Keselamatan</h3>
          <p className="text-sm text-gray-500 mt-1">Kemas kini kata laluan atau konfigurasikan pengesahan moden.</p>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Change Password Form */}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Tukar Kata Laluan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kata Laluan Semasa</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kata Laluan Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChangingPassword ? "Mengemas kini..." : "Kemas kini Kata Laluan"}
            </button>
          </form>

          <div className="border-t border-gray-200"></div>

          {/* Passkey Setup */}
          <div>
            <h4 className="text-sm font-medium text-gray-900">Kunci Akses</h4>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Gunakan cap jari, pengimbas wajah, atau kunci skrin peranti anda untuk log masuk dengan selamat tanpa kata laluan.
            </p>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Daftar Kunci Akses Baru
            </button>
          </div>
        </div>
      </div>

      {/* CARD 3: Social Connections */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Akaun Bersambung</h3>
          <p className="text-sm text-gray-500 mt-1">Sambungkan akaun media sosial anda untuk log masuk dengan cepat.</p>
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleLinkSocial('google')}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sambung Google
          </button>

          <button
            onClick={() => handleLinkSocial('facebook')}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
          >
            <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Sambung Facebook
          </button>
        </div>
      </div>

      {/* CARD 4: Danger Zone */}
      <div className="border border-red-300 rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-red-200 bg-red-50">
          <h3 className="text-base font-semibold text-red-800">Zon Bahaya</h3>
        </div>
        <div className="p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Padam Akaun</h4>
            <p className="text-sm text-gray-500 mt-1">
              Buang akaun anda secara kekal dan semua data yang berkaitan. Tindakan ini tidak boleh dibuat asal.
            </p>
          </div>
          <button
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            Padam Akaun
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;