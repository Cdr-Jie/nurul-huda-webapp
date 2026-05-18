import { useState, useEffect } from "react";
import { authClient } from "../lib/auth-client";
import UserRow from "./UserRow";
import { Link } from "react-router-dom";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // Default to 20
  const [totalUsers, setTotalUsers] = useState(0);
  
  // 1. Get session and verify admin permission
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const hasPermission = session?.user?.role && ["admin", "financeadmin", "superadmin"].includes(session?.user?.role);

  // 2. Debounce the search query to prevent spamming the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); 
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = debouncedSearch.trim().length > 0;

  // 3. Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await authClient.admin.listUsers({
        query: {
          limit: isSearching ? 1000 : pageSize, 
          offset: isSearching ? 0 : (page - 1) * pageSize, 
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });
      
      if (response.data) {
        setUsers(response.data.users);
        setTotalUsers(response.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };
  

  // 4. Trigger fetch when session loads, page changes, search status changes, OR pageSize changes
  useEffect(() => {
    if (!isSessionPending && hasPermission) {
      fetchUsers();
    }
  }, [isSessionPending, hasPermission, page, isSearching, pageSize]);

  // Client-side filtering logic for search
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalUsers / pageSize);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1); // Always reset to page 1 when changing how many rows to display
  };

  // --- RENDERING STATES ---

  if (isSessionPending) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-12 px-4 text-center">
        <p className="text-gray-500">Verifying permissions...</p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-6 px-4">
        <Link 
          to="/" 
          className="inline-flex items-center mb-6 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <div className="border border-red-200 bg-red-50 rounded-md p-8 text-center shadow-sm">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-semibold text-red-800">403 Forbidden</h2>
          <p className="text-sm text-red-600 mt-1">
            You do not have the required administrative permissions to view or manage users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-6 px-4">
      {/* Back Button */}
      <Link 
        to="/" 
        className="inline-flex items-center mb-6 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      {/* Header & Search */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Users ({totalUsers})
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        
        <input
          type="text"
          placeholder="Search all users..."
          className="w-full sm:w-80 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* GitHub-Style Table Container */}
      <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-300 text-gray-600 font-semibold">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow 
                    key={user.id} 
                    user={user} 
                    selfId={session?.user?.id || ""}
                    refetchUsers={fetchUsers} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer - HIDDEN WHEN SEARCHING */}
        {!isSearching && totalUsers > 0 && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 sm:px-6">
            
            {/* Rows Per Page Selector & Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-500">Rows per page:</label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="text-sm bg-white border border-gray-300 rounded text-gray-700 py-1 pl-2 pr-6 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[10, 20, 30, 40, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:block text-sm text-gray-500">
                Showing <span className="font-medium">{Math.min((page - 1) * pageSize + 1, totalUsers)}</span> to <span className="font-medium">{Math.min(page * pageSize, totalUsers)}</span> of <span className="font-medium">{totalUsers}</span> users
              </div>
            </div>

            {/* Pagination Buttons */}
            <div className="flex space-x-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="sm:hidden text-sm text-gray-500 self-center">
                 <span className="font-medium">{Math.min((page - 1) * pageSize + 1, totalUsers)}</span> - <span className="font-medium">{Math.min(page * pageSize, totalUsers)}</span> of <span className="font-medium">{totalUsers}</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;