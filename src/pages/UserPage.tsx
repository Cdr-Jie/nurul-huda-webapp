import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import UserManagement from "../components/UserManagement";
import BiroManagement from "../components/BiroManagement";
import { UsersIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

type ActiveTab = 'pengguna' | 'biro';

const UserPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pengguna');
  const { data: session, isPending } = authClient.useSession();
  const userRole = (session?.user as any)?.role ?? 'user';

  const canAccessUsers = ['admin', 'financeadmin', 'superadmin'].includes(userRole);
  const canAccessBiro  = userRole === 'superadmin';

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Mengesahkan kebenaran...</p>
      </div>
    );
  }

  // ── No access to page at all ─────────────────────────────────────────────
  if (!canAccessUsers) {
    return <Navigate to="/" replace />;
  }

  // ── If somehow on biro tab but not superadmin, snap back to pengguna ─────
  if (activeTab === 'biro' && !canAccessBiro) {
    setActiveTab('pengguna');
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-8">

      {/* Tab toggle */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('pengguna')}
            className={`flex items-center gap-2 flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'pengguna'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            Pengguna
          </button>

          {/* Only render Biro tab for superadmin */}
          {canAccessBiro && (
            <button
              onClick={() => setActiveTab('biro')}
              className={`flex items-center gap-2 flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'biro'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BuildingOfficeIcon className="w-4 h-4" />
              Biro
            </button>
          )}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'pengguna' && <UserManagement />}

      {/* Double-check canAccessBiro before rendering — even if tab state is wrong */}
      {activeTab === 'biro' && canAccessBiro && <BiroManagement />}
    </div>
  );
};

export default UserPage;