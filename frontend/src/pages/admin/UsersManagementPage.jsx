import { useEffect, useState, useMemo } from "react";
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

const ROLE_STYLES = {
  Admin: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  Staff: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
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

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    if (token && isAdmin) fetchUsers();
    else setLoading(false);
  }, [token, isAdmin]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[#16171a] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
              <Users className="h-6 w-6 text-teal-400" />
              Users Management
            </h1>
            <p className="mt-1 text-sm text-zinc-400">All registered accounts on the platform</p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1e1f23] px-4 py-2 text-sm text-zinc-300 transition hover:border-teal-400/40 hover:text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Users", value: stats.total, icon: Users, color: "text-teal-400" },
            { label: "Admins", value: stats.admins, icon: Shield, color: "text-violet-400" },
            { label: "Staff", value: stats.staff, icon: UserCheck, color: "text-blue-400" },
            { label: "Regular", value: stats.regular, icon: UserX, color: "text-zinc-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-white/5 bg-[#16171a] p-4">
              <div className="mb-2 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
              </div>
              <p className="text-2xl font-semibold text-white">{loading ? "—" : value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-[#16171a] p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by username, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/5 bg-[#111214] py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-teal-400/40 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {allRoles.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  roleFilter === r
                    ? "bg-teal-400 text-black"
                    : "border border-white/10 bg-[#1e1f23] text-zinc-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#16171a]">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
              <p className="text-sm text-zinc-400">Loading users...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={fetchUsers}
                className="mt-2 rounded-lg bg-teal-400/10 px-4 py-2 text-sm text-teal-400 hover:bg-teal-400/20"
              >
                Try Again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Users className="h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-500">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-[#111214]">
                    {[
                      { key: "id", label: "#" },
                      { key: "username", label: "Username", icon: User },
                      { key: "email", label: "Email", icon: Mail },
                      { key: "roles", label: "Role" },
                    ].map(({ key, label, icon: Icon }) => (
                      <th
                        key={key}
                        onClick={() => key !== "roles" && handleSort(key)}
                        className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 ${
                          key !== "roles" ? "cursor-pointer hover:text-white select-none" : ""
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {Icon && <Icon className="h-3.5 w-3.5" />}
                          {label}
                          {key !== "roles" && <SortIcon field={key} />}
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
                        <td className="px-5 py-3.5 font-mono text-xs text-zinc-500">
                          {user.id ?? idx + 1}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-xs font-bold text-teal-400">
                              {user.username?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <span className="font-medium text-white">{user.username ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400">{user.email ?? "—"}</td>
                        <td className="px-5 py-3.5">{getRoleBadge(roles)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* ── Footer count ── */}
              <div className="border-t border-white/5 px-5 py-3">
                <p className="text-xs text-zinc-500">
                  Showing <span className="text-zinc-300">{filtered.length}</span> of{" "}
                  <span className="text-zinc-300">{users.length}</span> users
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
