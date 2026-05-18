import UserManagement from "../components/UserManagement";

const UserPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View, modify roles, revoke sessions, and manage access for all registered users.
          </p>
        </div>
        
        <UserManagement />
      </div>
    </div>
  );
};

export default UserPage;