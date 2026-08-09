import { useState } from 'react';
import { Shield, UserPlus, Mail, Lock, Loader2, CheckCircle2, AlertCircle, User } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import useAuthStore from '../../store/useAuthStore';
import { createAdmin, createStaff } from '../../services/adminApi';

export default function StaffPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const token = useAuthStore((s) => s.token);

  const [formData, setFormData] = useState({
    username:  '',
    email:     '',
    password:  '',
    fullName:  '',
    asAdmin:   false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      username: formData.username,
      email:    formData.email,
      password: formData.password,
      fullName: formData.fullName,
    };

    try {
      if (formData.asAdmin) {
        // Admin only requires email + password
        await createAdmin({ email: formData.email, password: formData.password }, token);
      } else {
        await createStaff(payload, token);
      }
      setSuccess(`${formData.asAdmin ? 'Admin' : 'Staff'} account for "${formData.fullName}" has been provisioned.`);
      setFormData({ username: '', email: '', password: '', fullName: '', asAdmin: false });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.title   ||
        err?.message                 ||
        'Failed to provision account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl pb-16 space-y-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">

        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-md mb-3 flex items-center gap-4">
            <Shield className="text-[#14B8A6] w-10 h-10" />
            Staff <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Directory</span>
          </h1>
          <p className="text-base text-zinc-400 leading-relaxed">Manage elevated access credentials and platform administrators.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Form ── */}
          <div className="lg:col-span-2">
            <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-8 lg:p-10">
              <div className="mb-8 border-b border-white/5 pb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Provision New Key</h2>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> {error}
                </div>
              )}
              {success && (
                <div className="mb-6 rounded-lg border border-teal-500/50 bg-teal-500/10 p-4 text-sm text-teal-400 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text" name="fullName" required value={formData.fullName}
                        onChange={handleInputChange} placeholder="e.g. Sarah Connor"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Username</label>
                    <input
                      type="text" name="username" required value={formData.username}
                      onChange={handleInputChange} placeholder="sarah_c"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email" name="email" required value={formData.email}
                      onChange={handleInputChange} placeholder="sarah@velocity.internal"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Initial Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="password" name="password" required value={formData.password}
                      onChange={handleInputChange} placeholder="••••••••••••"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Role toggle + Submit */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/5 pt-8 gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox" name="asAdmin" checked={formData.asAdmin}
                        onChange={handleInputChange} className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-black/40 border border-white/10 rounded-full peer peer-checked:bg-[#14B8A6] peer-checked:border-[#14B8A6] transition-all" />
                      <div className="absolute top-[2px] left-[2px] w-4 h-4 bg-zinc-400 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-white" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400 group-hover:text-white transition-colors">
                      {formData.asAdmin ? 'Create as Admin' : 'Create as Staff'}
                    </span>
                  </label>

                  <button
                    type="submit" disabled={loading}
                    className="flex min-w-[200px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E] px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <><UserPlus className="w-4 h-4" /> {formData.asAdmin ? 'Issue Admin Credentials' : 'Issue Staff Credentials'}</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Side notice ── */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-[2.5rem] border border-[#14B8A6]/20 bg-[#14B8A6]/5 backdrop-blur-xl shadow-lg p-8">
              <Shield className="w-8 h-8 text-[#14B8A6] mb-6 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Level 4 Clearance</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Accounts generated here bypass normal verification and are granted immediate write access.
                <br /><br />
                Toggle the switch to choose between <span className="text-[#14B8A6] font-bold">Staff</span> and <span className="text-violet-400 font-bold">Admin</span> roles before issuing credentials.
              </p>
            </div>

            {/* Role info cards */}
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Staff</p>
                <p className="text-xs text-zinc-400 leading-relaxed">Can manage events, validate tickets, run campaigns.</p>
              </div>
              <div className="rounded-[1.5rem] border border-violet-500/20 bg-violet-500/5 backdrop-blur-xl p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2">Admin</p>
                <p className="text-xs text-zinc-400 leading-relaxed">Full platform access including user management and system config.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
