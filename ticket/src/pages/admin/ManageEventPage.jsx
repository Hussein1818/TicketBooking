import { useState, useEffect } from "react";
import {
  Upload, Plus, Calendar as CalendarIcon, MapPin, Tag,
  Loader2, Info, Pencil, Ticket, Users, DollarSign,
  Trash2, AlertCircle, CheckCircle2,
} from "lucide-react";
import axios from "axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuthStore from "../../store/useAuthStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";
const resolveImg = (url) => !url ? null : url.startsWith("http") ? url : `${BASE_URL}${url}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBA";

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

export default function ManageEventPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]   = useState("");
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  // ── Delete state ──────────────────────────────────────────────
  const [deleteLoading, setDeleteLoad] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    const eventId = Number(formData.id);
    if (!eventId) return;
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleteLoad(true); setError(""); setSuccess("");
    try {
      await axios.delete(`${BASE_URL}/api/Events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(`Event #${eventId} deleted successfully.`);
      setFormData({ id: "", name: "", eventDate: "", venue: "", isClosed: false,
        maxTicketsPerUser: 5, category: "Cinema", fullRefundDays: 30,
        partialRefundDays: 15, partialRefundPercentage: 50,
        ticketPrice: 0, vipTicketPrice: 0, regularSeatsCount: 0, vipSeatsCount: 0 });
      setCoverImage(null); setImagePreview(null); setDeleteConfirm(false);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.title || err?.message || "Delete failed.");
      setDeleteConfirm(false);
    } finally {
      setDeleteLoad(false);
    }
  };

  // Basic states for the form
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
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
  const [coverImage, setCoverImage] = useState(null);
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
      const eventIdValue = Number(formData.id || 0);
      const isUpdate = eventIdValue > 0;

      if (isUpdate) {
        data.append("Id", eventIdValue);
      }

      data.append("Name", formData.name);
      data.append("EventDate", selectedDate.toISOString());
      data.append("Venue", formData.venue);
      data.append("IsClosed", formData.isClosed ? "true" : "false");
      data.append("MaxTicketsPerUser", Number(formData.maxTicketsPerUser));
      data.append("Category", formData.category);
      data.append("TicketPrice", Number(formData.ticketPrice));
      data.append("VipTicketPrice", Number(formData.vipTicketPrice));
      data.append("FullRefundDays", Number(formData.fullRefundDays));
      data.append("PartialRefundDays", Number(formData.partialRefundDays));
      data.append("PartialRefundPercentage", Number(formData.partialRefundPercentage));
      data.append("IsAdmin", "true");
      data.append("CurrentUserId",
        user?.id || user?.userId || user?.username || user?.email || "admin");

      // Seats only on CREATE
      if (!isUpdate) {
        data.append("RegularSeatsCount", Number(formData.regularSeatsCount));
        data.append("VipSeatsCount",     Number(formData.vipSeatsCount));
      }

      if (coverImage) {
        data.append("CoverImage", coverImage);
      }

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";
      const endpoint = isUpdate
        ? `${baseUrl}/api/Events/${eventIdValue}`
        : `${baseUrl}/api/Events`;
      const request = isUpdate ? axios.put : axios.post;

      await request(endpoint, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess(
        isUpdate
          ? "Event successfully updated."
          : "Event successfully created and deployed to the network.",
      );

      // reset form
      setFormData({
        id: "", name: "", eventDate: "", venue: "", isClosed: false,
        maxTicketsPerUser: 5, category: "Cinema", fullRefundDays: 30,
        partialRefundDays: 15, partialRefundPercentage: 50,
        ticketPrice: 0, vipTicketPrice: 0, regularSeatsCount: 0, vipSeatsCount: 0,
      });
      setCoverImage(null);
      setImagePreview(null);

      // Scroll to top
      window.scrollTo(0, 0);
    } catch (err) {
      console.log("Status:", err.response?.status);
  console.log("Full error data:", err.response?.data);
  console.log("Headers:", err.response?.headers);
  setError(
    JSON.stringify(err.response?.data) || err.message || "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Manage <span className="text-teal-400">Event</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Configure parameters for new platform deployments.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-teal-500/50 bg-teal-500/10 p-4 text-sm text-teal-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Hero Image Upload */}
          <div className="rounded-xl border border-white/5 bg-[#16171a] overflow-hidden p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#8e959b] mb-4">
              Cover Asset
            </h2>

            <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-xl bg-[#0a0a0c] hover:bg-white/5 transition-colors cursor-pointer min-h-[250px]">
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
                  <Upload className="w-10 h-10 mb-4 text-teal-400/50" />
                  <p className="text-sm font-bold text-white mb-1">
                    Click to upload or drag image
                  </p>
                  <p className="text-xs">Supports JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Core Details */}
          <div className="rounded-xl border border-white/5 bg-[#16171a] p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#8e959b] mb-6">
              Core Telemetry
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                  Event ID (for update only)
                </label>
                <div className="relative">
                  <Pencil className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    name="id"
                    min="0"
                    value={formData.id}
                    onChange={handleInputChange}
                    placeholder="Leave empty to create new event"
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] pl-11 pr-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                  Event Identity (Name)
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Velocity Fest III"
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                    Deployment Date
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
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] pl-11 pr-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                    Venue Coordinates
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
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] pl-11 pr-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ── Category Selector ── */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Tag className="w-4 h-4 text-teal-400" />
                  Category Classification
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
                        className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                          isActive
                            ? "border-teal-500 bg-teal-500/10 text-teal-400"
                            : "border-white/10 bg-[#0a0a0c] text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Tickets: prices + seat counts ── */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Ticket className="h-3.5 w-3.5 text-teal-400" /> Ticket Pricing
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Regular price */}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> Regular Price (EGP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">EGP</span>
                      <input type="number" name="ticketPrice" value={formData.ticketPrice}
                        onChange={handleInputChange} min="0" step="0.01" placeholder="0.00"
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] pl-11 pr-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none" />
                    </div>
                  </div>
                  {/* VIP price */}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-yellow-500/80 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> VIP Price (EGP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-yellow-600">EGP</span>
                      <input type="number" name="vipTicketPrice" value={formData.vipTicketPrice}
                        onChange={handleInputChange} min="0" step="0.01" placeholder="0.00"
                        className="w-full rounded-lg border border-yellow-500/20 bg-[#0a0a0c] pl-11 pr-4 py-3.5 text-sm text-white focus:border-yellow-500/50 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Seat counts — only shown when creating */}
                {!Number(formData.id) && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 pt-2">
                      <Users className="h-3.5 w-3.5 text-teal-400" /> Seat Allocation (auto-generated)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Regular Seats</label>
                        <input type="number" name="regularSeatsCount" value={formData.regularSeatsCount}
                          onChange={handleInputChange} min="0"
                          className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3.5 text-sm text-white focus:border-teal-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-yellow-500/80">VIP Seats</label>
                        <input type="number" name="vipSeatsCount" value={formData.vipSeatsCount}
                          onChange={handleInputChange} min="0"
                          className="w-full rounded-lg border border-yellow-500/20 bg-[#0a0a0c] px-4 py-3.5 text-sm text-white focus:border-yellow-500/50 focus:outline-none" />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600">⚡ Seats will be auto-generated when the event is created.</p>
                  </>
                )}
              </div>

              {/* Lock toggle */}
              <div className="p-4 rounded-lg bg-[#212328] border border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Lock Event</h3>
                  <p className="text-xs text-zinc-400">Prevent further bookings independent of capacity.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isClosed" checked={formData.isClosed}
                    onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-400" />
                </label>
              </div>
            </div>
          </div>


          <div className="rounded-xl border border-white/5 bg-[#16171a] p-6">
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
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3.5 text-sm text-white focus:border-[#e8cd51] focus:outline-none"
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
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3.5 text-sm text-white focus:border-[#e8cd51] focus:outline-none"
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
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3.5 text-sm text-white focus:border-[#e8cd51] focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit + Delete */}
          <div className="flex items-center justify-between gap-4">
            {/* Delete — only when updating */}
            {Number(formData.id) > 0 && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className={`flex items-center gap-2 rounded px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                  deleteConfirm
                    ? "bg-red-500 text-white hover:bg-red-400"
                    : "border border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10"
                }`}
              >
                {deleteLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />
                }
                {deleteConfirm ? "Confirm Delete" : "Delete Event"}
              </button>
            )}
            {deleteConfirm && (
              <button type="button" onClick={() => setDeleteConfirm(false)}
                className="text-xs text-zinc-500 hover:text-white transition-colors">
                Cancel
              </button>
            )}
            <div className="flex-1" />
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 rounded bg-teal-400 px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-teal-300 disabled:opacity-50">
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Plus className="w-5 h-5" /> {formData.id ? "Update Event" : "Create Event"}</>
              }
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
