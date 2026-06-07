import React, { useState, useEffect, useRef } from "react";
import { authClient } from "../lib/auth-client";
import { supabase } from "../supabaseClient";
import { compressImage } from "../utils/imageUpload";
import { CameraIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Biro {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

const FALLBACK = (name: string) =>
  `https://ui-avatars.com/api/?background=dbeafe&color=1e40af&size=128&font-size=0.4&name=${encodeURIComponent(name)}`;

const ROLE_LABELS: Record<string, string> = {
  superadmin:   'Superadmin',
  admin:        'Admin',
  financeadmin: 'Admin Kewangan',
  user:         'Pengguna',
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast = ({ message, type, onClose }: {
  message: string; type: 'success' | 'error'; onClose: () => void;
}) => (
  <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
    type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
  }`}>
    {type === 'success'
      ? <CheckCircleIcon className="w-5 h-5 shrink-0" />
      : <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
    }
    <span className="flex-1">{message}</span>
    <button onClick={onClose} className="opacity-70 hover:opacity-100 shrink-0">✕</button>
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────

const Card = ({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SettingsManagement = () => {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user as any;

  const [biroList, setBiroList]           = useState<Biro[]>([]);
  const [toast, setToast]                 = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  // Profile form
  const [profileForm, setProfileForm]     = useState({ name: '', email: '', phone: '', position: '', biro_id: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [imageFile, setImageFile]         = useState<File | null>(null);
  const [imagePreview, setImagePreview]   = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm]   = useState({ current: '', newPass: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteModal, setDeleteModal]     = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (user) {
      setProfileForm({
        name:     user.name     ?? '',
        email:    user.email    ?? '',
        phone:    user.phone    ?? '',
        position: user.position ?? '',
        biro_id:  user.biro_id  ?? '',
      });
    }
  }, [session]);

  useEffect(() => {
    const fetchBiro = async () => {
      const { data } = await supabase.from('biro').select('id, name').order('name');
      setBiroList(data ?? []);
    };
    fetchBiro();
  }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Image ──────────────────────────────────────────────────────────────────

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageFile(file);
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return user?.image ?? null;
    setImageUploading(true);
    try {
      const compressed = await compressImage(imageFile);
      const ext = imageFile.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error } = await supabase.storage
        .from('user-avatars')
        .upload(path, compressed, { upsert: true });
      if (error) { showToast('Gagal memuat naik gambar profil.', 'error'); return null; }
      return supabase.storage.from('user-avatars').getPublicUrl(path).data.publicUrl;
    } finally {
      setImageUploading(false);
    }
  };

  // ── Save profile ───────────────────────────────────────────────────────────

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { showToast('Nama tidak boleh kosong.', 'error'); return; }
    
    // Optimistic UI update - show changes immediately
    setProfileSaving(true);
    setImageFile(null);
    setImagePreview(null);

    // Start async operations in background
    (async () => {
      try {
        const imageUrl = await handleImageUpload();

        if (profileForm.name !== user.name || (imageUrl && imageUrl !== user.image)) {
          const { error } = await authClient.updateUser({
            name:  profileForm.name.trim(),
            image: imageUrl ?? undefined,
          });
          if (error) { showToast('Gagal mengemaskini nama.', 'error'); setProfileSaving(false); return; }
        }

        const { error: supaErr } = await supabase
          .from('user')
          .update({
            phone:    profileForm.phone.trim()    || null,
            position: profileForm.position.trim() || null,
            biro_id:  profileForm.biro_id         || null,
            ...(imageUrl ? { image: imageUrl } : {}),
          })
          .eq('id', user.id);

        if (supaErr) { showToast('Gagal mengemaskini maklumat.', 'error'); setProfileSaving(false); return; }

        showToast('Profil berjaya dikemaskini.', 'success');
      } catch (err) {
        showToast('Ralat ketika menyimpan profil.', 'error');
      } finally {
        setProfileSaving(false);
      }
    })();
  };

  // ── Change email ───────────────────────────────────────────────────────────

  const handleChangeEmail = async () => {
    if (!profileForm.email.trim() || profileForm.email === user.email) return;
    setProfileSaving(true);
    try {
      const { error } = await authClient.changeEmail({ newEmail: profileForm.email.trim() });
      if (error) showToast(error.message ?? 'Gagal menukar e-mel.', 'error');
      else showToast('E-mel pengesahan dihantar. Sila semak e-mel anda.', 'success');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current || !passwordForm.newPass) {
      showToast('Sila isi semua ruangan kata laluan.', 'error'); return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      showToast('Kata laluan baru tidak sepadan.', 'error'); return;
    }
    if (passwordForm.newPass.length < 8) {
      showToast('Kata laluan baru mestilah sekurang-kurangnya 8 aksara.', 'error'); return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword:     passwordForm.current,
        newPassword:         passwordForm.newPass,
        revokeOtherSessions: true,
      });
      if (error) showToast(error.message ?? 'Gagal menukar kata laluan.', 'error');
      else {
        setPasswordForm({ current: '', newPass: '', confirm: '' });
        showToast('Kata laluan berjaya ditukar.', 'success');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Delete account ─────────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user.email) { showToast('E-mel tidak sepadan.', 'error'); return; }
    setDeleteLoading(true);
    try {
      await authClient.deleteUser();
      window.location.href = '/';
    } catch {
      showToast('Gagal memadam akaun.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isPending) return <div className="p-8 text-center text-gray-400">Memuatkan tetapan...</div>;
  if (!session)  return <div className="p-8 text-center text-gray-500">Sila log masuk untuk melihat tetapan.</div>;

  const currentImage = imagePreview ?? user?.image ?? FALLBACK(user?.name ?? 'U');
  const biro = biroList.find(b => b.id === (profileForm.biro_id || user?.biro_id));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto px-4 space-y-5 pb-20">

      {/* ── Card 1: Avatar + identity ────────────────────────────────────────── */}
      <form onSubmit={handleSaveProfile}>
        <Card title="Maklumat Profil" subtitle="Nama, gambar dan maklumat peribadi anda">
          <div className="space-y-5">

            {/* Avatar row */}
            <div className="flex flex-col items-center gap-4 pb-5 border-b border-gray-100">
              {/* Avatar with camera button */}
              <div className="relative">
                <img
                  src={currentImage}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Identity info — its own div */}
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 leading-tight">{user.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                    {ROLE_LABELS[user.role ?? 'user'] ?? user.role}
                  </span>
                  {biro && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                      {biro.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Image selected notice */}
            {imageFile && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircleIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700">
                  Gambar baru dipilih — klik "Simpan Profil" untuk memuat naik.
                </p>
              </div>
            )}

            {/* Form fields */}
            <Field label="Nama Penuh">
              <input
                className={inputCls}
                placeholder="cth. Ahmad bin Ali"
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombor Telefon">
                <input
                  className={inputCls}
                  placeholder="+60 12 345 6789"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                />
              </Field>
              <Field label="Jawatan">
                <input
                  className={inputCls}
                  placeholder="cth. Setiausaha"
                  value={profileForm.position}
                  onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))}
                />
              </Field>
            </div>

            <Field label="Biro">
              <select
                className={inputCls}
                value={profileForm.biro_id}
                onChange={e => setProfileForm(f => ({ ...f, biro_id: e.target.value }))}
              >
                <option value="">— Tiada Biro —</option>
                {biroList.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>

            <button
              type="submit"
              disabled={profileSaving || imageUploading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {profileSaving || imageUploading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </Card>
      </form>

      {/* ── Card 2: Email ────────────────────────────────────────────────────── */}
      <Card title="Alamat E-mel" subtitle="Tukar e-mel — e-mel pengesahan akan dihantar">
        <div className="space-y-4">
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500 mb-0.5">E-mel semasa</p>
            <p className="text-sm font-semibold text-gray-800">{user.email}</p>
          </div>
          <Field label="E-mel Baharu">
            <input
              type="email"
              className={inputCls}
              placeholder="contoh@email.com"
              value={profileForm.email === user.email ? '' : profileForm.email}
              onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <button
            type="button"
            disabled={profileSaving || !profileForm.email.trim() || profileForm.email === user.email}
            onClick={handleChangeEmail}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
          >
            Hantar E-mel Pengesahan
          </button>
        </div>
      </Card>

      {/* ── Card 3: Password ─────────────────────────────────────────────────── */}
      <form onSubmit={handleChangePassword}>
        <Card title="Kata Laluan" subtitle="Tukar kata laluan akaun anda">
          <div className="space-y-4">
            <Field label="Kata Laluan Semasa">
              <input
                type={showPasswords ? 'text' : 'password'}
                className={inputCls}
                placeholder="••••••••"
                value={passwordForm.current}
                onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))}
              />
            </Field>

            <Field label="Kata Laluan Baru">
              <input
                type={showPasswords ? 'text' : 'password'}
                className={inputCls}
                placeholder="Min. 8 aksara"
                value={passwordForm.newPass}
                onChange={e => setPasswordForm(f => ({ ...f, newPass: e.target.value }))}
              />
            </Field>

            <Field label="Sahkan Kata Laluan Baru">
              <input
                type={showPasswords ? 'text' : 'password'}
                className={inputCls}
                placeholder="Taip semula"
                value={passwordForm.confirm}
                onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
              />
            </Field>

            {/* Password strength */}
            {passwordForm.newPass && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[
                    passwordForm.newPass.length >= 8,
                    /[A-Z]/.test(passwordForm.newPass),
                    /[0-9]/.test(passwordForm.newPass),
                    /[^A-Za-z0-9]/.test(passwordForm.newPass),
                  ].map((met, i) => (
                    <div key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${met ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {[
                    passwordForm.newPass.length >= 8 ? null : 'min. 8 aksara',
                    /[A-Z]/.test(passwordForm.newPass) ? null : 'huruf besar',
                    /[0-9]/.test(passwordForm.newPass) ? null : 'nombor',
                    /[^A-Za-z0-9]/.test(passwordForm.newPass) ? null : 'simbol',
                  ].filter(Boolean).join(' · ') || '✓ Kata laluan kukuh'}
                </p>
              </div>
            )}

            {/* Mismatch warning */}
            {passwordForm.confirm && passwordForm.newPass !== passwordForm.confirm && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                Kata laluan tidak sepadan.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="submit"
                disabled={passwordSaving}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {passwordSaving ? 'Mengemas kini...' : 'Kemas Kini Kata Laluan'}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswords(s => !s)}
                className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                {showPasswords ? 'Sembunyi' : 'Papar'}
              </button>
            </div>
          </div>
        </Card>
      </form>

      {/* ── Card 4: Danger zone ──────────────────────────────────────────────── */}
      <div className="border border-red-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-red-100 bg-red-50">
          <h3 className="text-base font-bold text-red-800">Zon Bahaya</h3>
        </div>
        <div className="p-5 bg-white">
          <p className="text-sm text-gray-600 mb-4">
            Buang akaun anda secara kekal. Tindakan ini tidak boleh dibuat asal.
          </p>
          <button
            onClick={() => setDeleteModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition"
          >
            Padam Akaun
          </button>
        </div>
      </div>

      {/* ── Delete confirmation modal ─────────────────────────────────────────── */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <ExclamationTriangleIcon className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold">Padam Akaun?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Tindakan ini tidak boleh dibatalkan. Taip e-mel anda untuk mengesahkan:
            </p>
            <p className="text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3 text-gray-700 break-all">
              {user.email}
            </p>
            <input
              className={inputCls}
              placeholder="Taip e-mel anda"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setDeleteModal(false); setDeleteConfirm(''); }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== user.email || deleteLoading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 text-sm"
              >
                {deleteLoading ? 'Memadamkan...' : 'Ya, Padam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default SettingsManagement;