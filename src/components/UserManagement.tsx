import { useState, useEffect } from "react";
import { authClient } from "../lib/auth-client";
import { supabase } from "../supabaseClient";
import UserRow from "./UserRow";
import { Link } from "react-router-dom";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Biro {
  id: string;
  name: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const UserManagement = () => {
  const [users, setUsers]               = useState<any[]>([]);
  const [biroList, setBiroList]         = useState<Biro[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [searchQuery, setSearchQuery]   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(20);
  const [totalUsers, setTotalUsers]     = useState(0);

  const { data: session, isPending: isSessionPending } = authClient.useSession();
  // ── Permission check based on AC config ──────────────────────────────────────
  const userRole = session?.user?.role ?? 'user';

  // Only superadmin can manage users (pengguna resource)
  const hasPermission = !isSessionPending && (userRole === 'superadmin');

  // // For view-only access (admin + financeadmin can see but not edit)
  // const canViewOnly = !isSessionPending && ['admin', 'financeadmin'].includes(userRole);
  // ── Debounce search ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const isSearching = debouncedSearch.trim().length > 0;

  // ── Fetch biro list ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBiro = async () => {
      const { data } = await supabase
        .from('biro')
        .select('id, name')
        .order('name', { ascending: true });
      setBiroList(data ?? []);
    };
    fetchBiro();
  }, []);

  // ── Fetch users ─────────────────────────────────────────────────────────────
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
      console.error("Gagal memuatkan pengguna:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionPending && hasPermission) fetchUsers();
  }, [isSessionPending, hasPermission, page, isSearching, pageSize]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalUsers / pageSize);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isSessionPending) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-12 px-4 text-center text-gray-500">
        Mengesahkan kebenaran...
      </div>
    );
  }

  // ── No permission ───────────────────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-6 px-4">
        <Link to="/" className="inline-flex items-center mb-6 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Laman Utama
        </Link>
        <div className="border border-red-200 bg-red-50 rounded-md p-8 text-center shadow-sm">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-semibold text-red-800">403 Dilarang</h2>
          <p className="text-sm text-red-600 mt-1">Anda tidak mempunyai kebenaran untuk mengurus pengguna.</p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20">

      {/* Back */}
      <div className="w-full flex justify-start mb-2">
        <Link 
          to="/admin" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors group"
        >
          <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Menu Pengurusan
        </Link>
      </div>

      {/* Header - Polished & Centered to match Events */}
      <div className="flex flex-col items-center text-center mb-8 mt-4 w-full">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-2">
            Pengurusan Pengguna
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Urus akaun, peranan dan maklumat ahli
          </p>
        </div>
      </div>

      {/* Search Bar - Fixed to Match Event Module Exactly */}
      <div className="relative mb-6 w-full sm:w-80">
        {/* Left Icon */}
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        
        <input
          type="text"
          placeholder="Cari nama atau e-mel..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '3rem', paddingRight: '3rem' }} // Forces 48px of clear space
          className="w-full py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

        {/* Right Button (Clear) */}
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300 text-gray-600 font-medium">
                <th className="px-4 py-3 text-left">Pengguna</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Peranan</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Biro</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Jawatan</th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">Didaftar</th>
                <th className="px-4 py-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Memuatkan pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Tiada pengguna dijumpai.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    selfId={session?.user?.id ?? ""}
                    biroList={biroList}
                    refetchUsers={fetchUsers}
                    canEdit={userRole === 'superadmin'} // only superadmin gets action buttons
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isSearching && totalUsers > 0 && (
          <div className="bg-gray-50 border-t border-gray-300 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-500">Baris per halaman:</label>
                <select id="pageSize" value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="text-sm bg-white border border-gray-300 rounded text-gray-700 py-1 pl-2 pr-6 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {[10, 20, 30, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <span className="hidden sm:block text-sm text-gray-500">
                Menunjukkan <span className="font-medium">{Math.min((page - 1) * pageSize + 1, totalUsers)}</span> hingga <span className="font-medium">{Math.min(page * pageSize, totalUsers)}</span> daripada <span className="font-medium">{totalUsers}</span> pengguna
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="sm:hidden text-sm text-gray-500">
                {Math.min((page - 1) * pageSize + 1, totalUsers)}–{Math.min(page * pageSize, totalUsers)} / {totalUsers}
              </span>
              <button onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                Sebelum
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                Seterusnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;