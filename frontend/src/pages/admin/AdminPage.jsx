import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BarChart3, Loader2, Shield, Terminal, Users, CalendarPlus, Pencil } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuthStore from "../../store/useAuthStore";
import { getDashboard } from "../../services/adminApi";

const adminLinks = [
  { label: "Users Management", to: "/users-management", icon: Users, description: "View and manage all registered users" },
  { label: "Staff Config", to: "/staff", icon: Users, description: "Create staff/admin accounts" },
  { label: "Analytics", to: "/analytics", icon: BarChart3, description: "View admin analytics" },
  { label: "System Logs", to: "/logs", icon: Terminal, description: "Review audit logs" },
  { label: "Create Event", to: "/create-event", icon: CalendarPlus, description: "Create new platform events" },
  { label: "Edit Events", to: "/edit-events", icon: Pencil, description: "Select and update existing events" },
];

export default function AdminPage() {
  const token = useAuthStore((state) => state.token);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getDashboard(token);
        setDashboard(data);
      } catch (err) {
        if (err?.response?.status === 401) {
          setError("Unauthorized: your session may not have admin dashboard access right now.");
          return;
        }
        setError(err?.response?.data?.message || err?.response?.data?.title || "Failed to fetch admin dashboard.");
      } finally {
        setLoading(false);
      }
    };

    if (token && isAdmin) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [token, isAdmin]);

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <DashboardLayout>
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-md flex items-center gap-4">
            <Shield className="h-10 w-10 text-[#14B8A6]" />
            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Control</span>
          </h1>
          <p className="mt-3 text-base text-zinc-400 leading-relaxed">Central entry for admin operations and system management.</p>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden p-8 lg:p-10">
          <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-zinc-400 ml-1">Dashboard Snapshot</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
            </div>
          ) : error ? (
            <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-medium text-red-400 flex items-center gap-3 backdrop-blur-sm shadow-xl">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-1 hover:bg-white/[0.04] duration-300">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Revenue</p>
                  <p className="truncate text-3xl font-bold text-white drop-shadow-sm">{dashboard?.totalRevenue ?? dashboard?.revenue ?? "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-1 hover:bg-white/[0.04] duration-300">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Users</p>
                  <p className="truncate text-3xl font-bold text-white drop-shadow-sm">{dashboard?.totalUsers ?? dashboard?.users ?? "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-1 hover:bg-white/[0.04] duration-300">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Events</p>
                  <p className="truncate text-3xl font-bold text-white drop-shadow-sm">{dashboard?.totalEvents ?? dashboard?.events ?? "-"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#14B8A6]/30 hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#14B8A6]/10 blur-[40px] rounded-full pointer-events-none group-hover:opacity-70 transition-opacity"></div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 border border-white/5 shadow-inner relative z-10">
                <item.icon className="h-7 w-7 text-[#14B8A6] drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white drop-shadow-sm relative z-10">{item.label}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed relative z-10">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
