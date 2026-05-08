import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BarChart3, Loader2, Shield, Terminal, Users, CalendarPlus } from "lucide-react";
import axios from "axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuthStore from "../../store/useAuthStore";

const adminLinks = [
  { label: "Users Management", to: "/users-management", icon: Users, description: "View and manage all registered users" },
  { label: "Staff Config", to: "/staff", icon: Users, description: "Create staff/admin accounts" },
  { label: "Analytics", to: "/analytics", icon: BarChart3, description: "View admin analytics" },
  { label: "System Logs", to: "/logs", icon: Terminal, description: "Review audit logs" },
  { label: "Manage Event", to: "/manage-event", icon: CalendarPlus, description: "Create and update events" },
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
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";
        const response = await axios.get(`${baseUrl}/api/Admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboard(response.data);
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
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        <div className="rounded-xl border border-white/5 bg-[#16171a] p-6">
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-white">
            <Shield className="h-7 w-7 text-teal-400" />
            Admin Control
          </h1>
          <p className="text-sm text-zinc-400">Central entry for admin operations.</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#16171a] p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-400">Dashboard Snapshot</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-white/5 bg-[#111214] p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Revenue</p>
                <p className="text-2xl font-semibold text-white">{dashboard?.totalRevenue ?? dashboard?.revenue ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#111214] p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Users</p>
                <p className="text-2xl font-semibold text-white">{dashboard?.totalUsers ?? dashboard?.users ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#111214] p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Events</p>
                <p className="text-2xl font-semibold text-white">{dashboard?.totalEvents ?? dashboard?.events ?? "-"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {adminLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-xl border border-white/5 bg-[#16171a] p-5 transition-colors hover:border-teal-400/40 hover:bg-[#1a1b1f]"
            >
              <item.icon className="mb-3 h-6 w-6 text-teal-400" />
              <h3 className="text-lg font-medium text-white">{item.label}</h3>
              <p className="text-sm text-zinc-400">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
