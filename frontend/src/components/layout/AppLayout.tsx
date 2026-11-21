import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar, toggleTheme } from '../../store/slices/uiSlice';
import { ToastContainer } from '../common/ToastContainer';
import { MediaViewerModal } from '../common/MediaViewerModal';
import {
  LayoutDashboard,
  Sparkles,
  Video,
  Palette,
  Images,
  BookOpen,
  CreditCard,
  Settings,
  ShieldCheck,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Zap,
  ChevronRight,
  User,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { theme, sidebarOpen } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Image Generator', path: '/generate/image', icon: Sparkles },
    { name: 'Video Generator', path: '/generate/video', icon: Video },
    { name: 'Creative Studio', path: '/studio', icon: Palette },
    { name: 'Gallery', path: '/gallery', icon: Images },
    { name: 'Prompt Library', path: '/prompts', icon: BookOpen },
    { name: 'Credits & Billing', path: '/credits', icon: CreditCard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'Admin Dashboard', path: '/admin', icon: ShieldCheck });
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800/80 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-all">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  AI Studio
                </span>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-purple-600 dark:text-purple-400">
                  Image & Video Studio
                </span>
              </div>
            </NavLink>
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workspace
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-white border border-purple-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0 text-purple-400" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Credit Wallet Widget */}
          <div className="p-4 border-t border-slate-800/60">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-900/30 via-slate-900 to-indigo-900/30 border border-purple-500/20 shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Available Credits
                </span>
                <span className="font-bold text-sm text-white">
                  {user?.wallet?.balance ?? 50}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-amber-400 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(100, ((user?.wallet?.balance ?? 50) / 200) * 100)}%`,
                  }}
                />
              </div>
              <button
                onClick={() => navigate('/credits')}
                className="w-full flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 font-medium transition-all"
              >
                <span>Add Credits</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={
                  user?.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'User')}`
                }
                alt={user?.name || 'User avatar'}
                className="w-8 h-8 rounded-full border border-slate-700 shrink-0"
              />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/70 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Studio Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-200 font-semibold">Qwen 2.5 & WanX 2.1 Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Credit Pill */}
            <button
              onClick={() => navigate('/credits')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-purple-500/30 hover:border-purple-500/60 text-xs transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-bold text-slate-900 dark:text-white">{user?.wallet?.balance ?? 50}</span>
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">credits</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* User Profile Avatar Link */}
            <button
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-full border border-purple-500/30 overflow-hidden hover:ring-2 hover:ring-purple-500/50 transition-all"
            >
              <img
                src={
                  user?.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'User')}`
                }
                alt={user?.name || 'Profile'}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <MediaViewerModal />
    </div>
  );
};
