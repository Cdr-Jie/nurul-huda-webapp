import { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import AssetManager from '../../components/AssetManager';
import AssetLoanManager from '../../components/AssetLoanManager';

type ActiveTab = 'aset' | 'pinjaman';

const AssetPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('aset');

  return (
    <div className="p-4 max-w-7xl mx-auto pb-20">
      {/* Back */}
      <div className="w-full flex justify-start mb-2">
        <button onClick={() => window.history.back()}
          className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors group">
          <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Menu Pengurusan
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aset Masjid</h1>
        <p className="text-gray-500 text-sm">Urus aset dan rekod pinjaman</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-full sm:w-fit">
        {([
          { key: 'aset',     label: 'Pengurusan Aset' },
          { key: 'pinjaman', label: 'Rekod Pinjaman'  },
        ] as { key: ActiveTab; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'aset'     && <AssetManager />}
      {activeTab === 'pinjaman' && <AssetLoanManager />}
    </div>
  );
};

export default AssetPage;