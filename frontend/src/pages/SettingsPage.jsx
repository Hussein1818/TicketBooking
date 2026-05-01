import { useState, useRef, useEffect } from "react";
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
function InfoChip({ icon: Icon, label, value, accent = "text-teal-400" }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#111214] px-4 py-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value ?? "—"}</p>
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
    FullName:   "",
    NationalId: "",
    Address:    "",
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
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await getProfile(token);
      setProfile(data);
      // populate editable fields from server response
      setFormData({
        FullName:   data?.fullName   || data?.FullName   || "",
        NationalId: data?.nationalId || data?.NationalId || "",
        Address:    data?.address    || data?.Address    || "",
      });
      setServerImageUrl(
        resolveImg(data?.profilePictureUrl || data?.profilePicture || data?.imageUrl || null)
      );
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
    else setProfileLoading(false);
  }, [token]);

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
      fd.append("FullName",   formData.FullName);
      fd.append("NationalId", formData.NationalId);
      fd.append("Address",    formData.Address);
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
      {/* ── Crop Modal ───────────────────────────────────────────── */}
      {isCropping && tempImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#16171a] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0a0a0c]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Crop Profile Picture</h3>
              <button type="button" onClick={handleCropCancel} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative h-64 sm:h-80 w-full bg-black">
              <Cropper
                image={tempImageUrl} crop={crop} zoom={zoom} aspect={1}
                cropShape="round" showGrid={false}
                onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom}
              />
            </div>
            <div className="p-5 flex flex-col gap-5 bg-[#0a0a0c]">
              <div className="flex items-center gap-4">
                <span className="w-12 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Zoom</span>
                <input
                  type="range" value={zoom} min={1} max={3} step={0.1}
                  onChange={(e) => setZoom(e.target.value)}
                  className="flex-1 accent-teal-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleCropCancel}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleCropConfirm}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-wider bg-teal-400 text-black rounded hover:bg-teal-300 transition-colors">
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-6 pb-16">

        {/* ── Page title ───────────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase">Account Settings</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage your profile and identity details.</p>
        </div>

        {/* ── Feedback banners ─────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-teal-500/40 bg-teal-500/10 px-4 py-3 text-sm text-teal-400">
            <CheckCircle className="h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            SINGLE FORM — PUT /api/Users/profile
        ════════════════════════════════════════════════════════════ */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-white/5 bg-[#16171a] overflow-hidden">

            {/* ── Section header ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
              <User className="h-5 w-5 text-teal-400" />
              <h2 className="text-base font-bold text-white">Profile Information</h2>
            </div>

            <div className="p-6 lg:p-8 space-y-8">

              {/* ── Avatar + name preview ─────────────────────────────── */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="relative h-24 w-24 cursor-pointer rounded-full border-2 border-dashed border-white/20 bg-[#0a0a0c] overflow-hidden group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profileLoading ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                      </div>
                    ) : displayImg ? (
                      <img src={displayImg} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-3xl font-bold text-teal-400/60">
                          {displayName[0]?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {profilePic ? "New photo staged" : "Click to change"}
                  </p>
                </div>

                {/* Name + email display */}
                <div className="flex flex-col justify-center gap-1">
                  <p className="text-xl font-bold text-white">{displayName}</p>
                  <p className="text-sm text-zinc-400">{profile?.email || user?.email || "—"}</p>
                  {profile?.username && (
                    <p className="text-xs text-zinc-600">@{profile.username}</p>
                  )}
                </div>
              </div>

              {/* ── Editable fields ───────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Full Legal Name
                  </label>
                  <input
                    type="text" name="FullName" value={formData.FullName}
                    onChange={handleChange} placeholder="Enter your full name"
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                  />
                </div>

                {/* National ID */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">
                    National ID / Passport
                  </label>
                  <input
                    type="text" name="NationalId" value={formData.NationalId}
                    onChange={handleChange} placeholder="Enter national ID"
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Address
                    </span>
                  </label>
                  <input
                    type="text" name="Address" value={formData.Address}
                    onChange={handleChange} placeholder="City, Country"
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                  />
                </div>
              </div>

              {/* ── Read-only account info ────────────────────────────── */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Account Info</p>
                {profileLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                    <span className="text-xs text-zinc-500">Loading...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <InfoChip
                      icon={Wallet} label="Wallet Balance"
                      value={balance !== null ? `EGP ${Number(balance).toLocaleString()}` : null}
                      accent="text-teal-400"
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
              <div className="flex justify-end border-t border-white/5 pt-6">
                <button
                  type="submit" disabled={loading || profileLoading}
                  className="flex min-w-[160px] items-center justify-center gap-2 rounded-lg bg-teal-400 px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* ── Fan ID Download ───────────────────────────────────────── */}
        <div className="rounded-xl border border-white/5 bg-[#16171a] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-white">
                <Shield className="h-5 w-5 text-[#a88832]" />
                Secure Fan ID
              </h2>
              <p className="mt-1 text-sm text-zinc-400 max-w-sm">
                Your digital passport for event entry. Complete your profile before downloading.
              </p>
            </div>
            <div className="shrink-0">
              {downloadError && <p className="mb-2 text-xs text-red-400">{downloadError}</p>}
              <button
                type="button"
                onClick={handleDownloadFanId} disabled={downloading}
                className="flex items-center gap-2 rounded-lg border border-[#a88832]/50 bg-[#a88832]/10 px-5 py-2.5 text-sm font-bold text-[#e8cd51] transition-all hover:bg-[#a88832]/20 hover:border-[#a88832] disabled:opacity-50"
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
