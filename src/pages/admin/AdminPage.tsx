import { Link } from "react-router-dom";
import AdminDashboard from "../../components/AdminDashboard";
import { authClient } from "../../lib/auth-client";

const AdminPage = () => {
  // 1. Fetch the current session
  const { data: session, isPending } = authClient.useSession();

  // 2. Verify if the user has an admin-level role (which grants the view permission)
  const isAdmin = session?.user?.role && ["admin", "financeadmin", "superadmin"].includes(session.user.role);

  // State 1: Verifying session
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium animate-pulse">Verifying access...</p>
      </div>
    );
  }

  // State 2: Access Denied (Forbidden)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md border border-red-200 bg-red-50 rounded-md p-8 text-center shadow-sm">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-800">Access Denied</h2>
          <p className="text-sm text-red-600 mt-2 mb-6">
            You do not have the required <code className="bg-red-100 px-1 py-0.5 rounded text-red-700">admin: ["view"]</code> permissions to access the dashboard.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Authorized
  return (
    <div className="min-h-screen bg-gray-50">
        <AdminDashboard />
    </div>
  );
}

export default AdminPage;