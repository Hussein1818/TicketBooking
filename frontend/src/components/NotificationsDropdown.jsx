import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Zap, Info, AlertTriangle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { getNotifications, markNotificationRead } from '../services/notificationsApi';

const isTokenUsable = (token) => {
  if (!token) return false;
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return false;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized));
    if (!payload?.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isTokenUsable(token)) {
        setLoading(false);
        setNotifications([]);
        return;
      }
      try {
        const data = await getNotifications(token);
        const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
        setNotifications(list);
      } catch (error) {
        if (error?.response?.status === 401) {
          setNotifications([]);
          return;
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [token]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id, event) => {
    event.stopPropagation();
    if (!isTokenUsable(token)) return;
    try {
      await markNotificationRead(id, token);
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      if (error?.response?.status === 401) return;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-[#141517] text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-400 text-[10px] font-bold text-black border-2 border-[#111214]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-[400px] origin-top-right rounded-xl border border-white/5 bg-[#16171a] shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-[#111214]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notifications</h3>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{unreadCount} Unread</span>
          </div>
          
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-400 border-t-transparent"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((notif, idx) => (
                  <div 
                    key={notif.id || idx} 
                    className={`group relative flex gap-4 p-4 transition-colors hover:bg-white/5 ${!notif.isRead ? 'bg-[#1a1c21]' : ''} border-b border-white/5 last:border-0`}
                  >
                    <div className="flex bg-[#111214] border border-white/5 h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-teal-400">
                      {/* Using Zap as default, can dynamically map based on notification types */}
                      {notif.type === 'Alert' ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <Zap className="h-5 w-5" />}
                    </div>
                    
                    <div className="flex-1 pr-8">
                      <h4 className={`text-sm tracking-tight mb-1 ${!notif.isRead ? 'font-medium text-white' : 'text-zinc-300'}`}>
                        {notif.title || notif.subject || 'System Update'}
                      </h4>
                      <p className="text-xs text-zinc-500 mb-2 leading-relaxed">
                        {notif.message || notif.content}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7e858a]">
                        {notif.createdAt || notif.date ? new Date(notif.createdAt || notif.date).toLocaleDateString() : 'Just now'}
                      </p>
                    </div>

                    {!notif.isRead && (
                      <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                         <button 
                           onClick={(e) => markAsRead(notif.id, e)}
                           className="flex items-center justify-center h-8 w-8 rounded bg-teal-400/10 text-teal-400 hover:bg-teal-400 hover:text-black transition-colors"
                           title="Mark as read"
                         >
                           <Check className="h-4 w-4" />
                         </button>
                      </div>
                    )}
                    
                    {!notif.isRead && (
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-400 group-hover:opacity-0 transition-opacity"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                  <Info className="h-6 w-6 text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-zinc-400">No new notifications</p>
                <p className="mt-1 text-xs text-zinc-600">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
