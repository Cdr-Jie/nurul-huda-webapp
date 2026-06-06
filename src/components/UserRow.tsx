import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { supabase } from "../supabaseClient";
import {
  PencilSquareIcon, TrashIcon, NoSymbolIcon,
  CheckCircleIcon, XMarkIcon
} from "@heroicons/react/24/outline";
import type { Biro } from "./UserManagement";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserWithRole = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned?: boolean;
  banned_reason?: string | null;
  emailVerified?: boolean;
  createdAt: Date | string;
  biro_id?: string | null;
  position?: string | null;
  phone?: string | null;
};

const ROLES = ['user', 'admin', 'financeadmin', 'superadmin'];

const ROLE_LABELS: Record<string, string> = {
  user:        'Pengguna',
  admin:       'Admin',
  financeadmin:'Admin Kewangan',
  superadmin:  'Superadmin',
};

const roleBadgeCls = (role: string) => {
  switch (role) {
    case 'superadmin':  return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'admin':       return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'financeadmin':return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:            return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserRow({
  user,
  selfId,
  biroList,
  refetchUsers,
  canEdit,
}: Readonly<{
  user: UserWithRole;
  selfId: string;
  biroList: Biro[];
  refetchUsers: () => void;
  canEdit: boolean;
}>) {
  const isSelf = user.id === selfId;

  const [isEditOpen, setIsEditOpen]         = useState(false);
  const [isDeleteOpen, setIsDeleteOpen]     = useState(false);
  const [isBanOpen, setIsBanOpen]           = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [formError, setFormError]           = useState<string | null>(null);
  const [banReason, setBanReason]           = useState('');

  // Edit form state
  const [editName, setEditName]         = useState(user.name ?? '');
  const [editRole, setEditRole]         = useState(user.role ?? 'user');
  const [editBiroId, setEditBiroId]     = useState(user.biro_id ?? '');
  const [editPosition, setEditPosition] = useState(user.position ?? '');
  const [editPhone, setEditPhone]       = useState(user.phone ?? '');

  const biroName = biroList.find(b => b.id === user.biro_id)?.name ?? '—';

  const openEdit = () => {
    setEditName(user.name ?? '');
    setEditRole(user.role ?? 'user');
    setEditBiroId(user.biro_id ?? '');
    setEditPosition(user.position ?? '');
    setEditPhone(user.phone ?? '');
    setFormError(null);
    setIsEditOpen(true);
  };

  // ── Save edit ─────────────────────────────────────────────────────────────

  const handleSaveEdit = async () => {
    if (!editName.trim()) { setFormError('Nama diperlukan.'); return; }
    setSaving(true); setFormError(null);
    try {
      // Update role via Better Auth admin
      if (editRole !== user.role) {
        const { error } = await authClient.admin.setRole({
          userId: user.id,
          role: editRole as "user" | "admin" | "financeadmin" | "superadmin",
//          role: editRole,
        });
        if (error) throw new Error(error.message);
      }

      // Update extra fields via Supabase
      const { error: supaErr } = await supabase
        .from('user')
        .update({
          name:     editName.trim(),
          biro_id:  editBiroId || null,
          position: editPosition.trim() || null,
          phone:    editPhone.trim() || null,
        })
        .eq('id', user.id);
      if (supaErr) throw new Error(supaErr.message);

      setIsEditOpen(false);
      refetchUsers();
    } catch (e: any) {
      setFormError(e.message ?? 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  // ── Ban / Unban ───────────────────────────────────────────────────────────

  const handleBanToggle = async () => {
    setSaving(true);
    try {
      if (user.banned) {
        await authClient.admin.unbanUser({ userId: user.id });
      } else {
        await authClient.admin.banUser({
          userId: user.id,
          banReason: banReason.trim() || undefined,
        });
      }
      setIsBanOpen(false);
      refetchUsers();
    } catch (e: any) {
      alert(e.message ?? 'Gagal.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setSaving(true);
    try {
      await authClient.admin.removeUser({ userId: user.id });
      setIsDeleteOpen(false);
      refetchUsers();
    } catch (e: any) {
      alert(e.message ?? 'Gagal memadam pengguna.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render row ────────────────────────────────────────────────────────────

  return (
    <>
      <tr className={`hover:bg-gray-50 transition-colors ${user.banned ? 'opacity-60' : ''}`}>

        {/* User info */}
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{user.name || 'Tiada Nama'}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {user.banned && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Disekat</span>
            )}
            {user.emailVerified === false && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Belum Disahkan</span>
            )}
            {isSelf && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Anda</span>
            )}
            {/* Mobile: show role inline */}
            <span className={`sm:hidden px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadgeCls(user.role)}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </td>

        {/* Role */}
        <td className="px-4 py-3 text-center hidden sm:table-cell">
          <div className="flex justify-center">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadgeCls(user.role)}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </td>

        {/* Biro */}
        <td className="px-4 py-3 text-center text-sm text-gray-600 hidden md:table-cell">
          {biroName}
        </td>

        {/* Jawatan */}
        <td className="px-4 py-3 text-center text-sm text-gray-600 hidden md:table-cell">
          {user.position ?? '—'}
        </td>

        {/* Date */}
        <td className="px-4 py-3 text-center text-sm text-gray-500 hidden lg:table-cell">
          {new Date(user.createdAt).toLocaleDateString('ms-MY')}
        </td>

        {/* Actions - Exposed Inline Actions */}
        <td className="px-4 py-3 text-center">
          {!isSelf && canEdit ? (
            <div className="flex items-center justify-center gap-3">
              {/* Edit Button */}
              <button 
                onClick={openEdit}
                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                title="Edit Maklumat"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>

              {/* Sekat / Nyahsekat Button */}
              <button 
                onClick={() => { setIsBanOpen(true); setBanReason(''); }}
                className={`p-1.5 rounded-md transition-colors ${
                  user.banned 
                    ? 'text-green-600 hover:text-green-900 hover:bg-green-50' 
                    : 'text-amber-600 hover:text-amber-900 hover:bg-amber-50'
                }`}
                title={user.banned ? "Nyahsekat" : "Sekat Pengguna"}
              >
                {user.banned ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <NoSymbolIcon className="w-5 h-5" />
                )}
              </button>

              {/* Padam Button */}
              <button 
                onClick={() => setIsDeleteOpen(true)}
                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                title="Padam Pengguna"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">—</span>
          )}
        </td>
      </tr>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {isEditOpen && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
              <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92dvh] flex flex-col overflow-x-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
                  <h2 className="text-lg font-bold text-gray-800">Edit Maklumat Pengguna</h2>
                  <button onClick={() => setIsEditOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="overflow-y-auto overflow-x-hidden px-5 py-5 space-y-4 flex-1">
                  {/* Read-only email */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">E-mel (tidak boleh diubah)</p>
                    <p className="text-sm text-gray-700">{user.email}</p>
                  </div>

                  <Field label="Nama Penuh">
                    <input className={inputCls} value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="cth. Ahmad bin Ali" />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Peranan">
                      <select className={inputCls} value={editRole}
                        onChange={e => setEditRole(e.target.value)}>
                        {ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Biro">
                      <select className={inputCls} value={editBiroId}
                        onChange={e => setEditBiroId(e.target.value)}>
                        <option value="">— Tiada Biro —</option>
                        {biroList.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Jawatan">
                    <input className={inputCls} value={editPosition}
                      onChange={e => setEditPosition(e.target.value)}
                      placeholder="cth. Setiausaha" />
                  </Field>

                  <Field label="Telefon">
                    <input className={inputCls} value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="cth. +60 12 345 6789" />
                  </Field>

                  {formError && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {formError}
                    </p>
                  )}
                </div>

                <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
                  <button onClick={() => setIsEditOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">
                    Batal
                  </button>
                  <button onClick={handleSaveEdit} disabled={saving}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 text-sm">
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* ── Ban Modal ───────────────────────────────────────────────────────── */}
      {isBanOpen && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {user.banned ? 'Nyahsekat Pengguna?' : 'Sekat Pengguna?'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Pengguna: <span className="font-semibold text-gray-700">{user.name}</span>
                </p>
                {!user.banned && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Sebab Sekatan (pilihan)
                    </label>
                    <input className={inputCls} value={banReason}
                      onChange={e => setBanReason(e.target.value)}
                      placeholder="cth. Melanggar terma penggunaan" />
                  </div>
                )}
                {user.banned && user.banned_reason && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
                    Sebab asal: {user.banned_reason}
                  </p>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setIsBanOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">
                    Batal
                  </button>
                  <button onClick={handleBanToggle} disabled={saving}
                    className={`flex-1 py-2.5 text-white rounded-xl font-semibold disabled:opacity-60 text-sm ${user.banned ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                    {saving ? 'Menyimpan...' : user.banned ? 'Nyahsekat' : 'Sekat'}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* ── Delete Modal ─────────────────────────────────────────────────────── */}
      {isDeleteOpen && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Padam Pengguna?</h3>
                <p className="text-sm text-gray-500 mb-1">
                  Anda akan memadam akaun <span className="font-semibold text-gray-700">{user.name}</span>.
                </p>
                <p className="text-xs text-gray-400 mb-6">Tindakan ini tidak boleh dibatalkan.</p>
                <div className="flex gap-3">
                  <button onClick={() => setIsDeleteOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">
                    Batal
                  </button>
                  <button onClick={handleDelete} disabled={saving}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 text-sm">
                    {saving ? 'Memadamkan...' : 'Ya, Padam'}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}