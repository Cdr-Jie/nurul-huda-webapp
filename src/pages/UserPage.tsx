import UserManagement from "../components/UserManagement";

const UserPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <UserManagement />
      </div>
    </div>
  );
};

export default UserPage;