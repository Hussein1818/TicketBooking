import { useState, useEffect } from 'react';
import { Terminal, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/useAuthStore';
import { getLogs } from '../../services/adminApi';

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
        const data = await getLogs(page, pageSize, token);
        // Handle various response structures gracefully
        const items = Array.isArray(data) ? data : (data.items || data.data || []);
        setLogs(items);
      } catch {
        // silent fallback
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
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 pb-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-md flex items-center gap-4 mb-3">
              <Terminal className="text-[#14B8A6] w-10 h-10" />
              System <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Logs</span>
            </h1>
            <p className="max-w-md text-base text-zinc-400 leading-relaxed">
              Real-time audit trailing and operational monitoring for Obsidian Velocity.
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-[#14B8A6]" />
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden">
           <div className="flex items-center justify-between p-8 border-b border-white/5 bg-black/20">
              <h2 className="text-lg font-bold text-white drop-shadow-sm">Event Streams</h2>
              <div className="flex items-center gap-3">
                 <button className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] rounded-full hover:scale-105 transition-transform">
                   Export Data
                 </button>
              </div>
           </div>

           <div className="w-full overflow-x-auto min-h-[400px] relative">
             {loading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-10">
                 <Loader2 className="w-10 h-10 text-[#14B8A6] animate-spin" />
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
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          log.level === 'Error' ? 'text-red-400 bg-red-400/10 border border-red-400/20' :
                          log.level === 'Warning' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
                          'text-[#14B8A6] bg-[#14B8A6]/10 border border-[#14B8A6]/20'
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
           <div className="flex items-center justify-between p-6 border-t border-white/5 bg-black/20">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
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
