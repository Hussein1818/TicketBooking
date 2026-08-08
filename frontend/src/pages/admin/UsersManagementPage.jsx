import { useState, useEffect, useMemo, useCallback } from "react";
import { Navigate } from "react-router-dom";
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Shield,
  UserCheck,
  UserX,
  ChevronUp,
  ChevronDown,
  Mail,
  User,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuthStore from "../../store/useAuthStore";
import { getAllUsers } from "../../services/adminApi";
import { assignOrganizer, revokeOrganizer } from "../../services/authApi";

const ROLE_STYLES = {
  Admin: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  Staff: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
  Organizer: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  User: "bg-zinc-700/50 text-zinc-300 border border-zinc-600/40",
};

const getRoleBadge = (roles) => {
  if (!roles || roles.length === 0)
    return <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-700/50 text-zinc-400 border border-zinc-600/40">—</span>;
  const role = Array.isArray(roles) ? roles[0] : roles;
  const style = ROLE_STYLES[role] || ROLE_STYLES["User"];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {role}
    </span>
  );
};

export default function UsersManagementPage() {
  const token = useAuthStore((s) => s.token);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("username");
  const [sortDir, setSortDir] = useState("asc");
  const [roleFilter, setRoleFilter] = useState("All");
  const [organizerLoading, setOrganizerLoading] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUsers(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isAdmin) fetchUsers();
    else setLoading(false);
  }, [token, isAdmin, fetchUsers]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleOrganizerToggle = async (userId, isOrganizer) => {
    setOrganizerLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      if (isOrganizer) {
        await revokeOrganizer(userId);
      } else {
        await assignOrganizer(userId);
      }
      await fetchUsers();
    } catch (err) {
      console.error("Failed to toggle organizer role:", err);
    } finally {
      setOrganizerLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const SortIcon = ({ field }) =>
    sortField === field ? (
      sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
    ) : (
      <ChevronUp className="h-3.5 w-3.5 opacity-20" />
    );

  const allRoles = useMemo(() => {
    const s = new Set(["All"]);
    users.forEach((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : u.role ? [u.role] : [];
      roles.forEach((r) => s.add(r));
    });
    return [...s];
  }, [users]);

  const filtered = useMemo(() => {
    let list = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.id?.toString().includes(q)
      );
    }

    if (roleFilter !== "All") {
      list = list.filter((u) => {
        const roles = Array.isArray(u.roles) ? u.roles : u.role ? [u.role] : [];
        return roles.includes(roleFilter);
      });
    }

    list.sort((a, b) => {
      let aVal = a[sortField] ?? "";
      let bVal = b[sortField] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [users, search, roleFilter, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => (Array.isArray(u.roles) ? u.roles : [u.role]).includes("Admin")).length,
    staff: users.filter((u) => (Array.isArray(u.roles) ? u.roles : [u.role]).includes("Staff")).length,
    regular: users.filter((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [u.role];
      return !roles.includes("Admin") && !roles.includes("Staff");
    }).length,
  }), [users]);

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <DashboardLayout>
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 pb-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-6 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-4 text-4xl font-bold tracking-tighter text-white drop-shadow-md">
              <Users className="h-10 w-10 text-[#14B8A6]" />
              Users <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Management</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">All registered accounts on the platform</p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 transition hover:border-[#14B8A6]/40 hover:text-white disabled:opacity-60 hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Users", value: stats.total, icon: Users, color: "text-[#14B8A6]" },
            { label: "Admins", value: stats.admins, icon: Shield, color: "text-violet-400" },
            { label: "Staff", value: stats.staff, icon: UserCheck, color: "text-blue-400" },
            { label: "Regular", value: stats.regular, icon: UserX, color: "text-zinc-400" },
          ].map(
            // eslint-disable-next-line no-unused-vars
            ({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 shadow-lg transition-transform hover:-translate-y-1 hover:bg-white/[0.04] duration-300">
              <div className="mb-3 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
              </div>
              <p className="text-3xl font-bold text-white drop-shadow-sm">{loading ? "—" : value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 shadow-lg sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by username, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:border-[#14B8A6]/40 focus:outline-none transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {allRoles.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  roleFilter === r
                    ? "bg-[#14B8A6] text-black shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                    : "border border-white/10 bg-black/40 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Loader2 className="h-10 w-10 animate-spin text-[#14B8A6]" />
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Loading users...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-2 rounded-full bg-red-500/10 px-6 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <Users className="h-10 w-10 text-zinc-600" />
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20">
                    {[
                      { key: "id", label: "#" },
                      { key: "username", label: "Username", icon: User },
                      { key: "email", label: "Email", icon: Mail },
                      { key: "roles", label: "Role" },
                      { key: "actions", label: "Actions" },
                    ].map(({ key, label, icon: Icon }) => (
                      <th
                        key={key}
                        onClick={() => key !== "roles" && key !== "actions" && handleSort(key)}
                        className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 ${
                          key !== "roles" && key !== "actions" ? "cursor-pointer hover:text-white select-none" : ""
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {Icon && <Icon className="h-3.5 w-3.5" />}
                          {label}
                          {key !== "roles" && key !== "actions" && <SortIcon field={key} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((user, idx) => {
                    const roles = Array.isArray(user.roles)
                      ? user.roles
                      : user.role
                      ? [user.role]
                      : [];
                    return (
                      <tr
                        key={user.id ?? idx}
                        className="group transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-zinc-500">
                          {user.id ?? idx + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-xs font-bold text-[#14B8A6]">
                              {user.username?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <span className="font-bold text-white drop-shadow-sm">{user.username ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-zinc-400">{user.email ?? "—"}</td>
                        <td className="px-5 py-4">{getRoleBadge(roles)}</td>
                        <td className="px-5 py-4">
                          {!roles.includes("Admin") && !roles.includes("Staff") && (
                            <button
                              onClick={() => handleOrganizerToggle(user.id, roles.includes("Organizer"))}
                              disabled={organizerLoading[user.id]}
                              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                                roles.includes("Organizer")
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30"
                                  : "bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 hover:bg-[#14B8A6]/20"
                              }`}
                            >
                              {organizerLoading[user.id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : roles.includes("Organizer") ? (
                                <>
                                  <UserX className="h-3.5 w-3.5" />
                                  Revoke
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Organizer
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* ── Footer count ── */}
              <div className="border-t border-white/5 bg-black/20 px-8 py-5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Showing <span className="text-white">{filtered.length}</span> of{" "}
                  <span className="text-white">{users.length}</span> users
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
