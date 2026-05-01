import { Loader2, CheckCircle, User, Lock, EyeOff, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import AuthLayout from '../../layouts/AuthLayout';
import useAuthStore from '../../store/useAuthStore';
import logoUrl from '../../assets/logo.png';

import LiquidEther from '../../components/LiquidEther';

export default function SignInPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ticketok.runasp.net';
      const response = await axios.post(`${baseUrl}/api/Auth/login`, {
        usernameOrEmail: formData.username,
        password: formData.password
      });

      login(response.data.accessToken || response.data.token, response.data.user, response.data.refreshToken);

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col md:flex-row w-full rounded-2xl bg-[#1e1e20] shadow-2xl ring-1 ring-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Left Side: LiquidEther & Welcome */}
        <div className="relative w-full md:w-[45%] lg:w-1/2 min-h-[250px] md:min-h-full flex flex-col items-center justify-center p-8 overflow-hidden bg-black/80">
          <div className="absolute inset-0 z-0 pointer-events-auto">
            <LiquidEther />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/80 z-0"></div>
          <div className="relative z-10 text-center pointer-events-none flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center mb-6 drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]">
              <img src={logoUrl} alt="TicketOk Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4 drop-shadow-xl">Welcome Back</h2>
            <p className="text-zinc-200 text-sm md:text-base max-w-xs drop-shadow-md">
              Securely access your account, explore events, and manage your tickets in style.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-[55%] lg:w-1/2 p-8 md:p-10 lg:p-14 flex flex-col justify-center bg-[#18181b]/50 backdrop-blur-xl">
          <div className="mb-8">
            <h3 className="text-2xl font-medium text-white tracking-tight">Log In to TicketOk</h3>
            <p className="text-sm text-zinc-400 mt-2">Enter your credentials below to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}
            
            {success && (
              <div className="rounded-lg border border-teal-500/50 bg-teal-500/10 p-3 text-sm text-teal-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Username or email</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Example12" 
                  className="w-full rounded-lg border border-white/5 bg-[#2a2a2b]/80 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 transition-colors focus:border-teal-400/50 focus:bg-[#313133] focus:outline-none focus:ring-1 focus:ring-teal-400/50" 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-teal-400 hover:text-teal-300">Forgot Password?</Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password" 
                  className="w-full rounded-lg border border-white/5 bg-[#2a2a2b]/80 pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 transition-colors focus:border-teal-400/50 focus:bg-[#313133] focus:outline-none focus:ring-1 focus:ring-teal-400/50" 
                  required
                />
                <EyeOff className="absolute right-3.5 h-4 w-4 text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-400 py-3 text-sm font-bold text-black transition-all hover:bg-teal-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_25px_rgba(45,212,191,0.4)]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Log In"
              )}
            </button>

            <p className="mt-8 text-center text-xs text-zinc-400">
              Do not have an account?{' '}
              <Link to="/signup" className="text-teal-400 transition-colors hover:text-teal-300 font-medium">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}