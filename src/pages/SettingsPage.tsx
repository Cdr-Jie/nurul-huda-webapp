import SettingsManagement from "../components/SettingsManagement";

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-8 border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your profile, security keys, and connected accounts.
          </p>
        </div>

        {/* Core Component */}
        <SettingsManagement />
        
      </div>
    </div>
  );
};

export default SettingsPage;