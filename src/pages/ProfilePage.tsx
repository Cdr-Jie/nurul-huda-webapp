import { useState, useEffect, useRef } from 'react';
import { useSession, authClient } from '../lib/auth-client';
import { compressImage } from '../utils/imageUpload';
import { supabase } from '../supabaseClient';

// Helper function to capitalize each word in the name
const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

const ProfilePage = () => {
  const { data: session, isPending, refetch } = useSession();
  
  // Local state for the Live Preview and form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    image: '', 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [biroName, setBiroName] = useState<string>('Memuatkan...'); 
  
  // New state to replace window.alert()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-hide feedback messages after 5 seconds
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback.message]);

  // Populate form data once the session loads
  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: capitalizeWords(session.user.name),
        phone: session.user.phone || '',
        image: session.user.image || '',
      });
    }
  }, [session]);

  // Fetch the actual Biro name from Supabase using the biro_id
  useEffect(() => {
    const fetchBiroName = async () => {
      if (session?.user?.biro_id) {
        try {
          const { data, error } = await supabase
            .from('biro')
            .select('name')
            .eq('id', session.user.biro_id)
            .single();

          if (error) throw error;
          setBiroName(data?.name || 'Tiada rekod');
        } catch (error) {
          console.error("Failed to fetch Biro:", error);
          setBiroName('Ralat memuatkan');
        }
      } else {
        setBiroName('Tiada rekod');
      }
    };

    fetchBiroName();
  }, [session?.user?.biro_id]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mb-4"></div>
        <p className="text-sm text-slate-500 font-medium">Memuatkan profil...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
        <p className="text-slate-500 font-medium">Pengguna tidak dijumpai.</p>
      </div>
    );
  }

  const { user } = session;
  
  const dateJoined = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Tidak diketahui';

  const previewName = capitalizeWords(formData.name) || capitalizeWords(user.name);
  const previewPhone = formData.phone || user.phone || 'Tiada rekod';
  const previewImage = formData.image || user.image;

  // Handle image selection, validation, and compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback({ type: null, message: '' }); // Clear any existing feedback

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate max size of 2MB
      if (file.size > 2 * 1024 * 1024) {
        setFeedback({ type: 'error', message: "Saiz gambar melebihi 2MB. Sila pilih gambar yang lebih kecil." });
        if (fileInputRef.current) fileInputRef.current.value = ''; 
        return;
      }

      const compressed = await compressImage(file);
      setImageFile(compressed);
      
      const previewUrl = URL.createObjectURL(compressed);
      setFormData((prev) => ({ ...prev, image: previewUrl }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback({ type: null, message: '' });

    try {
      let finalImageUrl = formData.image;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);

        const uploadResponse = await fetch("http://localhost:3001/api/upload-profile-image", {
          method: "POST",
          body: uploadData,
          credentials: "include", 
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Gagal memuat naik gambar ke pelayan.");
        }

        const { publicUrl } = await uploadResponse.json();
        finalImageUrl = publicUrl;
      }

      await authClient.updateUser({
        name: formData.name,
        image: finalImageUrl,
        phone: formData.phone,
      } as any);

      await refetch();
      
      if (imageFile) {
        URL.revokeObjectURL(formData.image);
        setImageFile(null);
      }
      
      setFeedback({ type: 'success', message: "Profil berjaya dikemas kini!" });
    } catch (error: any) {
      console.error("Gagal menyimpan profil:", error);
      setFeedback({ type: 'error', message: error.message || "Ralat semasa menyimpan profil. Sila cuba lagi." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ 
      name: capitalizeWords(user.name), 
      phone: user.phone || '',
      image: user.image || ''
    });
    setFeedback({ type: null, message: '' }); // Clear messages on cancel

    if (imageFile) {
      URL.revokeObjectURL(formData.image);
      setImageFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tetapan Profil</h1>
          <p className="mt-2 text-sm text-slate-500">Urus tetapan akaun anda dan lihat pratonton profil secara langsung.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          
          {/* LEFT COLUMN: Edit Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Maklumat Asas</h3>
                <p className="text-sm text-slate-500 mt-1">Kemas kini maklumat peribadi dan gambar profil anda.</p>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Editable: Profile Picture */}
                <div className="space-y-3">
                  <label className="text-sm font-medium leading-none text-slate-900">
                    Gambar Profil
                  </label>
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center text-indigo-600 font-bold text-xl uppercase shadow-sm">
                      {previewImage ? (
                        <img src={previewImage} alt="Pratonton Profil" className="h-full w-full object-cover" />
                      ) : (
                        <span>{previewName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm w-fit"
                      >
                        Tukar Gambar
                      </button>
                      <p className="text-[11px] text-slate-500">JPG, PNG atau GIF (Maks. 2MB)</p>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Editable: Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900">
                    Nama Penuh
                  </label>
                  <input 
                    id="name"
                    type="text" 
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (feedback.type) setFeedback({ type: null, message: '' }); // Clear error on type
                    }}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-colors"
                    placeholder="Masukkan nama penuh anda"
                  />
                </div>

                {/* Editable: Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900">
                    Nombor Telefon
                  </label>
                  <input 
                    id="phone"
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (feedback.type) setFeedback({ type: null, message: '' }); // Clear error on type
                    }}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-colors"
                    placeholder="+60123456789"
                  />
                </div>

                <div className="my-6 border-t border-slate-100"></div>

                {/* Read-Only: Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-900">Alamat Emel</label>
                  <input 
                    type="text" 
                    value={user.email} 
                    disabled 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* Read-Only: Jawatan */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-900 flex items-center justify-between">
                    Jawatan
                    <span className="text-[10px] uppercase tracking-wider font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Dikunci</span>
                  </label>
                  <input 
                    type="text" 
                    value={user.position || 'Tiada rekod'} 
                    disabled 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 cursor-not-allowed"
                  />
                </div>

                {/* Read-Only: Biro */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-900 flex items-center justify-between">
                    Biro / Jabatan
                    <span className="text-[10px] uppercase tracking-wider font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Dikunci</span>
                  </label>
                  <input 
                    type="text" 
                    value={biroName} 
                    disabled 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 cursor-not-allowed"
                  />
                </div>

              </div>

              {/* Action Footer with Inline Feedback */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Feedback Message Area */}
                <div className="flex-1 w-full text-left">
                  {feedback.message && (
                    <p className={`text-sm font-medium animate-in fade-in slide-in-from-bottom-1 ${
                      feedback.type === 'error' ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {feedback.message}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 w-full sm:w-auto">
                  <button 
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-100 h-10 py-2 px-4 border border-slate-200 text-slate-700"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 disabled:pointer-events-none bg-zinc-900 text-slate-50 hover:bg-zinc-900/90 h-10 py-2 px-4 shadow"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Preview Card (Sticky) */}
          <div className="lg:col-span-2 lg:sticky lg:top-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Pratonton Langsung
                </h3>
              </div>

              {/* ID Card Visual */}
              <div className="p-6 flex flex-col items-center text-center">
                
                <div className="relative mb-5">
                  <div className="h-28 w-28 rounded-2xl ring-4 ring-slate-50 bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-bold uppercase overflow-hidden shadow-lg border border-slate-100">
                    {previewImage ? (
                      <img src={previewImage} alt={previewName} className="h-full w-full object-cover" />
                    ) : (
                      <span>{previewName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-0.5 text-[10px] font-semibold text-white uppercase tracking-widest shadow-sm">
                      {user.role || 'User'}
                    </span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mt-2 mb-1 truncate w-full px-2">
                  {previewName || 'Nama Pengguna'}
                </h2>
                <p className="text-sm text-slate-500 mb-6">{user.email}</p>

                <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-slate-100 pt-6">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Jawatan</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{user.position || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Biro / Jabatan</p>
                    <p className="text-sm font-medium text-slate-900 truncate" title={biroName}>{biroName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">No. Telefon</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{previewPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tarikh Daftar</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{dateJoined}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;