import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, Wallet, Star, BarChart, Home, Settings, LogOut, X, Shield, User, PartyPopper } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

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

export default function Sidebar({ isOpen, setIsOpen, expanded, setExpanded }) {
  const location = useLocation();
  const isAdmin = useAuthStore((state) => state.isAdmin);
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
        fixed left-0 top-0 z-50 h-full w-[280px] ${expanded ? EXPANDED_WIDTH_CLASS : COLLAPSED_WIDTH_CLASS} flex-col justify-between bg-[#0e1011] px-3 md:px-4 py-6
        border-r border-white/5 drop-shadow-xl shadow-black transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex
      `}
      onMouseEnter={startExpandTimer}
      onMouseLeave={stopExpandTimerAndCollapse}
      >
        <div className="contents">
        <div>
          <div className={`mb-7 ${isExpandedView ? 'pl-2' : ''} flex items-center ${isExpandedView ? 'justify-between' : 'justify-center'}`}>

            {/* Close button for mobile */}
            <button 
              className={`${isExpandedView ? '' : 'hidden'} md:hidden p-2 text-zinc-400 hover:text-white`}
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="space-y-[8px]">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen && setIsOpen(false)}
                  className={`group flex items-center rounded ${isExpandedView ? 'pl-2.5 pr-4 justify-start' : 'justify-center px-0'} py-2.5 text-[15px] transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-400/[0.15] to-transparent border-l-[3px] border-teal-400 text-white font-medium'
                      : 'text-[#8e959b] hover:text-white border-l-[3px] border-transparent font-light'
                  }`}
                >
                  <item.icon
                    className={`${isExpandedView ? 'mr-4' : 'mr-0'} h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#30d8c0]' : 'text-[#8e959b] group-hover:text-zinc-300'
                    }`}
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpandedView ? 'opacity-100 delay-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={`mt-8 ${isExpandedView ? '' : 'flex justify-center'}`}>
          <div className={`border-t border-white/5 mb-8 transition-opacity duration-200 ${isExpandedView ? 'opacity-100 delay-100' : 'opacity-0 h-0 overflow-hidden mb-0'}`}></div>

          <div className={`space-y-6 ${isExpandedView ? 'px-3' : ''}`}>
             <button 
               onClick={async () => {
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
                   } catch (err) {
                     console.error("Failed to revoke token", err);
                   }
                 }
                 auth.logout();
                 window.location.href = '/signin';
               }}
               className={`w-full flex items-center text-[15px] font-light text-[#8e959b] hover:text-white transition-colors group cursor-pointer ${isExpandedView ? '' : 'justify-center'}`}
             >
               <LogOut className={`${isExpandedView ? 'mr-4' : 'mr-0'} h-5 w-5 flex-shrink-0 transition-colors duration-200`} strokeWidth={1.5} />
               <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpandedView ? 'opacity-100 delay-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                 Log Out
               </span>
             </button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

