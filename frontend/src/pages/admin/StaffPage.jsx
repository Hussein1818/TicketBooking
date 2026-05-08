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
        await createAdmin(payload, token);
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
      <div className="mx-auto max-w-4xl pb-16">

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <Shield className="text-teal-400 w-8 h-8" />
            Staff <span className="text-teal-400">Directory</span>
          </h1>
          <p className="text-sm text-zinc-400">Manage elevated access credentials and platform administrators.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Form ── */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-white/5 bg-[#16171a] p-8">
              <div className="mb-6 border-b border-white/5 pb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#8e959b]">Provision New Key</h2>
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
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] pl-11 pr-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Username</label>
                    <input
                      type="text" name="username" required value={formData.username}
                      onChange={handleInputChange} placeholder="sarah_c"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] pl-11 pr-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] pl-11 pr-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Role toggle + Submit */}
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox" name="asAdmin" checked={formData.asAdmin}
                        onChange={handleInputChange} className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-zinc-700 rounded-full peer peer-checked:bg-teal-400 transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-zinc-400 group-hover:text-white transition-colors">
                      {formData.asAdmin ? 'Create as Admin' : 'Create as Staff'}
                    </span>
                  </label>

                  <button
                    type="submit" disabled={loading}
                    className="flex items-center gap-2 rounded bg-teal-400 px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-[#0e1011] transition-colors hover:bg-teal-300 disabled:opacity-50"
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
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-6">
              <Shield className="w-6 h-6 text-teal-400 mb-4" />
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Level 4 Clearance</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Accounts generated here bypass normal verification and are granted immediate write access.
                <br /><br />
                Toggle the switch to choose between <span className="text-teal-400 font-medium">Staff</span> and <span className="text-violet-400 font-medium">Admin</span> roles before issuing credentials.
              </p>
            </div>

            {/* Role info cards */}
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/5 bg-[#16171a] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Staff</p>
                <p className="text-xs text-zinc-400">Can manage events, validate tickets, run campaigns.</p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-1">Admin</p>
                <p className="text-xs text-zinc-400">Full platform access including user management and system config.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
