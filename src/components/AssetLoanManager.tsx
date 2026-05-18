import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { authClient } from '../lib/auth-client';
import {
  MagnifyingGlassIcon, XMarkIcon, ExclamationTriangleIcon,
  CheckCircleIcon, ClockIcon, ArrowPathIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoanRecord {
  id: string;
  asset_instance_id: string;
  borrower_id: string | null;
  borrower_name: string;
  borrower_email: string | null;
  borrow_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  purpose: string | null;
  notes: string | null;
  created_at: string;
  asset_instances: {
    instance_number: number;
    condition: string;
    assets: {
      id: string;
      name: string;
      category: string;
      image_url: string | null;
      biro_id: string | null;
    };
  };
}

interface AssetInstance {
  id: string;
  instance_number: number;
  condition: string;
  asset_id: string;
  assets: {
    id: string;
    name: string;
    category: string;
    biro_id: string | null;
  } | null;
}

interface GroupedAsset {
  id: string;
  name: string;
  category: string;
  availableCount: number;
  totalCount: number;
  firstAvailableInstanceId: string | null;
}

type FilterType = 'active' | 'returned' | 'all';

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

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });

const isOverdue = (loan: LoanRecord) =>
  !loan.actual_return_date &&
  loan.expected_return_date &&
  new Date(loan.expected_return_date) < new Date();

// ─── Asset Search Dropdown ────────────────────────────────────────────────────

