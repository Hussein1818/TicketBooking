import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import useAuthStore from '../store/useAuthStore';
import { getProfile } from '../services/usersApi';

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
      .then((data) => {
        setProfile(data);
        // Also update the store user with profile data which might contain roles
        const auth = useAuthStore.getState();
        const updatedUser = { ...auth.user, ...data };
        auth.login(auth.token, updatedUser, auth.refreshToken);
      })
      .catch((err) => {
        console.error("Failed to fetch profile", err);
      }); // silent fallback to store data
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
        profile={{ displayName, username, avatarUrl, initial }}
      />

      <div className={`flex flex-1 flex-col min-h-screen bg-[#111214] ml-0 md:ml-[84px] transition-all duration-300 overflow-x-hidden`}>
        {/* Mobile menu toggle */}
        <div className="md:hidden fixed top-4 left-4 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 bg-[#111214]/90 backdrop-blur-md border border-white/10 rounded-full text-zinc-400 hover:text-white shadow-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 px-4 md:px-8 py-6 md:py-10 relative mt-16 md:mt-0">
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