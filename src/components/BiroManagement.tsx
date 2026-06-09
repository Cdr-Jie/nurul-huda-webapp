import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ChevronLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

interface Biro {
  id: string;
  name: string;
  created_at: string;
}

const BiroManagement = () => {
  const [biros, setBiros] = useState<Biro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => setFeedback({ type: null, message: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback.message]);

  const fetchBiros = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("biro")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setBiros(data as Biro[]);
    } catch (error) {
      console.error("Failed to fetch biros:", error);
      setFeedback({ type: 'error', message: 'Gagal memuat turun data biro.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBiros();
  }, [fetchBiros]);

  const handleOpenModal = (biro?: Biro) => {
    if (biro) {
      setEditingId(biro.id);
      setFormData({ name: biro.name });
    } else {
      setEditingId(null);
      setFormData({ name: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "" });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Sila masukkan nama biro.' });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("biro")
          .update({ name: formData.name })
          .eq("id", editingId);

        if (error) throw error;
        setFeedback({ type: 'success', message: 'Biro berjaya dikemas kini!' });
      } else {
        const { error } = await supabase
          .from("biro")
          .insert([{ name: formData.name }]);

        if (error) throw error;
        setFeedback({ type: 'success', message: 'Biro berjaya ditambah!' });
      }

      await fetchBiros();
      handleCloseModal();
    } catch (error: unknown) {
      console.error("Error saving biro:", error);
      const err = error as { message?: string };
      setFeedback({ type: 'error', message: err?.message || 'Ralat semasa menyimpan.' });
    }
  };

  const handleDelete = async (biroId: string) => {
    if (!globalThis.confirm("Adakah anda pasti mahu memadam biro ini?")) return;

    try {
      const { error } = await supabase
        .from("biro")
        .delete()
        .eq("id", biroId);

      if (error) throw error;
      setFeedback({ type: 'success', message: 'Biro berjaya dipadamkan!' });
      await fetchBiros();
    } catch (error: unknown) {
      console.error("Error deleting biro:", error);
      const err = error as { message?: string };
      setFeedback({ type: 'error', message: err?.message || 'Ralat semasa memadamkan.' });
    }
  };

  const filteredBiros = biros.filter(biro =>
    biro.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-center text-gray-400">
        Memuatkan...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto pb-20 text-left">
      <div className="w-full flex justify-start mb-2">
        <Link 
          to="/admin" 
          className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors group"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Menu Pengurusan
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900">Pengurusan Biro</h1>
          <p className="text-gray-500 text-sm">Urus senarai biro organisasi</p>
        </div>

        <div className="flex w-full sm:w-auto">
          <button 
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm transition"
          >
            <PlusIcon className="w-4 h-4" /> Tambah Biro
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari biro..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
          className="w-full py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {feedback.message && (
        <p className={`text-sm font-semibold border rounded-lg px-3 py-2 mb-4 ${
          feedback.type === 'error' ? 'text-red-500 bg-red-50 border-red-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'
        }`}>
          {feedback.message}
        </p>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Biro</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dibuat</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBiros.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-400">
                    Tiada biro dijumpai
                  </td>
                </tr>
              ) : (
                filteredBiros.map((biro) => (
                  <tr key={biro.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{biro.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(biro.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(biro)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Sunting
                      </button>
                      <button
                        onClick={() => handleDelete(biro.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Padam
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92dvh] flex flex-col overflow-x-hidden animate-in zoom-in-95 slide-in-from-bottom-2 sm:slide-in-from-bottom-0">
            
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Sunting Biro' : 'Tambah Biro Baru'}</h2>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 sm:px-5 py-5 space-y-4 flex-1">
              <div>
                <label htmlFor="biroName" className="block text-sm font-semibold text-gray-700 mb-1">
                  Nama Biro <span className="text-red-500">*</span>
                </label>
                <input 
                  id="biroName"
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Contoh: Biro Dakwah"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button 
                onClick={handleCloseModal}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
              >
                Batal
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiroManagement;
