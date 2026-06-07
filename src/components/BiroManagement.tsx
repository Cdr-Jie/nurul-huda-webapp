import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { authClient } from '../lib/auth-client';
import {
  PlusIcon, PencilSquareIcon, TrashIcon,
  XMarkIcon, ExclamationTriangleIcon, UserGroupIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Biro {
  id: string;
  name: string;
  created_at: string;
  member_count?: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
  image: string | null;
  position: string | null;
  role: string;
  phone: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

const FALLBACK = (name: string) =>
  `https://ui-avatars.com/api/?background=dbeafe&color=1e40af&size=128&font-size=0.4&name=${encodeURIComponent(name)}`;

const ROLE_LABELS: Record<string, string> = {
  superadmin:   'Superadmin',
  admin:        'Admin',
  financeadmin: 'Admin Kewangan',
  user:         'Pengguna',
};

const ROLE_COLORS: Record<string, string> = {
  superadmin:   'bg-indigo-100 text-indigo-700',
  admin:        'bg-purple-100 text-purple-700',
  financeadmin: 'bg-emerald-100 text-emerald-700',
  user:         'bg-gray-100 text-gray-600',
};

const Field = ({ label, required = false, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// ─── Member Card ──────────────────────────────────────────────────────────────

const MemberCard = ({ member }: { member: Member }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center gap-3 hover:shadow-md transition">
    <img
      src={member.image ?? FALLBACK(member.name)}
      alt={member.name}
      className="w-16 h-16 rounded-full object-cover border-4 border-blue-100"
    />
    <div className="min-w-0 w-full">
      <p className="font-bold text-gray-800 text-sm truncate">{member.name}</p>
      {member.position && (
        <p className="text-xs text-blue-600 font-semibold mt-0.5 truncate">{member.position}</p>
      )}
      <p className="text-xs text-gray-400 truncate mt-0.5">{member.email}</p>
    </div>
    <div className="flex flex-wrap justify-center gap-1.5 w-full">
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[member.role] ?? ROLE_COLORS.user}`}>
        {ROLE_LABELS[member.role] ?? member.role}
      </span>
    </div>
    {member.phone && (
      <a href={`tel:${member.phone}`}
        className="text-xs text-gray-500 hover:text-blue-600 transition w-full text-center truncate">
        📞 {member.phone}
      </a>
    )}
  </div>
);

// ─── Biro Detail View ─────────────────────────────────────────────────────────

const BiroDetail = ({
  biro,
  onBack,
}: {
  biro: Biro;
  onBack: () => void;
}) => {
  const [members, setMembers]     = useState<Member[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user')
        .select('id, name, email, image, position, role, phone')
        .eq('biro_id', biro.id)
        .order('name', { ascending: true });
      if (error) console.error(error);
      else setMembers(data ?? []);
      setLoading(false);
    };
    fetchMembers();
  }, [biro.id]);

  const filtered = members.filter(m => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.position ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Back + header */}
      <button onClick={onBack}
        className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors group mb-4">
        <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Senarai Biro
      </button>

      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">{biro.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {members.length} ahli berdaftar
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <input
          type="text"
          placeholder="Cari ahli..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Members */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Memuatkan ahli...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <p className="text-4xl mb-2">👥</p>
          <p>{search ? 'Tiada ahli sepadan.' : 'Tiada ahli dalam biro ini.'}</p>
        </div>
      ) : (
        <>
          {search && (
            <p className="text-xs text-gray-500 mb-3">
              {filtered.length} ahli dijumpai untuk "{search}"
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(member => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const BiroManagement = () => {
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as any)?.role ?? 'user';

  // Hard guard — component refuses to render for non-superadmins
  // even if somehow mounted directly
  if (userRole !== 'superadmin') {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-4xl mb-2">🚫</p>
        <p className="font-semibold text-gray-700">Akses Ditolak</p>
        <p className="text-sm mt-1">Hanya superadmin boleh mengurus biro.</p>
      </div>
    );
  }
  const [biros, setBiros]               = useState<Biro[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [selectedBiro, setSelectedBiro] = useState<Biro | null>(null);

  const [modal, setModal]               = useState<{ open: boolean; editing: Biro | null }>({ open: false, editing: null });
  const [form, setForm]                 = useState({ name: '' });
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);

  const [deleteModal, setDeleteModal]   = useState<{ show: boolean; biro: Biro | null }>({ show: false, biro: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]   = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBiros = async () => {
    setLoading(true);

    const { data: biroData, error } = await supabase
      .from('biro')
      .select('*')
      .order('name', { ascending: true });

    if (error) { console.error(error); setLoading(false); return; }

    const { data: userCounts } = await supabase
      .from('user')
      .select('biro_id')
      .not('biro_id', 'is', null);

    const countMap: Record<string, number> = {};
    (userCounts ?? []).forEach(u => {
      if (u.biro_id) countMap[u.biro_id] = (countMap[u.biro_id] ?? 0) + 1;
    });

    setBiros((biroData ?? []).map(b => ({ ...b, member_count: countMap[b.id] ?? 0 })));
    setLoading(false);
  };

  useEffect(() => { fetchBiros(); }, []);

  // ── Filtered ───────────────────────────────────────────────────────────────

  const filtered = biros.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm({ name: '' });
    setFormError(null);
    setModal({ open: true, editing: null });
  };

  const openEdit = (e: React.MouseEvent, biro: Biro) => {
    e.stopPropagation();
    setForm({ name: biro.name });
    setFormError(null);
    setModal({ open: true, editing: biro });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Nama biro diperlukan.'); return; }
    setSaving(true); setFormError(null);

    if (modal.editing) {
      const { error } = await supabase
        .from('biro')
        .update({ name: form.name.trim() })
        .eq('id', modal.editing.id);
      if (error) {
        setFormError(error.code === '23505' ? 'Nama biro ini sudah wujud.' : 'Gagal mengemaskini biro.');
        setSaving(false); return;
      }
    } else {
      const { error } = await supabase
        .from('biro')
        .insert({ name: form.name.trim() });
      if (error) {
        setFormError(error.code === '23505' ? 'Nama biro ini sudah wujud.' : 'Gagal menambah biro.');
        setSaving(false); return;
      }
    }

    setSaving(false);
    setModal({ open: false, editing: null });
    fetchBiros();
  };

  const handleDelete = async () => {
    if (!deleteModal.biro) return;
    setDeleteLoading(true); setDeleteError(null);

    const { error } = await supabase
      .from('biro')
      .delete()
      .eq('id', deleteModal.biro.id);

    if (error) {
      setDeleteError('Gagal memadam biro.');
      setDeleteLoading(false); return;
    }

    setDeleteLoading(false);
    setDeleteModal({ show: false, biro: null });
    fetchBiros();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20">

      {/* Detail view */}
      {selectedBiro && (
        <BiroDetail
          biro={selectedBiro}
          onBack={() => setSelectedBiro(null)}
        />
      )}

      {/* List view */}
      {!selectedBiro && (
        <>
          {/* Header */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-gray-500" />
                Biro ({biros.length})
              </h2>
              <p className="text-sm text-gray-500 mt-1">Klik pada kad biro untuk lihat ahli</p>
            </div>
            <button onClick={openAdd}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm w-full sm:w-auto">
              <PlusIcon className="w-4 h-4" /> Tambah Biro
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Cari biro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="p-8 text-center text-gray-400">Memuatkan...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">🏢</p>
              <p>{search ? 'Tiada biro sepadan.' : 'Tiada biro lagi. Tambah biro pertama!'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(biro => (
                <div
                  key={biro.id}
                  onClick={() => setSelectedBiro(biro)}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-800 truncate group-hover:text-blue-600 transition">
                        {biro.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ditambah {new Date(biro.created_at).toLocaleDateString('ms-MY', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={e => openEdit(e, biro)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteError(null); setDeleteModal({ show: true, biro }); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Padam"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Member count */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        <span className="font-bold text-gray-800">{biro.member_count ?? 0}</span> ahli
                      </span>
                    </div>
                    <span className="text-xs text-blue-500 font-semibold group-hover:underline">
                      Lihat ahli →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {modal.editing ? 'Kemaskini Biro' : 'Tambah Biro Baru'}
              </h2>
              <button onClick={() => setModal({ open: false, editing: null })}
                className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Nama Biro" required>
                <input
                  className={inputCls}
                  placeholder="cth. Biro Dakwah"
                  value={form.name}
                  onChange={e => setForm({ name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
              </Field>
              {formError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModal({ open: false, editing: null })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 text-sm">
                {saving ? 'Menyimpan...' : modal.editing ? 'Kemaskini' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ──────────────────────────────────────────────────────── */}
      {deleteModal.show && deleteModal.biro && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <ExclamationTriangleIcon className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold">Padam Biro?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              Anda akan memadam biro{' '}
              <span className="font-semibold text-gray-800">"{deleteModal.biro.name}"</span>.
            </p>
            {(deleteModal.biro.member_count ?? 0) > 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Biro ini mempunyai{' '}
                  <span className="font-bold">{deleteModal.biro.member_count} ahli</span>.
                  Ahli-ahli ini akan kehilangan biro mereka.
                </p>
              </div>
            )}
            <p className="text-gray-400 text-xs mb-5">Tindakan ini tidak boleh dibatalkan.</p>
            {deleteError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ show: false, biro: null })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 text-sm">
                {deleteLoading ? 'Memadamkan...' : 'Ya, Padam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiroManagement;