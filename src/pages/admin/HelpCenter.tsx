import { useState } from 'react';
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../supabaseClient';
import { authClient } from '../../lib/auth-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = 'manual' | 'feedback' | 'contact';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

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

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
      >
        <span className="text-sm font-semibold text-gray-800">{question}</span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 shrink-0 ml-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
};

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    question: 'Bagaimana cara menambah acara baru?',
    answer: 'Pergi ke Pengurusan → Acara. Klik butang "Tambah Acara" di bahagian atas kanan. Isi semua maklumat yang diperlukan dan klik "Simpan".',
  },
  {
    question: 'Siapa yang boleh mengurus pengguna?',
    answer: 'Hanya superadmin yang boleh mengurus pengguna, termasuk menukar peranan, biro, dan memadam akaun.',
  },
  {
    question: 'Bagaimana cara meminjam aset masjid?',
    answer: 'Pergi ke Pengurusan → Aset Masjid → Rekod Pinjaman. Klik "Rekod Pinjaman Baru", pilih aset yang dikehendaki dan isi maklumat peminjam.',
  },
  {
    question: 'Bagaimana cara muat naik gambar profil?',
    answer: 'Pergi ke Tetapan. Klik ikon kamera pada gambar profil anda, pilih gambar dari peranti anda, kemudian klik "Simpan Profil".',
  },
  {
    question: 'Apa yang perlu dilakukan jika lupa kata laluan?',
    answer: 'Contact developer melalui emel "chanzhijie5@gmail.com" atau whatsapp +60185716608 untuk bantuan reset kata laluan.',
  },
];

// ─── Manual Tab ───────────────────────────────────────────────────────────────

