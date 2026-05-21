import { useState, useEffect, useCallback } from "react";
import { authClient } from "../lib/auth-client";
import UserRow from "./UserRow";
import { Link } from "react-router-dom";
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ChevronLeftIcon 
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  [key: string]: any;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); 
  const [totalUsers, setTotalUsers] = useState(0);
  
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const hasPermission = session?.user?.role && ["admin", "financeadmin", "superadmin"].includes(session?.user?.role);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); 
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = debouncedSearch.trim().length > 0;

  const fetchUsers = useCallback(async () => {
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
        setUsers(response.data.users as User[]);
        setTotalUsers(response.data.total);
      }
    } catch (error) {
      console.error("Gagal memuat turun pengguna:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isSearching, pageSize, page]); 

  useEffect(() => {
    if (!isSessionPending && hasPermission) {
      fetchUsers();
    }
  }, [isSessionPending, hasPermission, fetchUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalUsers / pageSize);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1); 
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={4} className="p-8 text-center text-gray-400">
            Memuatkan pengguna...
          </td>
        </tr>
      );
    }
    
    if (filteredUsers.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="p-8 text-center text-gray-400">
            Tiada pengguna dijumpai untuk carian ini.
          </td>
        </tr>
      );
    }

    return filteredUsers.map((user) => (
      <UserRow 
        key={user.id} 
        user={user} 
        selfId={session?.user?.id || ""}
        refetchUsers={fetchUsers} 
      />
    ));
  };

  if (isSessionPending) {
    return (
      <div className="p-4 max-w-6xl mx-auto text-center text-gray-400">
        Memuatkan...
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="p-4 max-w-6xl mx-auto pb-20 text-left">
        <div className="w-full flex justify-start mb-2">
          <Link 
            to="/admin" 
            className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors group"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Menu Pengurusan
          </Link>
        </div>

        <div className="border border-red-200 bg-red-50 rounded-2xl p-8 text-center shadow-sm mt-4">
          <h2 className="text-lg font-bold text-red-800">403 Akses Ditolak</h2>
          <p className="text-sm text-red-600 mt-1">
            Anda tidak mempunyai kebenaran pentadbir untuk melihat halaman ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto pb-20 text-left">
      {/* Navigation Layer - Selaras dengan EventsManager */}
      <div className="w-full flex justify-start mb-2">
        <Link 
          to="/admin" 
          className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors group"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Menu Pengurusan
        </Link>
      </div>

      {/* Header Content Layer - Selaras dengan EventsManager */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900">Pengurusan Pengguna</h1>
          <p className="text-gray-500 text-sm">Uruskan akaun dan peranan pengguna masjid</p>
        </div>
      </div>

      {/* Search Bar - Selaras dengan EventsManager */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari mengikut nama e-mel atau nama pengguna..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
          className="w-full py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Result count when searching */}
      {searchQuery.trim() && (
        <p className="text-xs text-gray-500 mb-3">
          {filteredUsers.length === 0
            ? 'Tiada pengguna dijumpai'
            : `${filteredUsers.length} pengguna dijumpai untuk "${searchQuery}"`}
        </p>
      )}

      {/* Table Container - Selaras dengan EventsManager */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengguna</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Peranan</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Didaftarkan</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {renderTableBody()}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        {!isSearching && totalUsers > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-500">Baris per halaman:</label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="text-sm bg-white border border-gray-300 rounded-md text-gray-700 py-1 pl-2 pr-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 20, 30, 40, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:block text-sm text-gray-500">
                Memaparkan <span className="font-medium">{Math.min((page - 1) * pageSize + 1, totalUsers)}</span> hingga <span className="font-medium">{Math.min(page * pageSize, totalUsers)}</span> daripada <span className="font-medium">{totalUsers}</span> pengguna
              </div>
            </div>

            <div className="flex space-x-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                  Seterusnya
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