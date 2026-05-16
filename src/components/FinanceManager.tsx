import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import FinanceCharts from './FinanceCharts'; // adjust path if needed
import {
  PlusIcon, PencilSquareIcon, TrashIcon, ArrowDownTrayIcon,
  ArrowUpCircleIcon, ArrowDownCircleIcon, BanknotesIcon,
  MagnifyingGlassIcon, XMarkIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
}

interface Tabung {
  id: string;
  name: string;
  target: number;
  collected: number;
  description: string | null;
  is_active: boolean;
}

type TxFormData = Omit<Transaction, 'id' | 'created_at'>;
type TabungFormData = Omit<Tabung, 'id'>;

type ActiveTab = 'transactions' | 'tabung' | 'charts';
type FilterType = 'all' | 'income' | 'expense';

// ─── Constants ────────────────────────────────────────────────────────────────

const TX_CATEGORIES = {
  income:  ['Derma', 'Zakat', 'Sewaan', 'Sumbangan', 'Kutipan Jumaat', 'Lain-lain'],
  expense: ['Utiliti', 'Penyelenggaraan', 'Gaji', 'Peralatan', 'Program', 'Lain-lain'],
};

const EMPTY_TX: TxFormData = {
  type: 'income', amount: 0, category: '', description: '', date: new Date().toISOString().split('T')[0],
};

