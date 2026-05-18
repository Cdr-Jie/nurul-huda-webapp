import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AdminPage from './pages/admin/AdminPage';
import LoginPage from './pages/authentication/LoginPage';
import SignUpPage from './pages/authentication/SignUpPage';
import EventsPage from './pages/EventsPage';
import FinancePage from './pages/FinancePage';
import { useSession, authClient } from './lib/auth-client';
import UserPage from './pages/UserPage';
import SettingsPage from './pages/SettingsPage';

// 1. Define the Impersonation Indicator inside App.tsx
function ImpersonationIndicator() {
  const navigate = useNavigate();
  const { data: session, refetch } = authClient.useSession();

  // If the user is not impersonating anyone, do not render the button
  if (session?.session.impersonatedBy == null) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() =>
          authClient.admin.stopImpersonating(undefined, {
            onSuccess: () => {
              navigate("/admin/users");
              refetch();
            },
          })
        }
        className="flex items-center justify-center p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        title={"Stop impersonating " + session.user.email}
      >
        {/* Lucide-react UserX SVG */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="17" y1="8" x2="23" y2="14"/>
          <line x1="23" y1="8" x2="17" y2="14"/>
        </svg>
      </button>
    </div>
  );
}

// 2. Main App Component
function App() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
      
      {/* 3. Drop the indicator globally inside the Router so it can use 'navigate' */}
      <ImpersonationIndicator />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={session ? <AdminPage /> : <Navigate to="/login" />} />
        <Route path="/admin/events" element={session ? <EventsPage /> : <Navigate to ="/login" />} />
        <Route path="/admin/finance" element={session ? <FinancePage /> : <Navigate to ="/login" />} />
        <Route path="/admin/users" element={session ? <UserPage /> : <Navigate to ="/login" />} />
        <Route path="/settings" element={session ? <SettingsPage /> : <Navigate to ="/login" />} />
        <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!session ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="*" element={<div className="p-4">Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;