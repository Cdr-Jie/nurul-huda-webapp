import { useState } from 'react';
import UserManagement from "../components/UserManagement";
import BiroManagement from "../components/BiroManagement";
import { UsersIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

type ActiveTab = 'pengguna' | 'biro';

const UserPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pengguna');

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-8">

      {/* Tab toggle */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit">
          {([
            { key: 'pengguna', label: 'Pengguna', icon: UsersIcon },
            { key: 'biro',     label: 'Biro',     icon: BuildingOfficeIcon },
          ] as { key: ActiveTab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'pengguna' && <UserManagement />}
      {activeTab === 'biro'     && <BiroManagement />}
    </div>
  );
};

export default UserPage;