const EMPTY_TABUNG: TabungFormData = {
  name: '', target: 0, collected: 0, description: '', is_active: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS: Record<number, string> = {
  1:'Jan',2:'Feb',3:'Mac',4:'Apr',5:'Mei',6:'Jun',
  7:'Jul',8:'Ogos',9:'Sep',10:'Okt',11:'Nov',12:'Dis',
};
const formatDate  = (iso: string) => { const [y,m,d] = iso.split('-').map(Number); return `${d} ${MONTHS[m]} ${y}`; };
const formatMoney = (n: number)   => `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

const Field = ({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// ─── Summary Card ─────────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, icon, color }: {
  label: string; value: string; icon: React.ReactNode; color: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  </div>
);

// ─── Tabung Progress Card ─────────────────────────────────────────────────────

const TabungCard = ({ tabung, onEdit, onDelete }: {
  tabung: Tabung;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const pct = tabung.target > 0 ? Math.min((tabung.collected / tabung.target) * 100, 100) : 0;
  const remaining = Math.max(tabung.target - tabung.collected, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 truncate">{tabung.name}</h3>
          {tabung.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tabung.description}</p>}
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>Terkumpul: <span className="font-semibold text-gray-700">{formatMoney(tabung.collected)}</span></span>
        <span className="font-bold text-blue-600">{pct.toFixed(0)}%</span>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Sasaran: <span className="font-semibold text-gray-700">{formatMoney(tabung.target)}</span></span>
        <span>Baki: <span className="font-semibold text-gray-700">{formatMoney(remaining)}</span></span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FinanceManager = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('transactions');

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<FilterType>('all');

  // Tabung state
  const [tabungList, setTabungList] = useState<Tabung[]>([]);
  const [tabungLoading, setTabungLoading] = useState(true);

  // Transaction modal
  const [txModal, setTxModal] = useState<{ open: boolean; editing: Transaction | null }>({ open: false, editing: null });
  const [txForm, setTxForm] = useState<TxFormData>(EMPTY_TX);
  const [txSaving, setTxSaving] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Tabung modal
  const [tabungModal, setTabungModal] = useState<{ open: boolean; editing: Tabung | null }>({ open: false, editing: null });
  const [tabungForm, setTabungForm] = useState<TabungFormData>(EMPTY_TABUNG);
  const [tabungSaving, setTabungSaving] = useState(false);
  const [tabungError, setTabungError] = useState<string | null>(null);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string | null; target: 'tx' | 'tabung' | null }>({
    show: false, id: null, target: null,
  });

  // ── Fetch transactions ──────────────────────────────────────────────────────

  const fetchTransactions = async () => {
    setTxLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) console.error(error);
    else setTransactions(data ?? []);
    setTxLoading(false);
  };

  // ── Fetch tabung ────────────────────────────────────────────────────────────

  const fetchTabung = async () => {
    setTabungLoading(true);
    const { data, error } = await supabase
      .from('tabung')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setTabungList(data ?? []);
    setTabungLoading(false);
  };

  useEffect(() => { fetchTransactions(); fetchTabung(); }, []);

  // ── Derived: summary totals ─────────────────────────────────────────────────

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  // ── Derived: filtered transactions ─────────────────────────────────────────

  const filteredTx = transactions.filter(tx => {
    const matchesType = txFilter === 'all' || tx.type === txFilter;
    const q = txSearch.toLowerCase().trim();
    const matchesSearch = !q || (
      tx.category.toLowerCase().includes(q) ||
      (tx.description ?? '').toLowerCase().includes(q) ||
      formatDate(tx.date).toLowerCase().includes(q) ||
      tx.amount.toString().includes(q)
    );
    return matchesType && matchesSearch;
  });

  // ── Transaction CRUD ────────────────────────────────────────────────────────

  const openAddTx = () => {
    setTxForm(EMPTY_TX); setTxError(null);
    setTxModal({ open: true, editing: null });
  };

  const openEditTx = (tx: Transaction) => {
    setTxForm({ type: tx.type, amount: tx.amount, category: tx.category, description: tx.description ?? '', date: tx.date });
    setTxError(null); setTxModal({ open: true, editing: tx });
  };

  const saveTx = async () => {
    if (!txForm.category || !txForm.date || txForm.amount <= 0) {
      setTxError('Sila isi semua ruangan yang diperlukan.'); return;
    }
    setTxSaving(true); setTxError(null);
    const payload = { ...txForm, amount: Number(txForm.amount) };
    if (txModal.editing) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', txModal.editing.id);
      if (error) { setTxError('Gagal mengemaskini.'); setTxSaving(false); return; }
    } else {
      const { error } = await supabase.from('transactions').insert(payload);
      if (error) { setTxError('Gagal menyimpan.'); setTxSaving(false); return; }
    }
    setTxSaving(false); setTxModal({ open: false, editing: null }); fetchTransactions();
  };

  // ── Tabung CRUD ─────────────────────────────────────────────────────────────

  const openAddTabung = () => {
    setTabungForm(EMPTY_TABUNG); setTabungError(null);
    setTabungModal({ open: true, editing: null });
  };

  const openEditTabung = (t: Tabung) => {
    setTabungForm({ name: t.name, target: t.target, collected: t.collected, description: t.description ?? '', is_active: t.is_active });
    setTabungError(null); setTabungModal({ open: true, editing: t });
  };

  const saveTabung = async () => {
    if (!tabungForm.name || tabungForm.target <= 0) {
      setTabungError('Sila isi nama dan sasaran tabung.'); return;
    }
    setTabungSaving(true); setTabungError(null);
    const payload = { ...tabungForm, target: Number(tabungForm.target), collected: Number(tabungForm.collected) };
    if (tabungModal.editing) {
      const { error } = await supabase.from('tabung').update(payload).eq('id', tabungModal.editing.id);
      if (error) { setTabungError('Gagal mengemaskini.'); setTabungSaving(false); return; }
    } else {
      const { error } = await supabase.from('tabung').insert(payload);
      if (error) { setTabungError('Gagal menyimpan.'); setTabungSaving(false); return; }
    }
    setTabungSaving(false); setTabungModal({ open: false, editing: null }); fetchTabung();
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.target) return;
    const table = deleteModal.target === 'tx' ? 'transactions' : 'tabung';
    const { error } = await supabase.from(table).delete().eq('id', deleteModal.id);
    if (error) { console.error(error); return; }
    if (deleteModal.target === 'tx') fetchTransactions();
    else fetchTabung();
    setDeleteModal({ show: false, id: null, target: null });
  };

  // ── Export ──────────────────────────────────────────────────────────────────

  const exportToExcel = () => {
    const txRows = filteredTx.map(t => ({
      Tarikh: t.date, Jenis: t.type === 'income' ? 'Masuk' : 'Keluar',
      Kategori: t.category, Penerangan: t.description ?? '',
      Jumlah: t.amount,
    }));
    const tabungRows = tabungList.map(t => ({
      Nama: t.name, Sasaran: t.target, Terkumpul: t.collected,
      Baki: t.target - t.collected, Status: t.is_active ? 'Aktif' : 'Tidak Aktif',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), 'Transaksi');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tabungRows), 'Tabung');
    XLSX.writeFile(wb, 'Laporan_Kewangan.xlsx');
  };

  // Granular permission — view-only users won't see add/edit/delete
  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-6xl mx-auto pb-20">
      {/* Navigation Layer - Anchored to the far left */}
      <div className="w-full flex justify-start mb-2">
        <button 
          onClick={() => window.history.back()} 
          className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors group"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Menu Pengurusan
        </button>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-800">Kewangan & Tabung</h1>
          <p className="text-gray-500 text-sm">Rekod kewangan dan kutipan dana masjid</p>
        </div>

        <button onClick={exportToExcel}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-semibold text-sm w-full sm:w-auto">
          <ArrowDownTrayIcon className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Jumlah Masuk" value={formatMoney(totalIncome)}
          color="bg-green-100"
          icon={<ArrowUpCircleIcon className="w-6 h-6 text-green-600" />} />
        <SummaryCard label="Jumlah Keluar" value={formatMoney(totalExpense)}
          color="bg-red-100"
          icon={<ArrowDownCircleIcon className="w-6 h-6 text-red-500" />} />
        <SummaryCard label="Baki Semasa" value={formatMoney(balance)}
          color={balance >= 0 ? 'bg-blue-100' : 'bg-amber-100'}
          icon={<BanknotesIcon className={`w-6 h-6 ${balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-full sm:w-fit">
        {(['transactions', 'tabung', 'charts'] as ActiveTab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'transactions' ? 'Transaksi' : tab === 'tabung' ? 'Tabung' : 'Graf'}
          </button>
        ))}
      </div>

      {/* ── Transactions tab ─────────────────────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Cari kategori, penerangan, tarikh..."
                value={txSearch} onChange={e => setTxSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              {txSearch && (
                <button onClick={() => setTxSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
              {(['all', 'income', 'expense'] as FilterType[]).map(f => (
                <button key={f} onClick={() => setTxFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    txFilter === f ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {f === 'all' ? 'Semua' : f === 'income' ? 'Masuk' : 'Keluar'}
                </button>
              ))}
            </div>

            <button onClick={openAddTx}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm shrink-0">
              <PlusIcon className="w-4 h-4" /> Tambah
            </button>
          </div>

          {txSearch.trim() && (
            <p className="text-xs text-gray-500 mb-3">
              {filteredTx.length} rekod dijumpai untuk "{txSearch}"
            </p>
          )}

          {/* Transaction table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {txLoading ? (
              <div className="p-8 text-center text-gray-400">Memuatkan...</div>
            ) : filteredTx.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-3xl mb-2">💸</p>
                <p>{txSearch || txFilter !== 'all' ? 'Tiada rekod sepadan.' : 'Tiada transaksi lagi.'}</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Penerangan</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Tarikh</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Kategori</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Jumlah</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map(tx => (
                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {tx.type === 'income'
                              ? <ArrowUpCircleIcon className="w-4 h-4 text-green-600" />
                              : <ArrowDownCircleIcon className="w-4 h-4 text-red-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{tx.category}</p>
                            {tx.description && <p className="text-xs text-gray-500">{tx.description}</p>}
                            <p className="sm:hidden text-xs text-gray-400 mt-0.5">{formatDate(tx.date)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 hidden sm:table-cell">{formatDate(tx.date)}</td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{tx.category}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEditTx(tx)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteModal({ show: true, id: tx.id, target: 'tx' })}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Tabung tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'tabung' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openAddTabung}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm">
              <PlusIcon className="w-4 h-4" /> Tambah Tabung
            </button>
          </div>

          {tabungLoading ? (
            <div className="p-8 text-center text-gray-400">Memuatkan...</div>
          ) : tabungList.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">🏦</p>
              <p>Tiada tabung lagi. Cipta tabung pertama!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tabungList.map(t => (
                <TabungCard key={t.id} tabung={t}
                  onEdit={() => openEditTabung(t)}
                  onDelete={() => setDeleteModal({ show: true, id: t.id, target: 'tabung' })} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Charts tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'charts' && (
        <FinanceCharts transactions={transactions} />
      )}

      {/* ── Transaction Modal ─────────────────────────────────────────────────── */}
      {txModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                {txModal.editing ? 'Kemaskini Transaksi' : 'Tambah Transaksi'}
              </h2>
              <button onClick={() => setTxModal({ open: false, editing: null })} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {/* Type toggle */}
              <Field label="Jenis" required>
                <div className="flex gap-2">
                  {(['income', 'expense'] as TxType[]).map(t => (
                    <button key={t} type="button" onClick={() => setTxForm(f => ({ ...f, type: t, category: '' }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                        txForm.type === t
                          ? t === 'income' ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}>
                      {t === 'income' ? '↑ Masuk' : '↓ Keluar'}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Jumlah (RM)" required>
                  <input type="number" min="0" step="0.01" className={inputCls}
                    placeholder="0.00"
                    value={txForm.amount || ''}
                    onChange={e => setTxForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
                </Field>
                <Field label="Tarikh" required>
                  <input type="date" className={inputCls}
                    value={txForm.date}
                    onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
                </Field>
              </div>

              <Field label="Kategori" required>
                <select className={inputCls}
                  value={txForm.category}
                  onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">-- Pilih kategori --</option>
                  {TX_CATEGORIES[txForm.type].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Penerangan">
                <input className={inputCls} placeholder="Nota tambahan (pilihan)"
                  value={txForm.description ?? ''}
                  onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} />
              </Field>

              {txError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{txError}</p>}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => setTxModal({ open: false, editing: null })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">Batal</button>
              <button onClick={saveTx} disabled={txSaving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 text-sm">
                {txSaving ? 'Menyimpan...' : txModal.editing ? 'Kemaskini' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabung Modal ──────────────────────────────────────────────────────── */}
      {tabungModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                {tabungModal.editing ? 'Kemaskini Tabung' : 'Tambah Tabung Baru'}
              </h2>
              <button onClick={() => setTabungModal({ open: false, editing: null })} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <Field label="Nama Tabung" required>
                <input className={inputCls} placeholder="cth. Tabung Pembinaan Surau"
                  value={tabungForm.name}
                  onChange={e => setTabungForm(f => ({ ...f, name: e.target.value }))} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Sasaran (RM)" required>
                  <input type="number" min="0" step="0.01" className={inputCls} placeholder="0.00"
                    value={tabungForm.target || ''}
                    onChange={e => setTabungForm(f => ({ ...f, target: parseFloat(e.target.value) || 0 }))} />
                </Field>
                <Field label="Terkumpul (RM)">
                  <input type="number" min="0" step="0.01" className={inputCls} placeholder="0.00"
                    value={tabungForm.collected || ''}
                    onChange={e => setTabungForm(f => ({ ...f, collected: parseFloat(e.target.value) || 0 }))} />
                </Field>
              </div>

              <Field label="Penerangan">
                <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Huraian tabung..."
                  value={tabungForm.description ?? ''}
                  onChange={e => setTabungForm(f => ({ ...f, description: e.target.value }))} />
              </Field>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Tabung Aktif</p>
                  <p className="text-xs text-gray-400">Papar pada laman awam</p>
                </div>
                <button type="button" onClick={() => setTabungForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${tabungForm.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tabungForm.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {tabungError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{tabungError}</p>}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => setTabungModal({ open: false, editing: null })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">Batal</button>
              <button onClick={saveTabung} disabled={tabungSaving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 text-sm">
                {tabungSaving ? 'Menyimpan...' : tabungModal.editing ? 'Kemaskini' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ──────────────────────────────────────────────────────── */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <ExclamationTriangleIcon className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold">Padam Rekod?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">Tindakan ini tidak boleh dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ show: false, id: null, target: null })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">Batal</button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 text-sm">Ya, Padam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;