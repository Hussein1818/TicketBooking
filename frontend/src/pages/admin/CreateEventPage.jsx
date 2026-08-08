import { useState } from "react";
import {
  Upload, Plus, Calendar as CalendarIcon, MapPin, Tag,
  Loader2, Info, Ticket, Users, DollarSign
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuthStore from "../../store/useAuthStore";
import { manageEvent } from "../../services/adminApi";

const CATEGORIES = [
  "Cinema",
  "Anime",
  "Gaming",
  "Music",
  "Art",
  "Shows",
  "Tech",
  "Entrepreneurship",
  "Business",
  "Workshops",
  "Self Growth",
  "Sports",
];

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [imagePreview, setImagePreview] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    eventDate: "",
    venue: "",
    isClosed: false,
    maxTicketsPerUser: 5,
    category: "Cinema",
    fullRefundDays: 30,
    partialRefundDays: 15,
    partialRefundPercentage: 50,
    ticketPrice: 0,
    vipTicketPrice: 0,
    regularSeatsCount: 0,
    vipSeatsCount: 0,
  });

  const minEventDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const selectedDate = new Date(formData.eventDate);
      if (
        Number.isNaN(selectedDate.getTime()) ||
        selectedDate.getTime() <= Date.now()
      ) {
        setError("Event date must be in the future.");
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append("Name", formData.name);
      data.append("EventDate", selectedDate.toISOString());
      data.append("Venue", formData.venue);
      data.append("IsClosed", formData.isClosed ? "true" : "false");
      data.append("MaxTicketsPerUser", Number(formData.maxTicketsPerUser));
      data.append("Category", formData.category);
      data.append("TicketPrice", Number(formData.ticketPrice));
      data.append("VipTicketPrice", Number(formData.vipTicketPrice));
      data.append("RegularSeatsCount", Number(formData.regularSeatsCount));
      data.append("VipSeatsCount", Number(formData.vipSeatsCount));
      data.append("FullRefundDays", Number(formData.fullRefundDays));
      data.append("PartialRefundDays", Number(formData.partialRefundDays));
      data.append("PartialRefundPercentage", Number(formData.partialRefundPercentage));
      data.append("IsAdmin", "true");

      let currentUserId = user?.id || user?.userId || user?.Id;
      if (!currentUserId && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          currentUserId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.nameid || payload.sub || payload.id || payload.uid;
        } catch (e) {
          console.error("Failed to parse token payload", e);
        }
      }

      if (currentUserId) {
        data.append("CurrentUserId", currentUserId);
        data.append("OrganizerId", currentUserId);
      }

      if (coverImage) {
        data.append("CoverImage", coverImage);
      }

      await manageEvent(data, token);

      setSuccess("Event successfully created and deployed to the platform.");

      // Reset form
      setFormData({
        name: "", eventDate: "", venue: "", isClosed: false,
        maxTicketsPerUser: 5, category: "Cinema", fullRefundDays: 30,
        partialRefundDays: 15, partialRefundPercentage: 50,
        ticketPrice: 0, vipTicketPrice: 0, regularSeatsCount: 0, vipSeatsCount: 0,
      });
      setCoverImage(null);
      setImagePreview(null);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Failed to create event."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl pb-16 space-y-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-md mb-3 flex items-center gap-4">
            <CalendarIcon className="text-[#14B8A6] w-10 h-10" />
            Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Event</span>
          </h1>
          <p className="text-base text-zinc-400 leading-relaxed">
            Configure parameters for new platform event deployments.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400 backdrop-blur-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-teal-500/50 bg-teal-500/10 p-4 text-sm text-teal-400 backdrop-blur-md">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover Asset Upload */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden p-8 lg:p-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#8e959b] mb-4">
              Cover Asset
            </h2>

            <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl bg-black/40 hover:bg-white/[0.03] transition-colors cursor-pointer min-h-[250px] shadow-inner">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />

              {imagePreview ? (
                <div className="absolute inset-0 z-10 p-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg border border-white/10"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold tracking-widest text-sm bg-black/80 px-4 py-2 rounded-lg backdrop-blur">
                      Change Asset
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-zinc-500 z-10 pointer-events-none">
                  <Upload className="w-10 h-10 mb-4 text-[#14B8A6]/50" />
                  <p className="text-sm font-bold text-white mb-1">
                    Click to upload or drag image
                  </p>
                  <p className="text-xs">Supports JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Core Details */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-8 lg:p-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#8e959b] mb-6">
              Event Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                  Event Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Velocity Fest III"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                    Deployment Date & Time
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="datetime-local"
                      name="eventDate"
                      required
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      min={minEventDateTime}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                    Venue / Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      name="venue"
                      required
                      value={formData.venue}
                      onChange={handleInputChange}
                      placeholder="Location or Virtual Link"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#14B8A6]" />
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isActive = formData.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, category: cat }))
                        }
                        className={`rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                          isActive
                            ? "border-[#14B8A6]/50 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                            : "border-white/10 bg-black/40 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ticket Prices & Seat Allocations */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-[#14B8A6]" /> Ticket Pricing
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> Regular Price (EGP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">EGP</span>
                      <input
                        type="number"
                        name="ticketPrice"
                        value={formData.ticketPrice}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-yellow-500/80 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> VIP Price (EGP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-yellow-600">EGP</span>
                      <input
                        type="number"
                        name="vipTicketPrice"
                        value={formData.vipTicketPrice}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-yellow-500/20 bg-black/40 pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-600 focus:border-yellow-500/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 pt-2">
                  <Users className="h-4 w-4 text-[#14B8A6]" /> Seat Allocation
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Regular Seats</label>
                    <input
                      type="number"
                      name="regularSeatsCount"
                      value={formData.regularSeatsCount}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#14B8A6]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-yellow-500/80">VIP Seats</label>
                    <input
                      type="number"
                      name="vipSeatsCount"
                      value={formData.vipSeatsCount}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full rounded-2xl border border-yellow-500/20 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-yellow-500/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-600">⚡ Seats will be auto-generated when the event is created.</p>
              </div>

              {/* Lock Event toggle */}
              <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between shadow-inner">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Lock Event</h3>
                  <p className="text-xs text-zinc-400">Prevent further bookings independent of capacity.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isClosed"
                    checked={formData.isClosed}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]" />
                </label>
              </div>
            </div>
          </div>

          {/* Refund Logic */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-8 lg:p-10">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#8e959b]">
                Automated Refund Logic
              </h2>
              <Info className="w-4 h-4 text-zinc-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                  Full Refund Window (Days)
                </label>
                <input
                  type="number"
                  name="fullRefundDays"
                  value={formData.fullRefundDays}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#e8cd51]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                  Partial Window (Days)
                </label>
                <input
                  type="number"
                  name="partialRefundDays"
                  value={formData.partialRefundDays}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#e8cd51]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                  Partial Return (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="partialRefundPercentage"
                    value={formData.partialRefundPercentage}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-600 focus:border-[#e8cd51]/50 focus:bg-white/[0.03] focus:outline-none transition-all shadow-inner pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex min-w-[200px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E] px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
