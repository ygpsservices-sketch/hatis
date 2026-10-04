import { RouterProvider, useRouter } from '@/lib/router';
import { AuthProvider, useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import DiscoverPage from '@/pages/DiscoverPage';
import CreatorProfilePage from '@/pages/CreatorProfilePage';
import CategoriesPage from '@/pages/CategoriesPage';
import ClaimPage from '@/pages/ClaimPage';
import AuthPage from '@/pages/AuthPage';
import ConfirmPage from '@/pages/ConfirmPage';
import OnboardingPage from '@/pages/OnboardingPage';
import AdminPage from '@/pages/AdminPage';
import DashboardPage from '@/pages/DashboardPage';
import LegalPage from '@/pages/LegalPage';

function Routes() {
  const { path } = useRouter();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="w-8 h-8 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (path === '/' || path === '') return <HomePage />;
  if (path === '/discover') return <DiscoverPage />;
  if (path === '/categories') return <CategoriesPage />;
  if (path === '/claim') return <ClaimPage />;
  if (path === '/signup') return <AuthPage mode="signup" />;
  if (path === '/login') return <AuthPage mode="login" />;
  if (path === '/auth/confirm') return <ConfirmPage />;
  if (path === '/onboarding') return <OnboardingPage />;
  if (path === '/admin') return <AdminPage />;
  if (path === '/dashboard') return <DashboardPage />;
  if (path === '/terms') return <LegalPage type="terms" />;
  if (path === '/privacy') return <LegalPage type="privacy" />;
  if (path.startsWith('/creator/')) {
    const slug = path.replace('/creator/', '');
    return <CreatorProfilePage slug={slug} />;
  }

  return <HomePage />;
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />
          <main className="flex-1">
            <Routes />
          </main>
          <Footer />
        </div>
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
