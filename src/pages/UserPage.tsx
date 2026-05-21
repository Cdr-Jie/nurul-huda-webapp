import UserManagement from "../components/UserManagement";

const UserPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <UserManagement />
      </div>
    </div>
  );
};

export default UserPage;