import { useState, useRef, useEffect, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  User, Shield, Image as ImageIcon, Loader2, Download,
  CheckCircle, X, Wallet, Star, Hash, MapPin,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { getProfile, updateProfile, downloadFanId, getErrorMessage } from "../services/usersApi";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

const resolveImg = (url) =>
  !url ? null : url.startsWith("http") ? url : `${BASE_URL}${url}`;

// ── read-only info chip ──────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function InfoChip({ icon: Icon, label, value, accent = "text-[#14B8A6]" }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-1 hover:bg-white/[0.04] duration-300">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/40 border border-white/5 shadow-inner ${accent}`}>
        <Icon className="h-5 w-5 drop-shadow-sm" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">{label}</p>
        <p className="truncate text-base font-bold text-white drop-shadow-sm">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  // ── server profile snapshot (read-only display) ──────────────
  const [profile, setProfile]               = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── editable form state ──────────────────────────────────────
  const [formData, setFormData] = useState({
    UserId:     "",
    FullName:   "",
    NationalId: "",
    Address:    "",
    PhoneNumber:"",
  });

  // ── image crop ───────────────────────────────────────────────
  const [profilePic, setProfilePic]               = useState(null);   // File to upload
  const [previewUrl, setPreviewUrl]               = useState(null);   // local blob preview
  const [serverImageUrl, setServerImageUrl]       = useState(null);   // url from server
  const [crop, setCrop]                           = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                           = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping]               = useState(false);
  const [tempImageUrl, setTempImageUrl]           = useState(null);
  const fileInputRef = useRef(null);

  // ── feedback ─────────────────────────────────────────────────
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // ── fan-id download ──────────────────────────────────────────
  const [downloading, setDownloading]     = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // ── fetch ────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await getProfile(token);
      setProfile(data);
      // populate editable fields from server response
      setFormData({
        UserId:     data?.userId     || data?.UserId     || user?.id || user?.nameid || "",
        FullName:   data?.fullName   || data?.FullName   || "",
        NationalId: data?.nationalId || data?.NationalId || "",
        Address:    data?.address    || data?.Address    || "",
        PhoneNumber:data?.phoneNumber|| data?.PhoneNumber|| "",
      });
      setServerImageUrl(
        resolveImg(data?.profilePictureUrl || data?.profilePicture || data?.imageUrl || null)
      );
    } catch {
      // silent fallback
    } finally {
      setProfileLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (token) fetchProfile();
    else setProfileLoading(false);
  }, [token, fetchProfile]);

  // ── handlers ─────────────────────────────────────────────────
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setTempImageUrl(URL.createObjectURL(file)); setIsCropping(true); }
  };

  const onCropComplete = (_, cap) => setCroppedAreaPixels(cap);

  const handleCropConfirm = async () => {
    try {
      const blob = await getCroppedImg(tempImageUrl, croppedAreaPixels);
      if (!blob) return;
      setProfilePic(new File([blob], "profile_picture.jpg", { type: "image/jpeg" }));
      setPreviewUrl(URL.createObjectURL(blob));
      setIsCropping(false);
      setTempImageUrl(null);
    } catch { setError("Failed to crop image."); }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setTempImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── single PUT submit ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const fd = new FormData();
      fd.append("UserId",     formData.UserId);
      fd.append("FullName",   formData.FullName);
      fd.append("NationalId", formData.NationalId);
      fd.append("Address",    formData.Address);
      fd.append("PhoneNumber",formData.PhoneNumber);
      if (profilePic) fd.append("ProfilePicture", profilePic);

      await updateProfile(fd, token);
      setSuccess("Profile saved successfully!");
      setProfilePic(null);          // clear staged file
      await fetchProfile();         // refresh display values
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update profile."));
    } finally {
      setLoading(false);
    }
  };

  // ── fan-id ────────────────────────────────────────────────────
  const handleDownloadFanId = async () => {
    setDownloading(true); setDownloadError("");
    try {
      const blob = await downloadFanId(token);
      const url  = window.URL.createObjectURL(new Blob([blob]));
      const a    = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `FanID_${user?.username || "user"}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
    } catch { setDownloadError("Failed to download Fan ID."); }
    finally   { setDownloading(false); }
  };

  // ── derived display values ────────────────────────────────────
  const displayImg  = previewUrl || serverImageUrl;
  const displayName = profile?.fullName || profile?.FullName || user?.username || "—";
  const balance     = profile?.balance       ?? profile?.walletBalance ?? null;
  const loyalty     = profile?.loyaltyPoints ?? profile?.points        ?? null;
  const fanNumber   = profile?.fanNumber     ?? profile?.fanId         ?? null;

  return (
    <DashboardLayout>
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      {/* ── Crop Modal ───────────────────────────────────────────── */}
      {isCropping && tempImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-white/[0.05] overflow-hidden flex flex-col shadow-2xl backdrop-blur-3xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest drop-shadow-sm">Crop Profile Picture</h3>
              <button type="button" onClick={handleCropCancel} className="text-zinc-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative h-64 sm:h-80 w-full bg-black/80">
              <Cropper
                image={tempImageUrl} crop={crop} zoom={zoom} aspect={1}
                cropShape="round" showGrid={false}
                onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom}
              />
            </div>
            <div className="p-6 flex flex-col gap-6 bg-black/40">
              <div className="flex items-center gap-4">
                <span className="w-12 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Zoom</span>
                <input
                  type="range" value={zoom} min={1} max={3} step={0.1}
                  onChange={(e) => setZoom(e.target.value)}
                  className="flex-1 accent-[#14B8A6] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleCropCancel}
                  className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                  Cancel
                </button>
                <button type="button" onClick={handleCropConfirm}
                  className="px-8 py-3 text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] rounded-full hover:scale-105 transition-transform">
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-3xl space-y-8 pb-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">

        {/* ── Page title ───────────────────────────────────────────── */}
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-md">
            Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Settings</span>
          </h1>
          <p className="mt-3 text-base text-zinc-400 leading-relaxed">Manage your profile and secure your identity details.</p>
        </div>

        {/* ── Feedback banners ─────────────────────────────────────── */}
        {error && (
          <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-medium text-red-400 flex items-center gap-3 backdrop-blur-sm shadow-xl">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 rounded-[1.5rem] border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-6 py-4 text-sm font-medium text-[#14B8A6] backdrop-blur-sm shadow-xl">
            <CheckCircle className="h-5 w-5 shrink-0" /> {success}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            SINGLE FORM — PUT /api/Users/profile
        ════════════════════════════════════════════════════════════ */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden">

            {/* ── Section header ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 border-b border-white/5 px-8 py-6 bg-black/20">
              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
                <User className="h-5 w-5 text-[#14B8A6]" />
              </div>
              <h2 className="text-lg font-bold text-white drop-shadow-sm">Profile Information</h2>
            </div>

            <div className="p-8 lg:p-10 space-y-10">

              {/* ── Avatar + name preview ─────────────────────────────── */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="relative h-28 w-28 cursor-pointer rounded-full border border-white/10 bg-black/40 overflow-hidden group shadow-[0_0_30px_rgba(20,184,166,0.15)] ring-4 ring-[#14B8A6]/5 transition-all duration-500 hover:ring-[#14B8A6]/20"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profileLoading ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#14B8A6]" />
                      </div>
                    ) : displayImg ? (
                      <img src={displayImg} alt="Profile" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-4xl font-bold text-[#14B8A6]/60">
                          {displayName[0]?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-sm">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    {profilePic ? "New photo staged" : "Change Photo"}
                  </p>
                </div>

                {/* Name + email display */}
                <div className="flex flex-col justify-center gap-1.5 text-center sm:text-left mt-2">
                  <p className="text-3xl font-bold text-white drop-shadow-md">{displayName}</p>
                  <p className="text-sm font-medium text-zinc-400">{profile?.email || user?.email || "—"}</p>
                  {profile?.username && (
                    <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">@{profile.username}</p>
                  )}
                </div>
              </div>

              {/* ── Editable fields ───────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4 border-t border-white/5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text" name="FullName" value={formData.FullName}
                    onChange={handleChange} placeholder="Enter your full name"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                  />
                </div>

                {/* National ID */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">
                    National ID / Passport
                  </label>
                  <input
                    type="text" name="NationalId" value={formData.NationalId}
                    onChange={handleChange} placeholder="Enter national ID"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">
                    Phone Number
                  </label>
                  <input
                    type="tel" name="PhoneNumber" value={formData.PhoneNumber}
                    onChange={handleChange} placeholder="+1234567890"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Address
                    </span>
                  </label>
                  <input
                    type="text" name="Address" value={formData.Address}
                    onChange={handleChange} placeholder="City, Country"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* ── Read-only account info ────────────────────────────── */}
              <div className="pt-6 border-t border-white/5">
                <p className="mb-5 text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Account Overview</p>
                {profileLoading ? (
                  <div className="flex items-center gap-3 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-[#14B8A6]" />
                    <span className="text-sm font-bold tracking-widest text-zinc-500 uppercase">Loading Details...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <InfoChip
                      icon={Wallet} label="Wallet Balance"
                      value={balance !== null ? `EGP ${Number(balance).toLocaleString()}` : null}
                      accent="text-[#14B8A6]"
                    />
                    <InfoChip
                      icon={Star} label="Loyalty Points"
                      value={loyalty !== null ? Number(loyalty).toLocaleString() : null}
                      accent="text-amber-400"
                    />
                    <InfoChip
                      icon={Hash} label="Fan Number"
                      value={fanNumber}
                      accent="text-violet-400"
                    />
                  </div>
                )}
              </div>

              {/* ── Submit button ─────────────────────────────────────── */}
              <div className="flex justify-end pt-8">
                <button
                  type="submit" disabled={loading || profileLoading}
                  className="flex min-w-[200px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E] px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                  {loading ? "Saving Profile..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* ── Fan ID Download ───────────────────────────────────────── */}
        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#e8cd51]/10 blur-[60px] rounded-full pointer-events-none group-hover:opacity-70 transition-opacity"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-black/40 border border-[#a88832]/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,136,50,0.15)]">
                <Shield className="h-7 w-7 text-[#e8cd51]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-md mb-1">
                  Secure Fan ID
                </h2>
                <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
                  Your digital passport for event entry. Make sure your profile is complete before downloading.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              {downloadError && <p className="mb-2 text-xs text-red-400 font-bold">{downloadError}</p>}
              <button
                type="button"
                onClick={handleDownloadFanId} disabled={downloading}
                className="flex items-center justify-center gap-2 rounded-full border border-[#a88832]/30 bg-gradient-to-r from-[#a88832]/10 to-[#e8cd51]/5 px-8 py-4 text-xs font-bold uppercase tracking-widest text-[#e8cd51] transition-all hover:bg-[#a88832]/20 hover:border-[#a88832]/50 hover:shadow-[0_0_20px_rgba(232,205,81,0.15)] disabled:opacity-50 w-full sm:w-auto"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Fan ID
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
