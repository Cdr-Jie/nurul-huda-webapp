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
  const hasPermission = session?.user?.role &&
    ["admin", "financeadmin", "superadmin"].includes(session.user.role);

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
        const authUsers = response.data.users;

        // Fetch extra fields from Supabase for all returned users
        const ids = authUsers.map(u => u.id);
        const { data: profiles } = await supabase
          .from('user')
          .select('id, biro_id, position, phone')
          .in('id', ids);

        // Merge the two datasets
        const merged = authUsers.map(u => {
          const profile = profiles?.find(p => p.id === u.id);
          return { ...u, ...profile };
        });

        setUsers(merged);
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
    <div className="w-full max-w-6xl mx-auto mt-6 px-4 pb-20">

      {/* Back */}
      <Link to="/admin" className="inline-flex items-center mb-6 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali ke Menu Pengurusan
      </Link>

      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Pengguna ({totalUsers})
          </h2>
          <p className="text-sm text-gray-500 mt-1">Urus akaun, peranan dan maklumat ahli</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama atau e-mel..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-300 text-gray-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3 hidden sm:table-cell">Peranan</th>
                <th className="px-4 py-3 hidden md:table-cell">Biro</th>
                <th className="px-4 py-3 hidden md:table-cell">Jawatan</th>
                <th className="px-4 py-3 hidden lg:table-cell">Didaftar</th>
                <th className="px-4 py-3 text-right">Tindakan</th>
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