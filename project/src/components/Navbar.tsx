import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Heart, Search, Menu, X, LogOut, ShieldCheck, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const { path } = useRouter();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [creatorSlug, setCreatorSlug] = useState<string | null>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (p: string) =>
    path === p || (p !== '/' && path.startsWith(p));

  useEffect(() => {
    if (user && profile?.role === 'creator') {
      supabase
        .from('creators')
        .select('slug')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setCreatorSlug(data.slug);
        });
    }
  }, [user, profile]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Hatis
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/discover" active={isActive('/discover')}>
              Discover
            </NavLink>
            <NavLink to="/categories" active={isActive('/categories')}>
              Categories
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" active={isActive('/admin')}>
                Admin
              </NavLink>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/discover"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>
            {user ? (
              <div className="relative" ref={avatarMenuRef}>
                <button
                  onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {avatarMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 animate-fade-in">
                    {profile?.role === 'creator' && creatorSlug && (
                      <MenuLink to={`/creator/${creatorSlug}`} onClick={() => setAvatarMenuOpen(false)} icon={User}>
                        My page
                      </MenuLink>
                    )}
                    {profile?.role === 'creator' && (
                      <MenuLink to="/dashboard" onClick={() => setAvatarMenuOpen(false)} icon={LayoutDashboard}>
                        Dashboard
                      </MenuLink>
                    )}
                    {isAdmin && (
                      <MenuLink to="/admin" onClick={() => setAvatarMenuOpen(false)} icon={ShieldCheck}>
                        Admin panel
                      </MenuLink>
                    )}
                    <div className="border-t border-slate-100 my-1.5" />
                    <button
                      onClick={() => {
                        signOut();
                        setAvatarMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/signup"
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Get started
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 space-y-1">
            <MobileLink to="/discover" onClick={() => setMobileOpen(false)}>
              Discover creators
            </MobileLink>
            <MobileLink to="/categories" onClick={() => setMobileOpen(false)}>
              Categories
            </MobileLink>
            {profile?.role === 'creator' && creatorSlug && (
              <MobileLink to={`/creator/${creatorSlug}`} onClick={() => setMobileOpen(false)}>
                My page
              </MobileLink>
            )}
            {profile?.role === 'creator' && (
              <MobileLink to="/dashboard" onClick={() => setMobileOpen(false)}>
                Dashboard
              </MobileLink>
            )}
            {isAdmin && (
              <MobileLink to="/admin" onClick={() => setMobileOpen(false)}>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </span>
              </MobileLink>
            )}
            {user ? (
              <button
                onClick={() => {
                  signOut();
                  setMobileOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Log out
              </button>
            ) : (
              <MobileLink to="/signup" onClick={() => setMobileOpen(false)}>
                Sign up / Log in
              </MobileLink>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'text-slate-900 bg-slate-100'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {children}
    </Link>
  );
}

function MenuLink({
  to,
  onClick,
  icon: Icon,
  children,
}: {
  to: string;
  onClick: () => void;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
    >
      <Icon className="w-4 h-4 text-slate-400" />
      {children}
    </Link>
  );
}

function MobileLink({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
