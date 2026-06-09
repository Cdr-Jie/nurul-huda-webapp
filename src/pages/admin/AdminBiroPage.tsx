import BiroManagement from "../../components/BiroManagement";
import { authClient } from "../../lib/auth-client";

const AdminBiroPage = () => {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const hasPermission = session?.user?.role && ["admin", "financeadmin", "superadmin"].includes(session?.user?.role);

  if (isSessionPending) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-center text-gray-400">
        Memuatkan...
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="p-4 max-w-4xl mx-auto pb-20 text-left">
        <div className="border border-red-200 bg-red-50 rounded-2xl p-8 text-center shadow-sm mt-4">
          <h2 className="text-lg font-bold text-red-800">403 Akses Ditolak</h2>
          <p className="text-sm text-red-600 mt-1">
            Anda tidak mempunyai kebenaran pentadbir untuk melihat halaman ini.
          </p>
        </div>
      </div>
    );
  }

  return <BiroManagement />;
};

export default AdminBiroPage;
