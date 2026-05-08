import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import NotificationsDropdown from '../components/NotificationsDropdown';
import useAuthStore from '../store/useAuthStore';
import { getProfile } from '../services/usersApi';
import logo from '../assets/logo.png';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ticketok.runasp.net';
const resolveImg = (url) => !url ? null : url.startsWith('http') ? url : `${BASE_URL}${url}`;

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const token     = useAuthStore((s) => s.token);
  const storeUser = useAuthStore((s) => s.user);

  // Fetch live profile from server (has picture + real username)
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then((data) => setProfile(data))
      .catch(() => {}); // silent fallback to store data
  }, [token]);

  const displayName = profile?.fullName || profile?.username || storeUser?.fullName || storeUser?.username || 'User';
  const username    = profile?.username || storeUser?.username || '';
  const avatarUrl   = resolveImg(
    profile?.profilePictureUrl || profile?.profilePicture || profile?.imageUrl || null
  );
  const initial = displayName[0]?.toUpperCase() ?? 'U';

  return (
    <div className="flex xl:min-h-screen min-h-[100dvh] bg-[#111214] font-sans text-white">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
      />

      <div className={`flex flex-1 flex-col overflow-hidden bg-[#111214] ml-0 md:ml-[84px] transition-all duration-300`}>
        {/* Top Header */}
        <header className="flex h-[80px] items-center justify-between md:justify-end px-4 md:px-8 border-b border-white/5 bg-[#111214]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-full flex justify-between items-center gap-2">
            <img src={logo} alt="logo" className="w-12" />
            <div className="flex items-center gap-4">
              <NotificationsDropdown />

              <div className="ml-2 md:ml-6 flex items-center gap-3 border-l border-white/5 pl-4 md:pl-6">
                {/* Avatar */}
                <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-teal-400/20 border border-teal-400/30 shadow-[0_0_12px_rgba(48,216,192,0.2)] flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-teal-400">{initial}</span>
                  )}
                </div>
                {/* Name + username */}
                <div className="hidden sm:block">
                  <p className="text-[13px] font-medium text-white leading-tight truncate max-w-[140px]">{displayName}</p>
                  {username && (
                    <p className="text-[10px] text-zinc-500 truncate max-w-[140px]">@{username}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 py-6 md:py-10 custom-scrollbar relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}