const AssetSearchDropdown = ({
  assets,
  selectedAsset,
  onSelect,
}: {
  assets: GroupedAsset[];
  selectedAsset: GroupedAsset | null;
  onSelect: (asset: GroupedAsset) => void;
}) => {
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const containerRef            = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (asset: GroupedAsset) => {
    onSelect(asset);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg text-sm cursor-pointer bg-white transition ${
          open ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {selectedAsset ? (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="font-medium text-gray-800 truncate">{selectedAsset.name}</span>
            <span className={`ml-2 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
              selectedAsset.availableCount > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {selectedAsset.availableCount} tersedia
            </span>
          </div>
        ) : (
          <span className="text-gray-400">Cari aset...</span>
        )}
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 ml-2 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search input inside dropdown */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder="Cari nama aset..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Tiada aset dijumpai.
              </div>
            ) : (
              filtered.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  disabled={asset.availableCount === 0}
                  onClick={() => asset.availableCount > 0 && handleSelect(asset)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition ${
                    asset.availableCount === 0
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : 'hover:bg-blue-50 cursor-pointer'
                  } ${selectedAsset?.id === asset.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 text-sm truncate">{asset.name}</div>
                    <div className="text-xs text-gray-400">{asset.category}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      asset.availableCount > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {asset.availableCount}/{asset.totalCount}
                    </span>
                    {asset.availableCount === 0 && (
                      <span className="text-xs text-red-500 font-medium">Habis</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AssetLoanManager = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const userBiroId = user?.biro_id ?? null;
  const userRole = user?.role ?? 'user';
  const isSuperAdmin = userRole === 'superadmin';

  const [loans, setLoans]               = useState<LoanRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<FilterType>('active');
  const [search, setSearch]             = useState('');

  // Loan modal
  const [loanModal, setLoanModal]       = useState(false);
  const [groupedAssets, setGroupedAssets] = useState<GroupedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<GroupedAsset | null>(null);
  const [loanForm, setLoanForm]         = useState({
    asset_instance_id: '',
    borrower_name: '',
    borrower_email: '',
    expected_return_date: '',
    purpose: '',
    notes: '',
  });
  const [loanSaving, setLoanSaving]     = useState(false);
  const [loanError, setLoanError]       = useState<string | null>(null);

  // Return modal
  const [returnModal, setReturnModal]   = useState<{ open: boolean; loan: LoanRecord | null }>({ open: false, loan: null });
  const [returnNotes, setReturnNotes]   = useState('');
  const [returnSaving, setReturnSaving] = useState(false);

  // ── Fetch loans ─────────────────────────────────────────────────────────────

  const fetchLoans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('asset_loans')
      .select(`
        *,
        asset_instances (
          instance_number, condition, asset_id,
          assets ( id, name, category, image_url, biro_id )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) { console.error('Error fetching loans:', error); setLoading(false); return; }

    const filtered = isSuperAdmin
      ? (data ?? [])
      : (data ?? []).filter(loan =>
          loan.asset_instances?.assets?.biro_id === userBiroId ||
          loan.asset_instances?.assets?.biro_id === null
        );

    setLoans(filtered);
    setLoading(false);
  };

  // ── Fetch and group available instances ──────────────────────────────────────

  const fetchAndGroupInstances = async () => {
    // Step 1: get all currently loaned instance IDs
    const { data: activeLoans } = await supabase
      .from('asset_loans')
      .select('asset_instance_id')
      .is('actual_return_date', null);

    const loanedIds = new Set((activeLoans ?? []).map(l => l.asset_instance_id));

    // Step 2: get ALL instances with their asset info
    const { data, error } = await supabase
      .from('asset_instances')
      .select('id, instance_number, condition, asset_id, assets ( id, name, category, biro_id )')
      .order('instance_number', { ascending: true }); // lowest instance number first

    if (error) { console.error(error); return; }

    const allInstances = (data ?? []) as unknown as AssetInstance[];

    // Step 3: filter by biro
    const biroFiltered = isSuperAdmin
      ? allInstances
      : allInstances.filter(i =>
          i.assets?.biro_id === userBiroId || i.assets?.biro_id === null
        );

    // Step 4: group by asset, marking availability
    // Logic: instance_number 1 is loaned first, then 2, etc.
    const assetMap = new Map<string, GroupedAsset>();

    biroFiltered.forEach(instance => {
      const assetId = instance.asset_id;
      const assetName = instance.assets?.name ?? 'Unknown';
      const assetCategory = instance.assets?.category ?? '';
      const isAvailable = !loanedIds.has(instance.id);

      if (!assetMap.has(assetId)) {
        assetMap.set(assetId, {
          id: assetId,
          name: assetName,
          category: assetCategory,
          availableCount: 0,
          totalCount: 0,
          firstAvailableInstanceId: null,
        });
      }

      const entry = assetMap.get(assetId)!;
      entry.totalCount += 1;

      if (isAvailable) {
        entry.availableCount += 1;
        // Since instances are ordered by instance_number asc,
        // the first available one we encounter is the lowest-numbered available unit
        if (entry.firstAvailableInstanceId === null) {
          entry.firstAvailableInstanceId = instance.id;
        }
      }
    });

    setGroupedAssets(Array.from(assetMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    if (session !== undefined) fetchLoans();
  }, [session, filter]);

  // ── When asset is selected, auto-set the instance ID ─────────────────────────

  const handleAssetSelect = (asset: GroupedAsset) => {
    setSelectedAsset(asset);
    setLoanForm(f => ({
      ...f,
      asset_instance_id: asset.firstAvailableInstanceId ?? '',
    }));
  };

  // ── Filtered loans ───────────────────────────────────────────────────────────

  const filteredLoans = loans.filter(loan => {
    const matchesFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? !loan.actual_return_date :
      !!loan.actual_return_date;

    const q = search.toLowerCase().trim();
    const matchesSearch = !q || (
      loan.borrower_name.toLowerCase().includes(q) ||
      (loan.borrower_email ?? '').toLowerCase().includes(q) ||
      loan.asset_instances?.assets?.name.toLowerCase().includes(q)
    );

    return matchesFilter && matchesSearch;
  });

  // ── Open loan modal ───────────────────────────────────────────────────────────

  const openLoanModal = async () => {
    await fetchAndGroupInstances();
    setSelectedAsset(null);
    setLoanForm({
      asset_instance_id: '',
      borrower_name: '',
      borrower_email: '',
      expected_return_date: '',
      purpose: '',
      notes: '',
    });
    setLoanError(null);
    setLoanModal(true);
  };

  // ── Create loan ───────────────────────────────────────────────────────────────

  const handleCreateLoan = async () => {
    if (!loanForm.asset_instance_id || !loanForm.borrower_name) {
      setLoanError('Sila pilih aset dan isi nama peminjam.'); return;
    }
    setLoanSaving(true); setLoanError(null);

    const { error } = await supabase.from('asset_loans').insert({
      asset_instance_id:    loanForm.asset_instance_id,
      borrower_id:          user?.id ?? null,
      borrower_name:        loanForm.borrower_name.trim(),
      borrower_email:       loanForm.borrower_email.trim() || null,
      expected_return_date: loanForm.expected_return_date || null,
      purpose:              loanForm.purpose.trim() || null,
      notes:                loanForm.notes.trim() || null,
      borrow_date:          new Date().toISOString(),
    });

    if (error) { setLoanError('Gagal merekod pinjaman.'); setLoanSaving(false); return; }

    setLoanSaving(false); setLoanModal(false); fetchLoans();
  };

  // ── Return asset ──────────────────────────────────────────────────────────────

  const handleReturn = async () => {
    if (!returnModal.loan) return;
    setReturnSaving(true);

    const { error } = await supabase
      .from('asset_loans')
      .update({
        actual_return_date: new Date().toISOString(),
        notes: returnNotes.trim() || returnModal.loan.notes,
      })
      .eq('id', returnModal.loan.id);

    if (error) { console.error(error); setReturnSaving(false); return; }

    setReturnSaving(false);
    setReturnModal({ open: false, loan: null });
    setReturnNotes('');
    fetchLoans();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="pb-20">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit">
          {([
            { key: 'active',   label: 'Aktif'    },
            { key: 'returned', label: 'Dipulang' },
            { key: 'all',      label: 'Semua'    },
          ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={openLoanModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm">
          + Rekod Pinjaman Baru
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input type="text" placeholder="Cari peminjam atau nama aset..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
          className="w-full py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loans table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuatkan...</div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>{filter === 'active' ? 'Tiada pinjaman aktif.' : 'Tiada rekod pinjaman.'}</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aset</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Peminjam</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Tarikh Pinjam</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Dijangka Pulang</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map(loan => {
                const overdue = isOverdue(loan);
                return (
                  <tr key={loan.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-gray-800 text-sm">
                        {loan.asset_instances?.assets?.name ?? '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Unit #{loan.asset_instances?.instance_number}
                      </div>
                      <div className="sm:hidden text-xs text-gray-500 mt-0.5">
                        {loan.borrower_name}
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="text-sm text-gray-800">{loan.borrower_name}</div>
                      {loan.borrower_email && (
                        <div className="text-xs text-gray-500">{loan.borrower_email}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 hidden md:table-cell">
                      {formatDate(loan.borrow_date)}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {loan.expected_return_date ? (
                        <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {formatDate(loan.expected_return_date)}
                          {overdue && <span className="ml-1 text-xs">(Tertunggak)</span>}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {loan.actual_return_date ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircleIcon className="w-3.5 h-3.5" /> Dipulang
                        </span>
                      ) : overdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Tertunggak
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          <ClockIcon className="w-3.5 h-3.5" /> Dipinjam
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!loan.actual_return_date ? (
                        <button
                          onClick={() => { setReturnModal({ open: true, loan }); setReturnNotes(''); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition">
                          <ArrowPathIcon className="w-3.5 h-3.5" /> Pulang
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">{formatDate(loan.actual_return_date)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── New Loan Modal ─────────────────────────────────────────────────────── */}
      {loanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92dvh] flex flex-col overflow-x-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Rekod Pinjaman Baru</h2>
              <button onClick={() => setLoanModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-5 space-y-4 flex-1">

              {/* Asset picker */}
              <Field label="Pilih Aset" required>
                <AssetSearchDropdown
                  assets={groupedAssets}
                  selectedAsset={selectedAsset}
                  onSelect={handleAssetSelect}
                />
                {selectedAsset && (
                  <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    selectedAsset.availableCount > 0
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {selectedAsset.availableCount > 0
                      ? `✓ ${selectedAsset.availableCount} unit tersedia — Unit #${
                          groupedAssets.find(a => a.id === selectedAsset.id)?.firstAvailableInstanceId
                            ? 'diperuntukkan secara automatik'
                            : '—'
                        }`
                      : '✗ Semua unit sedang dipinjam'
                    }
                  </div>
                )}
                {groupedAssets.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Tiada aset tersedia untuk dipinjam.</p>
                )}
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nama Peminjam" required>
                  <input className={inputCls} placeholder="cth. Ahmad bin Ali"
                    value={loanForm.borrower_name}
                    onChange={e => setLoanForm(f => ({ ...f, borrower_name: e.target.value }))} />
                </Field>
                <Field label="E-mel Peminjam">
                  <input type="email" className={inputCls} placeholder="cth. ahmad@email.com"
                    value={loanForm.borrower_email}
                    onChange={e => setLoanForm(f => ({ ...f, borrower_email: e.target.value }))} />
                </Field>
              </div>

              <Field label="Tarikh Dijangka Pulang">
                <input type="date" className={inputCls}
                  value={loanForm.expected_return_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setLoanForm(f => ({ ...f, expected_return_date: e.target.value }))} />
              </Field>

              <Field label="Tujuan Pinjaman">
                <input className={inputCls} placeholder="cth. Program Gotong Royong"
                  value={loanForm.purpose}
                  onChange={e => setLoanForm(f => ({ ...f, purpose: e.target.value }))} />
              </Field>

              <Field label="Nota">
                <textarea className={`${inputCls} resize-none`} rows={2}
                  placeholder="Nota tambahan..."
                  value={loanForm.notes}
                  onChange={e => setLoanForm(f => ({ ...f, notes: e.target.value }))} />
              </Field>

              {loanError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {loanError}
                </p>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => setLoanModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">
                Batal
              </button>
              <button onClick={handleCreateLoan} disabled={loanSaving || !selectedAsset || (selectedAsset?.availableCount ?? 0) === 0}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 text-sm">
                {loanSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Return Modal ───────────────────────────────────────────────────────── */}
      {returnModal.open && returnModal.loan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Sahkan Pemulangan</h3>
            <p className="text-sm text-gray-500 mb-1">
              Aset: <span className="font-semibold text-gray-700">
                {returnModal.loan.asset_instances?.assets?.name} — Unit #{returnModal.loan.asset_instances?.instance_number}
              </span>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Peminjam: <span className="font-semibold text-gray-700">{returnModal.loan.borrower_name}</span>
            </p>
            <Field label="Nota Pemulangan (pilihan)">
              <textarea className={`${inputCls} resize-none`} rows={2}
                placeholder="cth. Aset dipulang dalam keadaan baik"
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)} />
            </Field>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setReturnModal({ open: false, loan: null })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 text-sm">
                Batal
              </button>
              <button onClick={handleReturn} disabled={returnSaving}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 text-sm">
                {returnSaving ? 'Menyimpan...' : 'Sahkan Pulang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetLoanManager;