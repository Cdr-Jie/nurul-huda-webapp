import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { compressImage } from '../utils/imageUpload';
import { authClient } from '../lib/auth-client';
import {
  PlusIcon, PencilSquareIcon, TrashIcon, ArrowDownTrayIcon,
  ExclamationTriangleIcon, XMarkIcon, CheckCircleIcon, PhotoIcon,
  MagnifyingGlassIcon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon, 
  Squares2X2Icon, ListBulletIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────

type Condition = 'excellent' | 'good' | 'fair' | 'needs_repair';

interface Asset {
  id: string;
  name: string;
  category: string;
  description: string;
  total_quantity: number;
  default_condition: Condition;
  image_url: string | null;
  biro_id: string | null;
  created_at: string;
  updated_at: string;
  available_count?: number;
}

interface AssetInstance {
  id: string;
  asset_id: string;
  instance_number: number;
  condition: Condition;
  notes: string | null;
  created_at: string;
  updated_at: string;
  asset_loans?: {
    id: string;
    borrower_name: string;
    borrower_email: string;
    borrow_date: string;
    actual_return_date: string | null;
  }[];
}

type AssetFormData = Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'available_count'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_COLORS: Record<Condition, { bg: string; text: string; label: string }> = {
  excellent:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Sempurna' },
  good:         { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Baik' },
  fair:         { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Sederhana' },
  needs_repair: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Perlu Servis' },
};

const CATEGORIES = [
  'Perabot', 'Elektronik', 'Audio', 'Hiasan',
  'Dapur', 'Sukan', 'Alatan', 'Lain-lain',
];

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

// ─── Upload Zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
  accept: string; file: File | null; existingUrl: string | null;
  onFileChange: (file: File | null) => void; icon: React.ReactNode;
  placeholder: string; hint: string; existingLabel: string; previewImage?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  accept, file, existingUrl, onFileChange,
  icon, placeholder, hint, existingLabel, previewImage = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : existingUrl;

  return (
    <div onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition touch-action-manipulation min-h-[44px]">
      {previewImage && previewUrl ? (
        <div className="space-y-2">
          <img src={previewUrl} alt="Preview" className="h-32 w-full object-cover rounded-lg mx-auto" />
          <p className="text-xs text-gray-400">Klik untuk ganti gambar</p>
        </div>
      ) : file ? (
        <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-medium">
          <CheckCircleIcon className="w-5 h-5" />{file.name}
        </div>
      ) : existingUrl ? (
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
            {icon}{existingLabel}
          </div>
          <a href={existingUrl} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()} className="text-xs text-blue-500 underline">
            Lihat gambar semasa
          </a>
          <p className="text-xs text-gray-400">Klik untuk ganti</p>
        </div>
      ) : (
        <div className="text-gray-400 text-sm space-y-1">
          {icon}<p>{placeholder}</p><p className="text-xs">{hint}</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => onFileChange(e.target.files?.[0] ?? null)} />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AssetManager = () => {
  // ── Session ─────────────────────────────────────────────────────────────────
  const { data: session } = authClient.useSession();
  const userBiroId = (session?.user as any)?.biro_id ?? null;
  const userRole = session?.user?.role ?? 'user';
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = ['admin', 'financeadmin', 'superadmin'].includes(userRole);

  // ── State ────────────────────────────────────────────────────────────────────
  const [assets, setAssets]               = useState<Asset[]>([]);
  const [loading, setLoading]             = useState(true);
  const [viewMode, setViewMode]           = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery]     = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [sortBy, setSortBy]               = useState<{ column: string; ascending: boolean }>({ column: 'name', ascending: true });
  const [biroList, setBiroList] = useState<{ id: string; name: string }[]>([]);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [modal, setModal]                 = useState<{ open: boolean; editing: Asset | null }>({ open: false, editing: null });
  const [form, setForm]                   = useState<AssetFormData>({
    name: '', category: 'Other', description: '',
    total_quantity: 1, default_condition: 'good',
    image_url: null, biro_id: userBiroId,
  });
  const [imageFile, setImageFile]         = useState<File | null>(null);
  const [saving, setSaving]               = useState(false);
  const [formError, setFormError]         = useState<string | null>(null);

  const [deleteModal, setDeleteModal]     = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  // Instances modal
  const [instancesModal, setInstancesModal] = useState<{ open: boolean; asset: Asset | null }>({ open: false, asset: null });
  const [instances, setInstances]         = useState<AssetInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  // ── Fetch assets ─────────────────────────────────────────────────────────────

  const fetchAssets = async () => {
    setLoading(true);

    let query = supabase.from('assets').select('*').order('name', { ascending: true });

    if (!isSuperAdmin) {
      if (userBiroId) {
        query = query.or(`biro_id.eq.${userBiroId},biro_id.is.null`);
      } else {
        query = query.is('biro_id', null);
      }
    }

    const { data, error } = await query;
    if (error) { console.error('Error fetching assets:', error); setLoading(false); return; }

// Fetch available count per asset safely
const assetsWithCounts = await Promise.all(
  (data ?? []).map(async asset => {
    // 1. Fetch all instances for this asset, along with any active loans
    const { data: instances, error } = await supabase
      .from('asset_instances')
      .select(`
        id,
        asset_loans(id)
      `)
      .eq('asset_id', asset.id)
      // Filter the joined relation to ONLY include active unreturned loans
      .is('asset_loans.actual_return_date', null);

    if (error) {
      console.error('Error calculating available count:', error);
      return { ...asset, available_count: 0 };
    }

    // 2. Count how many instances DO NOT have an active loan attached
    // If asset_loans is empty, it means the unit is sitting on the shelf available!
    const availableCount = instances ? instances.filter(
      instance => !instance.asset_loans || (instance.asset_loans as any).length === 0
    ).length : 0;

    return { ...asset, available_count: availableCount };
  })
);
    setAssets(assetsWithCounts);
    setLoading(false);
  };

  // ── Fetch instances ───────────────────────────────────────────────────────────

  const fetchAssetInstances = async (assetId: string) => {
    setLoadingInstances(true);
    const { data, error } = await supabase
      .from('asset_instances')
      .select(`
        *,
        asset_loans (
          id, borrower_name, borrower_email,
          borrow_date, actual_return_date
        )
      `)
      .eq('asset_id', assetId)
      .order('instance_number', { ascending: true });

    if (error) { console.error('Error fetching instances:', error); }
    else { setInstances(data ?? []); }
    setLoadingInstances(false);
  };

  useEffect(() => {
    const fetchBiro = async () => {
      const { data } = await supabase.from('biro').select('id, name').order('name');
      setBiroList(data ?? []);
    };
    fetchBiro();
  }, []);


  useEffect(() => {
    if (session !== undefined && isAdmin) fetchAssets();
  }, [session]);

  // ── Filtering & sorting ───────────────────────────────────────────────────────

  const filteredAssets = assets
    .filter(asset => {
      const q = searchQuery.toLowerCase().trim();
      if (q && !asset.name.toLowerCase().includes(q) && !asset.description?.toLowerCase().includes(q)) return false;
      if (categoryFilter && asset.category !== categoryFilter) return false;
      if (availabilityFilter === 'available' && (asset.available_count ?? 0) === 0) return false;
      if (availabilityFilter === 'unavailable' && (asset.available_count ?? 0) > 0) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sortBy.column) {
        case 'name':             aVal = a.name.toLowerCase();           bVal = b.name.toLowerCase();           break;
        case 'category':         aVal = a.category.toLowerCase();       bVal = b.category.toLowerCase();       break;
        case 'total_quantity':   aVal = a.total_quantity;               bVal = b.total_quantity;               break;
        case 'default_condition':aVal = a.default_condition;            bVal = b.default_condition;            break;
        default: return 0;
      }
      if (aVal < bVal) return sortBy.ascending ? -1 : 1;
      if (aVal > bVal) return sortBy.ascending ? 1 : -1;
      return 0;
    });

  const handleSort = (column: string) => {
    setSortBy(prev => prev.column === column
      ? { column, ascending: !prev.ascending }
      : { column, ascending: true }
    );
  };

  const getSortIcon = (column: string) => {
    if (sortBy.column !== column) return <ChevronUpDownIcon className="w-4 h-4" />;
    return sortBy.ascending ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />;
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm({
      name: '', category: 'Other', description: '',
      total_quantity: 1, default_condition: 'good',
      image_url: null, biro_id: userBiroId,
    });
    setImageFile(null); setFormError(null);
    setModal({ open: true, editing: null });
  };

  const openEdit = (asset: Asset) => {
    setForm({
      name: asset.name, category: asset.category,
      description: asset.description, total_quantity: asset.total_quantity,
      default_condition: asset.default_condition, image_url: asset.image_url,
      biro_id: asset.biro_id,
    });
    setImageFile(null); setFormError(null);
    setModal({ open: true, editing: asset });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  // ── File upload ───────────────────────────────────────────────────────────────

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('asset-images').upload(path, file, { upsert: true });
    if (error) { console.error('Upload error:', error); return null; }
    return supabase.storage.from('asset-images').getPublicUrl(path).data.publicUrl;
  };

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name || !form.category) {
      setFormError('Sila isi semua ruangan yang bertanda *'); return;
    }
    setSaving(true); setFormError(null);

    let imageUrl = form.image_url;
    if (imageFile) {
      const compressed = await compressImage(imageFile);
      imageUrl = await uploadFile(compressed);
      if (!imageUrl) { setFormError('Gagal memuat naik gambar.'); setSaving(false); return; }
    }

    const payload = { ...form, image_url: imageUrl };

    if (modal.editing) {
      const { error } = await supabase.from('assets').update(payload).eq('id', modal.editing.id);
      if (error) { setFormError('Gagal mengemaskini aset.'); setSaving(false); return; }

      // If total_quantity changed, sync asset_instances
      if (form.total_quantity !== modal.editing.total_quantity) {
        const { data: existingInstances } = await supabase
          .from('asset_instances')
          .select('id, instance_number')
          .eq('asset_id', modal.editing.id)
          .order('instance_number', { ascending: true });

        const currentCount = existingInstances?.length ?? 0;
        const newCount = form.total_quantity;

        if (newCount > currentCount) {
          // Add new instances
          const newInstances = Array.from({ length: newCount - currentCount }, (_, i) => ({
            asset_id: modal.editing!.id,
            instance_number: currentCount + i + 1,
            condition: form.default_condition,
          }));
          await supabase.from('asset_instances').insert(newInstances);
        } else if (newCount < currentCount) {
          // Remove excess instances (only unloaned ones)
          const toRemove = existingInstances?.slice(newCount).map(i => i.id) ?? [];
          if (toRemove.length > 0) {
            await supabase.from('asset_instances').delete().in('id', toRemove);
          }
        }
      }
    } else {
      const { data: newAsset, error } = await supabase
        .from('assets').insert(payload).select().single();
      if (error) { setFormError('Gagal menambah aset.'); setSaving(false); return; }

      // Auto-create asset_instances based on total_quantity
      const instances = Array.from({ length: form.total_quantity }, (_, i) => ({
        asset_id: newAsset.id,
        instance_number: i + 1,
        condition: form.default_condition,
      }));
      await supabase.from('asset_instances').insert(instances);
    }

    setSaving(false); closeModal(); fetchAssets();
  };

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const asset = assets.find(a => a.id === id);
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) { console.error('Delete error:', error); return; }

    if (asset?.image_url) {
      const path = asset.image_url.split('/asset-images/')[1];
      if (path) await supabase.storage.from('asset-images').remove([path]);
    }

    setAssets(prev => prev.filter(a => a.id !== id));
    setDeleteModal({ show: false, id: null });
  };

  // ── Export ────────────────────────────────────────────────────────────────────

  const exportToExcel = () => {
    const rows = filteredAssets.map(asset => ({
      Nama:          asset.name,
      Kategori:      asset.category,
      'Jumlah Unit': asset.total_quantity,
      Tersedia:      asset.available_count ?? 0,
      Keadaan:       CONDITION_COLORS[asset.default_condition].label,
      // 🌟 Add this line to include Biro in your Excel downloads:
      Biro:          biroList.find(b => b.id === asset.biro_id)?.name ?? 'Umum/Tiada',
      Penerangan:    asset.description ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Senarai Aset');
    XLSX.writeFile(wb, 'Laporan_Aset.xlsx');
  };

  // ── Guard ─────────────────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
    <div className="p-4 text-center text-gray-500 mt-20">
      <p className="text-4xl mb-2">🚫</p>
      <p className="font-semibold text-gray-700">Akses Ditolak</p>
      <p className="text-sm mt-1">Anda tidak mempunyai akses ke halaman ini.</p>
    </div>
  );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    // 1. Root container commands full-width layouts across standard grids
    <div className="w-full text-left pb-20">
      
      {/* Header Section Container - Clean layout block for action items */}
      <div className="w-full flex flex-col items-center text-center mb-6 gap-4">
        
        {/* Buttons / Actions Row - Balanced and centered perfectly right beneath parent page tabs */}
        <div className="flex gap-2 w-full sm:w-auto justify-center items-center">
          <button onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-semibold text-sm shadow-sm transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" /> Export
          </button>
          
          <button onClick={openAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-sm transition-colors">
            <PlusIcon className="w-4 h-4" /> Tambah Aset
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Cari mengikut nama atau penerangan..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
            className="w-full py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <select value={categoryFilter ?? ''} onChange={e => setCategoryFilter(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Semua Kategori</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">Semua Status</option>
              <option value="available">Tersedia</option>
              <option value="unavailable">Tidak Tersedia</option>
            </select>
          </div>

          <div className="flex gap-1 border border-gray-300 rounded-lg p-1 bg-white">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-700'}`}>
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-700'}`}>
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Result count */}
      {(searchQuery.trim() || categoryFilter || availabilityFilter !== 'all') && (
        <p className="text-xs text-gray-500 mb-3">
          {filteredAssets.length === 0 ? 'Tiada aset dijumpai' : `${filteredAssets.length} aset dijumpai`}
        </p>
      )}

      {/* ── Grid View ─────────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Memuatkan...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">📦</p>
              <p>Tiada aset. Tambah aset pertama anda!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                  {asset.image_url ? (
                    <img src={asset.image_url} alt={asset.name} className="w-full h-40 object-cover bg-gray-100" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                      <PhotoIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{asset.name}</h3>
                      <p className="text-xs text-gray-500">{asset.category}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        <span className="font-semibold">Tersedia:</span>{' '}
                        <span className={(asset.available_count ?? 0) > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {asset.available_count ?? 0}
                        </span>
                        <span className="text-gray-400"> / {asset.total_quantity}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full font-medium text-xs ${CONDITION_COLORS[asset.default_condition].bg} ${CONDITION_COLORS[asset.default_condition].text}`}>
                        {CONDITION_COLORS[asset.default_condition].label}
                      </span>
                    </div>
                    {asset.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{asset.description}</p>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => { setInstancesModal({ open: true, asset }); fetchAssetInstances(asset.id); }}
                        className="flex-1 py-1.5 text-gray-600 hover:bg-gray-50 rounded text-xs font-medium border border-gray-200 transition">
                        Lihat Unit
                      </button>
                      <button onClick={() => openEdit(asset)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteModal({ show: true, id: asset.id })}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── List View ─────────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Memuatkan...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">📦</p>
              <p>Tiada aset. Tambah aset pertama anda!</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">Nama {getSortIcon('name')}</div>
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-2">Kategori {getSortIcon('category')}</div>
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('total_quantity')}>
                    <div className="flex items-center gap-2">Unit {getSortIcon('total_quantity')}</div>
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('default_condition')}>
                    <div className="flex items-center gap-2">Keadaan {getSortIcon('default_condition')}</div>
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Tersedia</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Biro</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {asset.image_url ? (
                          <img src={asset.image_url} alt={asset.name}
                            className="w-10 h-10 rounded object-cover shrink-0 hidden sm:block" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0 hidden sm:flex">
                            <PhotoIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">{asset.name}</div>
                          <div className="md:hidden text-xs text-gray-500">
                            {asset.category} · {asset.available_count ?? 0}/{asset.total_quantity} tersedia
                          </div>
                          {asset.biro_id && (
                              <div className="text-[11px] font-medium text-gray-400">
                                <span className="font-semibold text-gray-500">Biro:</span>{' '}
                                {biroList.find(b => b.id === asset.biro_id)?.name ?? '—'}
                              </div>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 hidden md:table-cell">{asset.category}</td>
                    <td className="p-4 text-sm text-gray-600 hidden md:table-cell">{asset.total_quantity}</td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CONDITION_COLORS[asset.default_condition].bg} ${CONDITION_COLORS[asset.default_condition].text}`}>
                        {CONDITION_COLORS[asset.default_condition].label}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={`text-sm font-semibold ${(asset.available_count ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {asset.available_count ?? 0} / {asset.total_quantity}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 hidden lg:table-cell">
                      {biroList.find(b => b.id === asset.biro_id)?.name ?? '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setInstancesModal({ open: true, asset }); fetchAssetInstances(asset.id); }}
                          className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition text-xs font-medium border border-gray-200">
                          Unit
                        </button>
                        <button onClick={() => openEdit(asset)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setDeleteModal({ show: true, id: asset.id })}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ───────────────────────────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92dvh] flex flex-col overflow-x-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                {modal.editing ? 'Kemaskini Aset' : 'Tambah Aset Baru'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-5 space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nama Aset" required>
                  <input className={inputCls} placeholder="cth. Kerusi Lipat"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Field>
                <Field label="Kategori" required>
                  <select className={inputCls} value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Biro Bertanggungjawab">
                {isSuperAdmin ? (
                  <select
                    className={inputCls}
                    value={form.biro_id ?? ''}
                    onChange={e => setForm(f => ({ ...f, biro_id: e.target.value || null }))}
                  >
                    <option value="">— Tiada Biro —</option>
                    {biroList.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 flex items-center justify-between">
                    <span>{biroList.find(b => b.id === form.biro_id)?.name ?? '— Tiada Biro —'}</span>
                    <span className="text-xs text-gray-400 ml-2">Hanya superadmin boleh ubah</span>
                  </div>
                )}
              </Field>

              <Field label="Penerangan">
                <textarea className={`${inputCls} resize-none`} rows={3}
                  placeholder="Huraian ringkas tentang aset..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Jumlah Unit" required>
                  <input type="number" min="1" className={inputCls}
                    value={form.total_quantity}
                    onChange={e => setForm(f => ({ ...f, total_quantity: parseInt(e.target.value) || 1 }))} />
                </Field>
                <Field label="Keadaan" required>
                  <select className={inputCls} value={form.default_condition}
                    onChange={e => setForm(f => ({ ...f, default_condition: e.target.value as Condition }))}>
                    <option value="excellent">Sempurna</option>
                    <option value="good">Baik</option>
                    <option value="fair">Sederhana</option>
                    <option value="needs_repair">Perlu Servis</option>
                  </select>
                </Field>
              </div>

              <Field label="Gambar Aset">
                <UploadZone
                  accept=".jpg,.jpeg,.png,.webp" file={imageFile}
                  existingUrl={form.image_url} onFileChange={setImageFile}
                  icon={<PhotoIcon className="w-6 h-6 mx-auto" />}
                  placeholder="Klik untuk muat naik gambar" hint="JPG, PNG, WEBP — maks 5MB"
                  existingLabel="Gambar sedia ada" previewImage />
              </Field>

              {modal.editing && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700 font-medium">
                    Menukar jumlah unit akan menambah atau membuang rekod unit secara automatik.
                    Unit yang sedang dipinjam tidak akan dipadam.
                  </p>
                </div>
              )}

              {formError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={closeModal}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition text-sm">
                {saving ? 'Menyimpan...' : modal.editing ? 'Kemaskini' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Instances Modal ────────────────────────────────────────────────────── */}
      {instancesModal.open && instancesModal.asset && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Unit — {instancesModal.asset.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{instancesModal.asset.total_quantity} unit jumlah</p>
              </div>
              <button onClick={() => setInstancesModal({ open: false, asset: null })}
                className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {loadingInstances ? (
                <div className="text-center text-gray-400 py-8">Memuatkan unit...</div>
              ) : instances.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Tiada unit dijumpai.</div>
              ) : (
                instances.map(instance => {
                  const activeLoan = instance.asset_loans?.find(l => !l.actual_return_date);
                  return (
                    <div key={instance.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800 text-sm">Unit #{instance.instance_number}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CONDITION_COLORS[instance.condition].bg} ${CONDITION_COLORS[instance.condition].text}`}>
                            {CONDITION_COLORS[instance.condition].label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeLoan ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {activeLoan ? 'Dipinjam' : 'Tersedia'}
                          </span>
                        </div>
                      </div>
                      {activeLoan && (
                        <div className="text-xs text-gray-600 space-y-0.5 bg-amber-50 rounded-lg p-2">
                          <p><span className="font-semibold">Peminjam:</span> {activeLoan.borrower_name}</p>
                          {activeLoan.borrower_email && (
                            <p><span className="font-semibold">E-mel:</span> {activeLoan.borrower_email}</p>
                          )}
                          <p><span className="font-semibold">Tarikh Pinjam:</span> {new Date(activeLoan.borrow_date).toLocaleDateString('ms-MY')}</p>
                        </div>
                      )}
                      {instance.notes && (
                        <p className="text-xs text-gray-500 mt-1">{instance.notes}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ───────────────────────────────────────────────────────── */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <ExclamationTriangleIcon className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold">Padam Aset?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Tindakan ini tidak boleh dibatalkan. Semua unit dan rekod pinjaman akan dipadam.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ show: false, id: null })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm">
                Batal
              </button>
              <button onClick={() => deleteModal.id && handleDelete(deleteModal.id)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition text-sm">
                Ya, Padam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManager;