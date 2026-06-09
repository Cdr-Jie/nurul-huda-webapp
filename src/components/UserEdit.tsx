import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, authClient } from '../lib/auth-client';
import { supabase } from '../supabaseClient';
import { passwordSchema } from '../lib/validation';

type Role = "user" | "admin" | "financeadmin" | "superadmin";

interface ExtendedUser {
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  position?: string;
  biro_id?: string;
}

interface Biro {
  id: string;
  name: string;
}

const Field = ({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

const UserEdit = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [biros, setBiros] = useState<Biro[]>([]);
  const [passwordError, setPasswordError] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as Role, 
    position: '',
    biro_id: '',
    password: '' 
  });

  const hasPermission = session?.user?.role && ["admin", "financeadmin", "superadmin"].includes(session?.user?.role);

  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => setFeedback({ type: null, message: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback.message]);

  useEffect(() => {
    const fetchBiros = async () => {
      try {
        const { data, error } = await supabase
          .from('biro')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        setBiros(data);
      } catch (error) {
        console.error("Gagal memuat turun senarai biro:", error);
      }
    };

    fetchBiros();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      setIsLoading(true);
      
      try {
        const { data, error } = await authClient.admin.getUser({
          query: { id: userId }
        });

        if (error) throw error;

        if (data) {
          const userObj = data as ExtendedUser; 
          
          setFormData({
            name: userObj.name || '',
            email: userObj.email || '',
            phone: userObj.phone || '',
            role: (userObj.role as Role) || 'user',
            position: userObj.position || '',
            biro_id: userObj.biro_id || '',
            password: '' 
          });
        }
      } catch (error) {
        console.error("Gagal memuat turun maklumat pengguna:", error);
        setFeedback({ type: 'error', message: 'Gagal memuat turun profil pengguna. Pengguna mungkin tidak wujud.' });
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      fetchUser();
    }
  }, [userId, hasPermission]);

  const handleSave = async () => {
    setIsSaving(true);
    setPasswordError('');

    try {
      if (!userId) throw new Error("ID pengguna tidak dijumpai.");

      // Validate password if provided
      if (formData.password.trim().length > 0) {
        const passwordValidation = passwordSchema.safeParse(formData.password);
        if (!passwordValidation.success) {
          const errorMessage = passwordValidation.error?.errors?.[0]?.message || 'Kata laluan tidak memenuhi keperluan';
          setPasswordError(errorMessage);
          setIsSaving(false);
          return;
        }
      }

      // Update user data including email
      const updateData: Record<string, string> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        biro_id: formData.biro_id,
      };

      const { error: updateError } = await authClient.admin.updateUser({
        userId: userId,
        data: updateData
      });

      if (updateError) throw updateError;

      // Update Role
      const { error: roleError } = await authClient.admin.setRole({
        userId: userId,
        role: formData.role
      });

      if (roleError) throw roleError;

      // Reset Password
      if (formData.password.trim().length > 0) {
        const { error: passwordUpdateError } = await authClient.admin.setUserPassword({
          userId: userId,
          newPassword: formData.password
        });
        
        if (passwordUpdateError) throw passwordUpdate
        if (passwordError) throw passwordError;
      }

      setFeedback({ type: 'success', message: 'Maklumat pengguna berjaya dikemas kini!' });

      if (formData.password) {
        setFormData(prev => ({ ...prev, password: '' }));
      }

    } catch (error: unknown) { 
      console.error("Error updating user:", error);
      const err = error as { error?: { message?: string }, message?: string };
      const errorMessage = err?.error?.message || err?.message || "Ralat semasa menyimpan. Sila cuba lagi.";
      setFeedback({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (isSessionPending || isLoading) {
    return (
      <div className="p-8 text-center text-gray-400">Memuatkan...</div>
    );
  }

  if (!hasPermission) {
    return (
       <div className="w-full text-center py-20 text-gray-400">
         Anda tidak mempunyai kebenaran untuk melihat halaman ini.
       </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nama Penuh" required>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="E-mel" required>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="No. Telefon">
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputCls}
              placeholder="+60123456789"
            />
          </Field>

          <Field label="Peranan Sistem" required>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              className={inputCls}
            >
              <option value="user">Pengguna Biasa</option>
              <option value="admin">Admin</option>
              <option value="financeadmin">Admin Kewangan</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </Field>

          <Field label="Jawatan AJK">
            <input 
              type="text" 
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className={inputCls}
              placeholder="Contoh: Pengerusi"
            />
          </Field>

          <Field label="Biro">
            <select 
              value={formData.biro_id}
              onChange={(e) => setFormData({ ...formData, biro_id: e.target.value })}
              className={inputCls}
            >
              <option value="">-- Pilih Biro --</option>
              {biros.map((biro) => (
                <option key={biro.id} value={biro.id}>
                  {biro.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="my-6 border-t border-gray-100"></div>

        <Field label="Tetapkan Semula Kata Laluan (Pilihan)">
          <p className="text-xs text-gray-400 mb-2">Biarkan kosong jika anda tidak mahu menukar kata laluan pengguna ini.</p>
          <input 
            type="password" 
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              setPasswordError('');
            }}
            className={`${inputCls} sm:w-1/2`}
            placeholder="Kata laluan baru..."
          />
          {passwordError && (
            <p className="text-xs text-red-500 mt-1">{passwordError}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            • Minimal 8 aksara<br />
            • Sekurang-kurangnya satu aksara khas (!@#$%^&* dll)
          </p>
        </Field>

        {feedback.message && (
          <p className={`text-sm font-semibold border rounded-lg px-3 py-2 mt-4 ${
            feedback.type === 'error' ? 'text-red-500 bg-red-50 border-red-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'
          }`}>
            {feedback.message}
          </p>
        )}
      </div>

      <div className="p-5 border-t border-gray-100 flex gap-3">
        <button 
          onClick={() => navigate(-1)}
          disabled={isSaving}
          className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
        >
          Batal
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition text-sm"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
};

export default UserEdit;