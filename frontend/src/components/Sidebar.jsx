import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, Wallet, Star, BarChart, Home, Settings, LogOut, LogIn, X, Shield, User, PartyPopper } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import NotificationsDropdown from './NotificationsDropdown';
import logo from '../assets/logo.png';

const baseNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Events', href: '/events', icon: PartyPopper },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'VIP PERKS', href: '/vip', icon: Star },
  { name: 'My Tickets', href: '/tickets', icon: Ticket },
  { name: 'Profile', href: '/settings', icon: User },
];

const COLLAPSED_WIDTH_CLASS = 'md:w-[84px]';
const EXPANDED_WIDTH_CLASS = 'md:w-[280px]';

export default function Sidebar({ isOpen, setIsOpen, expanded, setExpanded, profile }) {
  const location = useLocation();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const token = useAuthStore((state) => state.token);
  const hoverTimerRef = useRef(null);
  const isExpandedView = expanded || isOpen; // mobile drawer should always render expanded content
  const navigation = [
    ...baseNavigation,
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
  ];

  const startExpandTimer = () => {
    if (window.innerWidth < 768) return;
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setExpanded(true);
    }, 500);
  };

  const stopExpandTimerAndCollapse = () => {
    clearTimeout(hoverTimerRef.current);
    if (window.innerWidth < 768) return;
    setExpanded(false);
  };

  useEffect(() => {
    return () => clearTimeout(hoverTimerRef.current);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed left-0 top-0 z-50 h-full w-[280px] ${expanded ? EXPANDED_WIDTH_CLASS : COLLAPSED_WIDTH_CLASS} flex-col justify-between bg-black/40 backdrop-blur-3xl px-3 md:px-4 py-6
        border-r border-white/5 drop-shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex
      `}
      onMouseEnter={startExpandTimer}
      onMouseLeave={stopExpandTimerAndCollapse}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#14B8A6]/[0.02] via-transparent to-[#0F766E]/[0.02] pointer-events-none z-[-1]" />
        
        <div className="contents relative z-10">
        <div>
          <div className={`mb-8 flex flex-col gap-6`}>
            {/* Top Row: Logo & Close Button (Mobile) & Notifications */}
            <div className={`flex items-center ${isExpandedView ? 'justify-between px-2' : 'justify-center'}`}>
              <div className="flex items-center gap-3">
                <img src={logo} alt="logo" className="w-8" />
                {isExpandedView && (
                  <span className="font-black text-xl tracking-tighter text-white">TICKET</span>
                )}
              </div>
              
              <div className={`flex items-center gap-2 ${isExpandedView ? 'opacity-100' : 'opacity-0 hidden'} transition-opacity duration-300`}>
                <NotificationsDropdown />
                <button 
                  className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen && setIsOpen(false)}
                  className={`group flex items-center rounded-xl ${isExpandedView ? 'pl-3 pr-4 justify-start' : 'justify-center px-0'} py-3 text-[14px] transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#14B8A6]/20 to-transparent border-l-4 border-[#14B8A6] text-white font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border-l-4 border-transparent font-medium'
                  }`}
                >
                  <item.icon
                    className={`${isExpandedView ? 'mr-4' : 'mr-0'} h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                      isActive ? 'text-[#14B8A6] drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] scale-110' : 'text-zinc-500 group-hover:text-zinc-300 group-hover:scale-110'
                    }`}
                    aria-hidden="true"
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className={`whitespace-nowrap transition-all duration-300 tracking-wide ${isExpandedView ? 'opacity-100 delay-100 translate-x-0' : 'opacity-0 w-0 overflow-hidden -translate-x-2'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={`mt-8 ${isExpandedView ? '' : 'flex flex-col items-center'}`}>
          <div className={`border-t border-white/5 mb-6 transition-all duration-300 ${isExpandedView ? 'opacity-100 delay-100' : 'opacity-0 h-0 overflow-hidden mb-0'}`}></div>

          {/* Profile Section */}
          {profile && (
            <div className={`flex items-center gap-3 mb-6 ${isExpandedView ? 'px-3 opacity-100 delay-100' : 'opacity-0 h-0 overflow-hidden mb-0'} transition-all duration-300`}>
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-teal-400/20 border border-teal-400/30 flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-teal-400">{profile.initial}</span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="text-[13px] font-bold text-white leading-tight truncate max-w-[150px]">{profile.displayName}</p>
                {profile.username && (
                  <p className="text-[10px] text-zinc-400 truncate max-w-[150px]">@{profile.username}</p>
                )}
              </div>
            </div>
          )}

          <div className={`space-y-6 ${isExpandedView ? 'px-3' : ''}`}>
             <button 
               onClick={async () => {
                 if (token) {
                   const auth = useAuthStore.getState();
                   if (auth.refreshToken) {
                     try {
                       const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";
                       await fetch(`${baseUrl}/api/Auth/revoke-token`, {
                         method: 'POST',
                         headers: {
                           'Content-Type': 'application/json',
                           ...(auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {})
                         },
                         body: JSON.stringify(auth.refreshToken)
                       });
                     } catch {
                       // silent fallback
                     }
                   }
                   auth.logout();
                 }
                 window.location.href = '/signin';
               }}
               className={`w-full flex items-center rounded-xl p-3 text-[14px] font-bold text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all duration-300 group cursor-pointer ${isExpandedView ? '' : 'justify-center'}`}
             >
               {token ? (
                 <>
                   <LogOut className={`${isExpandedView ? 'mr-4' : 'mr-0'} h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1 group-hover:text-red-400`} strokeWidth={2} />
                   <span className={`whitespace-nowrap tracking-wide transition-all duration-300 group-hover:text-red-400 ${isExpandedView ? 'opacity-100 delay-100 translate-x-0' : 'opacity-0 w-0 overflow-hidden -translate-x-2'}`}>
                     Log Out
                   </span>
                 </>
               ) : (
                 <>
                   <LogIn className={`${isExpandedView ? 'mr-4' : 'mr-0'} h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#14B8A6]`} strokeWidth={2} />
                   <span className={`whitespace-nowrap tracking-wide transition-all duration-300 group-hover:text-[#14B8A6] ${isExpandedView ? 'opacity-100 delay-100 translate-x-0' : 'opacity-0 w-0 overflow-hidden -translate-x-2'}`}>
                     Log In
                   </span>
                 </>
               )}
             </button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

