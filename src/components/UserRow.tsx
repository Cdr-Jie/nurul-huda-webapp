import { useState, useRef, useEffect } from "react";
import { authClient } from "../lib/auth-client";
import { useNavigate } from "react-router-dom";

// Standardize the type based on Better Auth
type UserWithRole = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned?: boolean;
  emailVerified?: boolean;
  createdAt: Date | string;
};

export default function UserRow({
  user,
  selfId,
  refetchUsers,
}: Readonly<{
  user: UserWithRole;
  selfId: string;
  refetchUsers: () => void;
}>) {
  const isSelf = user.id === selfId;
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleImpersonateUser() {
    await authClient.admin.impersonateUser(
      { userId: user.id },
      {
        // Added : any type to fix TS7006
        onError: (error: any) => alert(error.error.message || "Failed to impersonate"),
        onSuccess: () => {
          setIsMenuOpen(false);
          navigate("/"); // Redirect to home after impersonating
        },
      }
    );
  }

  async function handleRevokeSessions() {
    await authClient.admin.revokeUserSessions(
      { userId: user.id },
      {
        // Added : any type to fix TS7006
        onError: (error: any) => alert(error.error.message || "Failed to revoke sessions"),
        onSuccess: () => {
          alert("User sessions revoked");
          setIsMenuOpen(false);
        },
      }
    );
  }

  async function handleUnbanUser() {
    await authClient.admin.unbanUser(
      { userId: user.id },
      {
        // Added : any type to fix TS7006
        onError: (error: any) => alert(error.error.message || "Failed to unban user"),
        onSuccess: () => {
          refetchUsers();
          setIsMenuOpen(false);
        },
      }
    );
  }

  async function handleBanUser() {
    await authClient.admin.banUser(
      { userId: user.id },
      {
        // Added : any type to fix TS7006
        onError: (error: any) => alert(error.error.message || "Failed to ban user"),
        onSuccess: () => {
          refetchUsers();
          setIsMenuOpen(false);
        },
      }
    );
  }

  async function handleRemoveUser() {
    await authClient.admin.removeUser(
      { userId: user.id },
      {
        // Added : any type to fix TS7006
        onError: (error: any) => alert(error.error.message || "Failed to remove user"),
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          refetchUsers();
        },
      }
    );
  }

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        {/* User Info Column */}
        <td className="px-4 py-3">
          <div>
            <div className="font-medium text-gray-900">{user.name || "No Name"}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="flex items-center gap-2 mt-1">
              {user.banned && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                  Banned
                </span>
              )}
              {user.emailVerified === false && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  Unverified
                </span>
              )}
              {isSelf && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  You
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Role Column */}
        <td className="px-4 py-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            user.role === "admin" 
              ? "bg-purple-100 text-purple-800 border-purple-200"
              : user.role === "superadmin"
              ? "bg-indigo-100 text-indigo-800 border-indigo-200"
              : "bg-gray-100 text-gray-800 border-gray-200"
          }`}>
            {user.role || "user"}
          </span>
        </td>

        {/* Date Column */}
        <td className="px-4 py-3 text-sm text-gray-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </td>

        {/* Actions Column */}
        <td className="px-4 py-3 text-right relative">
          {!isSelf && (
            <div ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>

              {/* Tailwind Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-8 top-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1 text-left">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                    Actions
                  </div>
                  <button onClick={handleImpersonateUser} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Impersonate
                  </button>
                  <button onClick={handleRevokeSessions} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Revoke Sessions
                  </button>
                  
                  {user.banned ? (
                    <button onClick={handleUnbanUser} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50">
                      Unban User
                    </button>
                  ) : (
                    <button onClick={handleBanUser} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      Ban User
                    </button>
                  )}
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button 
                    onClick={() => {
                      setIsDeleteDialogOpen(true);
                      setIsMenuOpen(false);
                    }} 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50"
                  >
                    Delete User
                  </button>
                </div>
              )}
            </div>
          )}
        </td>
      </tr>

      {/* Tailwind Modal for Delete Confirmation (Replaces AlertDialog) */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{user.email}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveUser}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}