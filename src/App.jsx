import React from 'react';
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom';
import { store } from './redux/store';

// Layouts
import MainLayout from './Layouts/MainLayout';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Discover from './pages/Discover';
import JobDetails from './pages/JobDetails';
import SearchPage from './pages/SearchPage';
import FreelancerPublicProfile from './pages/FreelancerPublicProfile';
import Login from './features/auth/ui/Login';
import SelectRole from './features/auth/ui/SelectRole';

// Shared Pages
import Messages from './pages/shared/Messages';
import Settings from './pages/shared/Settings';
import Wallet from './pages/shared/Wallet';

// Client Pages
import DashboardLayout from './Layouts/DashboardLayout';
import PostJob from './pages/client/PostJob';

// Freelancer Pages
import FreelancerDashboard from './pages/freelancer/Dashboard';
import Profile from './pages/freelancer/Profile';
import Earnings from './pages/freelancer/Earnings';
import ClientDashboard from './pages/client/Dashboard';


/* ── Route Guards ─────────────────────────────────── */
const guestLoader = () => {
  const { isAuthenticated, role } = store.getState().auth;
  if (isAuthenticated) {
    const r = role?.toLowerCase();
    if (r === 'client') return redirect('/client/dashboard');
    if (r === 'freelancer') return redirect('/freelancer/dashboard');
  }
  return null;
};

const clientLoader = () => {
  const { isAuthenticated, role } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  if (role?.toLowerCase() !== 'client') return redirect('/freelancer/dashboard');
  return null;
};

const freelancerLoader = () => {
  const { isAuthenticated, role } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  if (role?.toLowerCase() !== 'freelancer') return redirect('/client/dashboard');
  return null;
};

const authLoader = () => {
  const { isAuthenticated } = store.getState().auth;
  if (!isAuthenticated) return redirect('/auth');
  return null;
};

/* ── Router ───────────────────────────────────────── */
const router = createBrowserRouter([
  // Public routes (with Navbar)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'discover', element: <Discover /> },
      { path: 'job/:id', element: <JobDetails /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'freelancer/:userId', element: <FreelancerPublicProfile /> },

      // Protected shared routes
      { path: 'profile', loader: authLoader, element: <Profile /> },
      { path: 'shared/messages', loader: authLoader, element: <Messages /> },
      { path: 'shared/settings', loader: authLoader, element: <Settings /> },
      { path: 'shared/wallet',   loader: authLoader, element: <Wallet /> },
      { path: 'freelancer/earnings', loader: freelancerLoader, element: <Earnings /> },
    ],
  },

  // Auth routes
  { path: '/auth',             element: <Auth />,       loader: guestLoader },
  { path: '/auth/login',       element: <Login />,      loader: guestLoader },
  { path: '/auth/select-role', element: <SelectRole />, loader: authLoader },

  // Client dashboard (sidebar layout)
  {
    path: '/client',
    element: <DashboardLayout />,
    loader: clientLoader,
    children: [
      { path: 'dashboard', element: <ClientDashboard /> },
      { path: 'post-job',  element: <PostJob /> },
    ],
  },

  // Freelancer dashboard (sidebar layout)
  {
    path: '/freelancer',
    element: <DashboardLayout />,
    loader: freelancerLoader,
    children: [
      { path: 'dashboard', element: <FreelancerDashboard /> },
    ],
  },

  // 404
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-extrabold text-primary mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-4">This route does not exist.</p>
        <a href="/" className="text-xs font-bold px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">Go Home</a>
      </div>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;