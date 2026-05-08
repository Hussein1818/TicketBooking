import { useState, useEffect } from 'react';
import { Terminal, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/useAuthStore';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ticketok.runasp.net';
        const response = await axios.get(`${baseUrl}/api/Admin/logs`, {
          params: { page, pageSize },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Handle various response structures gracefully
        const data = Array.isArray(response.data) ? response.data : (response.data.items || response.data.data || []);
        setLogs(data);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLogs();
    } else {
      setLoading(false);
    }
  }, [page, pageSize, token]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="mb-2 text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <Terminal className="text-teal-400 w-8 h-8" />
              System <span className="text-teal-400">Logs</span>
            </h1>
            <p className="max-w-md text-sm text-zinc-400 leading-relaxed">
              Real-time audit trailing and operational monitoring for Obsidian Velocity.
            </p>
          </div>
          
          <div className="relative w-full md:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full rounded-lg bg-[#1a1b1f] py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#16171a] overflow-hidden">
           <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-medium text-white">Event Streams</h2>
              <div className="flex items-center gap-3">
                 <button className="text-[11px] font-bold uppercase tracking-wider text-black bg-teal-400 hover:bg-teal-300 transition-colors px-4 py-2 rounded">
                   Export Data
                 </button>
              </div>
           </div>

           <div className="w-full overflow-x-auto min-h-[400px] relative">
             {loading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-[#16171a]/50 backdrop-blur-sm z-10">
                 <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
               </div>
             ) : null}
             
             <table className="w-full text-left border-collapse min-w-[800px]">
               <thead>
                 <tr className="bg-[#111214] text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                   <th className="px-6 py-4 border-b border-white/5 w-24">ID</th>
                   <th className="px-6 py-4 border-b border-white/5 w-48">Timestamp</th>
                   <th className="px-6 py-4 border-b border-white/5 w-32">Level</th>
                   <th className="px-6 py-4 border-b border-white/5">Message / Details</th>
                 </tr>
               </thead>
               <tbody className="text-sm font-mono tracking-tight">
                 {logs.length > 0 ? logs.map((log, index) => (
                   <tr key={log.id || index} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                     <td className="px-6 py-4 text-zinc-500">#{log.id || index + 1}</td>
                     <td className="px-6 py-4 text-zinc-400">
                       {log.timestamp || log.createdAt ? new Date(log.timestamp || log.createdAt).toLocaleString() : new Date().toLocaleString()}
                     </td>
                     <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded px-2py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          log.level === 'Error' ? 'text-red-400 bg-red-400/10' :
                          log.level === 'Warning' ? 'text-amber-400 bg-amber-400/10' :
                          'text-teal-400 bg-teal-400/10'
                        }`}>
                           {log.level || log.type || 'INFO'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-white truncate max-w-[400px]">
                        {log.message || log.details || log.description || JSON.stringify(log)}
                     </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">
                       No logs found for this period.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>

           {/* Pagination */}
           <div className="flex items-center justify-between p-4 border-t border-white/5 bg-[#111214]">
              <span className="text-xs text-zinc-500">
                Showing page {page} ({pageSize} items per page)
              </span>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                   className="p-1.5 border border-white/10 rounded hover:bg-white/5 disabled:opacity-50 text-white transition-colors"
                 >
                   <ChevronLeft className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => setPage(p => p + 1)}
                   disabled={logs.length < pageSize} // naive next page disable
                   className="p-1.5 border border-white/10 rounded hover:bg-white/5 disabled:opacity-50 text-white transition-colors"
                 >
                   <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
