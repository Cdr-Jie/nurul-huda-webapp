import { Link } from "react-router-dom";
import NewSettingsManagement from "../components/NewSettingsManagement";

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button */}
        <div className="w-full flex justify-start mb-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors group"
          >
            <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Laman Utama
          </Link>
        </div>
        
        {/* Page Header */}
        <div className="mb-8 flex flex-col items-center text-center mt-4">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tetapan Akaun</h1>
          <p className="mt-2 text-sm text-gray-500">
            Urus profil, keselamatan dan akaun bersambung anda.
          </p>
        </div>

        {/* Core Component */}
        <NewSettingsManagement />
        
      </div>
    </div>
  );
};

export default SettingsPage;