const ManualTab = () => (
  <div className="space-y-6">
    {/* PDF Download */}
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
          <BookOpenIcon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg">Manual Pengguna</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Panduan lengkap penggunaan sistem pengurusan masjid
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF · Versi 1.0</p>
        </div>
        <a
            href="/manual_pengguna.pdf"
            download
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition w-full sm:w-auto justify-center"
        >
        <ArrowDownTrayIcon className="w-4 h-4" />
            Muat Turun
        </a>
      </div>
    </div>

    {/* Quick start steps */}
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-4">Panduan Permulaan Pantas</h3>
      <div className="space-y-3">
        {[
          { step: '1', title: 'Log Masuk', desc: 'Gunakan e-mel dan kata laluan yang diberikan oleh superadmin.' },
          { step: '2', title: 'Kemaskini Profil', desc: 'Pergi ke Tetapan untuk kemaskini nama, telefon dan gambar profil anda.' },
          { step: '3', title: 'Terokai Modul', desc: 'Gunakan menu Pengurusan untuk mengakses semua modul yang tersedia.' },
          { step: '4', title: 'Urus Acara', desc: 'Tambah, edit dan padam acara masjid melalui modul Pengurusan Acara.' },
          { step: '5', title: 'Rekod Kewangan', desc: 'Rekod transaksi dan urus tabung melalui modul Kewangan & Tabung.' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {step}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* FAQ */}
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-4">Soalan Lazim (FAQ)</h3>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <FaqItem key={i} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Feedback Tab ─────────────────────────────────────────────────────────────

const FeedbackTab = ({ onToast }: { onToast: (msg: string, type: 'success' | 'error') => void }) => {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;

  const [form, setForm] = useState({
    category: 'general',
    subject: '',
    message: '',
    rating: 0,
  });
  const [saving, setSaving] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const CATEGORIES = [
    { value: 'general',    label: 'Umum' },
    { value: 'bug',        label: 'Laporan Bug / Ralat' },
    { value: 'feature',    label: 'Cadangan Ciri Baru' },
    { value: 'ui',         label: 'Antara Muka Pengguna' },
    { value: 'performance',label: 'Prestasi Sistem' },
    { value: 'other',      label: 'Lain-lain' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      onToast('Sila isi subjek dan mesej maklum balas.', 'error'); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id:   user?.id ?? null,
        user_name: user?.name ?? 'Tanpa Nama',
        user_email:user?.email ?? null,
        category:  form.category,
        subject:   form.subject.trim(),
        message:   form.message.trim(),
        rating:    form.rating || null,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setForm({ category: 'general', subject: '', message: '', rating: 0 });
      onToast('Maklum balas berjaya dihantar. Terima kasih!', 'success');
    } catch {
      onToast('Gagal menghantar maklum balas. Sila cuba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
        💡 Maklum balas anda membantu kami menambah baik sistem. Semua maklum balas akan disemak oleh pembangun.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Kategori" required>
          <select className={inputCls} value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Subjek" required>
          <input className={inputCls} placeholder="Ringkasan maklum balas anda"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
        </Field>

        <Field label="Mesej" required>
          <textarea
            className={`${inputCls} resize-none`}
            rows={5}
            placeholder="Huraikan maklum balas anda dengan terperinci..."
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          />
        </Field>

        {/* Star rating */}
        <Field label="Penilaian Keseluruhan (pilihan)">
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setForm(f => ({ ...f, rating: star }))}
                className="text-2xl transition-transform hover:scale-110 focus:outline-none"
              >
                <span className={
                  star <= (hoveredStar || form.rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }>★</span>
              </button>
            ))}
            {form.rating > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                {['', 'Sangat Buruk', 'Buruk', 'Sederhana', 'Baik', 'Sangat Baik'][form.rating]}
              </span>
            )}
          </div>
        </Field>

        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
          {saving ? 'Menghantar...' : 'Hantar Maklum Balas'}
        </button>
      </form>
    </div>
  );
};

// ─── Contact Tab ──────────────────────────────────────────────────────────────

const ContactTab = ({ onToast }: { onToast: (msg: string, type: 'success' | 'error') => void }) => {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;

  const [form, setForm] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      onToast('Sila isi subjek dan mesej.', 'error'); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('developer_contact').insert({
        user_id:    user?.id ?? null,
        user_name:  user?.name ?? 'Tanpa Nama',
        user_email: user?.email ?? null,
        subject:    form.subject.trim(),
        message:    form.message.trim(),
        priority:   form.priority,
        status:     'open',
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setForm({ subject: '', message: '', priority: 'normal' });
      onToast('Mesej berjaya dihantar kepada pembangun.', 'success');
    } catch {
      onToast('Gagal menghantar mesej. Sila cuba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Developer info card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
          <span className="text-2xl">👨‍💻</span>
        </div>
        <div>
          <p className="font-bold text-gray-900">Pembangun Sistem</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Hantar mesej terus kepada pembangun untuk isu teknikal atau pertanyaan sistem.
          </p>
          <p className="text-xs text-gray-400 mt-1">Masa tindak balas: 1–3 hari bekerja</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Auto-filled sender info */}
        {user && (
          <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Pengirim</p>
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        )}

        <Field label="Keutamaan">
          <div className="flex gap-2">
            {[
              { value: 'low',    label: 'Rendah',  color: 'border-gray-300 text-gray-600 hover:border-gray-400' },
              { value: 'normal', label: 'Biasa',   color: 'border-blue-300 text-blue-600 hover:border-blue-400' },
              { value: 'high',   label: 'Tinggi',  color: 'border-orange-300 text-orange-600 hover:border-orange-400' },
              { value: 'urgent', label: 'Kritikal',color: 'border-red-300 text-red-600 hover:border-red-400' },
            ].map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                  form.priority === p.value
                    ? p.color + ' bg-opacity-10 bg-current'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Subjek" required>
          <input className={inputCls} placeholder="cth. Masalah log masuk, Permintaan ciri baru"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
        </Field>

        <Field label="Mesej" required>
          <textarea
            className={`${inputCls} resize-none`}
            rows={5}
            placeholder="Huraikan isu atau pertanyaan anda dengan terperinci. Sertakan langkah-langkah untuk mengeluarkan semula isu jika berkaitan..."
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          />
        </Field>

        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
          {saving ? 'Menghantar...' : 'Hantar kepada Pembangun'}
        </button>
      </form>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const HelpCentre = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('manual');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const TABS = [
    { key: 'manual',   label: 'Manual',         icon: BookOpenIcon },
    { key: 'feedback', label: 'Maklum Balas',    icon: ChatBubbleLeftRightIcon },
    { key: 'contact',  label: 'Hubungi Pembangun', icon: EnvelopeIcon },
  ] as { key: ActiveTab; label: string; icon: React.ElementType }[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200 px-4 py-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Pusat Bantuan</h1>
        <p className="text-gray-500 text-base sm:text-lg">
          Manual pengguna, maklum balas dan sokongan teknikal
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'manual'   && <ManualTab />}
        {activeTab === 'feedback' && <FeedbackTab onToast={showToast} />}
        {activeTab === 'contact'  && <ContactTab onToast={showToast} />}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default HelpCentre;