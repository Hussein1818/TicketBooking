import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  Loader2, Search, Calendar as CalendarIcon, MapPin, Pencil,
  Upload, Tag, Info, Ticket, DollarSign, Trash2, ArrowLeft,
  CheckCircle2, RefreshCw
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuthStore from "../../store/useAuthStore";
import { getEvents, getEventById } from "../../services/eventsApi";
import { manageEvent, deleteEvent } from "../../services/adminApi";

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

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ticketok.runasp.net';

export default function EditEventsPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const [events, setEvents] = useState([]);
  const [fetchingList, setFetchingList] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

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

  const minEventDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  // Load events list on mount
  const loadEventsList = async () => {
    try {
      setFetchingList(true);
      setError("");
      const data = await getEvents({ page: 1, pageSize: 100 });
      const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
      setEvents(list);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load events list.");
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadEventsList();
    }
  }, [isAdmin]);

  // Load selected event details
  const handleSelectEvent = async (evtId) => {
    if (!evtId) {
      setSelectedEventId(null);
      return;
    }
    const idNum = Number(evtId);
    setSelectedEventId(idNum);
    setLoadingEvent(true);
    setError("");
    setSuccess("");
    setDeleteConfirm(false);

    try {
      const data = await getEventById(idNum);
      if (data) {
        setFormData({
          id: data.id || idNum,
          name: data.name || "",
          eventDate: data.eventDate ? data.eventDate.slice(0, 16) : "",
          venue: data.venue || "",
          isClosed: data.isClosed || false,
          maxTicketsPerUser: data.maxTicketsPerUser || 5,
          category: data.category || "Cinema",
          fullRefundDays: data.fullRefundDays || 30,
          partialRefundDays: data.partialRefundDays || 15,
          partialRefundPercentage: data.partialRefundPercentage || 50,
          ticketPrice: data.ticketPrice || 0,
          vipTicketPrice: data.vipTicketPrice || 0,
          regularSeatsCount: data.regularSeatsCount || 0,
          vipSeatsCount: data.vipSeatsCount || 0,
        });

        const imgUrl = data.imageUrl || data.coverImage;
        if (imgUrl) {
          setImagePreview(imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl}`);
        } else {
          setImagePreview(null);
        }
        setCoverImage(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || ("Failed to load details for event #" + idNum));
    } finally {
      setLoadingEvent(false);
    }
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  const filteredEvents = events.filter((e) =>
    (e.name || e.title || "").toLowerCase().includes(search.toLowerCase()) ||
    String(e.id).includes(search)
  );

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
    if (!formData.id) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const selectedDate = new Date(formData.eventDate);
      if (
        Number.isNaN(selectedDate.getTime()) ||
        selectedDate.getTime() <= Date.now()
      ) {
        setError("Event date must be in the future.");
        setSaving(false);
        return;
      }

      const data = new FormData();
      data.append("Id", Number(formData.id));
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
        } catch {
          // silent fallback
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
      setSuccess(`Event #${formData.id} updated successfully.`);
      
      // Refresh event list to update names/dates
      loadEventsList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Failed to update event."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const eventId = Number(formData.id);
    if (!eventId) return;

    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await deleteEvent(eventId, token);
      setSuccess(`Event #${eventId} deleted successfully.`);
      setSelectedEventId(null);
      setFormData({
        id: "", name: "", eventDate: "", venue: "", isClosed: false,
        maxTicketsPerUser: 5, category: "Cinema", fullRefundDays: 30,
        partialRefundDays: 15, partialRefundPercentage: 50,
        ticketPrice: 0, vipTicketPrice: 0, regularSeatsCount: 0, vipSeatsCount: 0,
      });
      setImagePreview(null);
      setCoverImage(null);
      setDeleteConfirm(false);
      loadEventsList();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Delete failed."
      );
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 pb-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-md flex items-center gap-4">
              <Pencil className="h-10 w-10 text-[#14B8A6]" />
              Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Events</span>
            </h1>
            <p className="mt-3 text-base text-zinc-400 leading-relaxed">
              Select an event from your platform catalog to update parameters or manage its lifecycle.
            </p>
          </div>

          <button
            onClick={loadEventsList}
            disabled={fetchingList}
            className="self-start md:self-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all backdrop-blur-md"
          >
            <RefreshCw className={`h-4 w-4 ${fetchingList ? "animate-spin text-[#14B8A6]" : ""}`} />
            Refresh Events
          </button>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400 backdrop-blur-md">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 text-sm font-medium text-teal-400 backdrop-blur-md">
            {success}
          </div>
        )}

        {/* Section 1: Event Selector Component */}
        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#8e959b]">
                1. Select Event To Edit
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Choose an event from the dropdown selector or search below.
              </p>
            </div>

            {/* Quick Dropdown Selector */}
            <div className="w-full md:w-80">
              <select
                value={selectedEventId || ""}
                onChange={(e) => handleSelectEvent(e.target.value)}
                disabled={fetchingList}
                className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3.5 text-sm text-white focus:border-[#14B8A6]/50 focus:outline-none transition-all [color-scheme:dark]"
              >
                <option value="">-- Pick an Event --</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    #{evt.id} - {evt.name || evt.title || "Unnamed Event"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box & Quick Cards Grid (Only visible if no event is currently active or switching) */}
          {!selectedEventId && (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search events by title or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl bg-black/40 border border-white/10 py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#14B8A6]/50 transition-all shadow-inner"
                />
              </div>

              {fetchingList ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
                  {filteredEvents.map((evt) => {
                    const rawImg = evt.imageUrl || evt.coverImage || evt.image;
                    const cardImg = rawImg ? (rawImg.startsWith('http') ? rawImg : `${BASE_URL}${rawImg}`) : null;
                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => handleSelectEvent(evt.id)}
                        className="group text-left flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-[#14B8A6]/50 hover:bg-black/60 hover:shadow-[0_10px_30px_rgba(20,184,166,0.15)]"
                      >
                        {/* Event Image Banner */}
                        <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                          {cardImg ? (
                            <img
                              src={cardImg}
                              alt={evt.name || evt.title || "Event"}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-900/40 via-zinc-900 to-black">
                              <CalendarIcon className="h-10 w-10 text-teal-500/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          
                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                            <span className="rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-teal-400 border border-teal-500/30">
                              ID: #{evt.id}
                            </span>
                            {evt.isClosed && (
                              <span className="rounded-full bg-red-500/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="flex flex-col justify-between flex-1 p-5 space-y-4">
                          <div>
                            <h4 className="text-lg font-bold tracking-tight text-white group-hover:text-[#14B8A6] transition-colors line-clamp-1">
                              {evt.name || evt.title || "Unnamed Event"}
                            </h4>
                            <div className="mt-3 space-y-2 text-xs text-zinc-400">
                              <p className="flex items-center gap-2">
                                <CalendarIcon className="h-3.5 w-3.5 text-[#14B8A6] shrink-0" />
                                <span>{evt.eventDate ? new Date(evt.eventDate).toLocaleDateString() : "TBA"}</span>
                              </p>
                              <p className="flex items-center gap-2 line-clamp-1">
                                <MapPin className="h-3.5 w-3.5 text-[#14B8A6] shrink-0" />
                                <span>{evt.venue || evt.location || "TBA"}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs font-bold text-[#14B8A6] group-hover:translate-x-1 transition-transform">
                            <span>Select to Edit</span>
                            <span>&rarr;</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {filteredEvents.length === 0 && (
                    <div className="col-span-full py-16 text-center text-sm text-zinc-500">
                      No matching events found.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Edit Form (Visible once event selected) */}
        {selectedEventId && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Active Selected Event Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/5 p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B8A6]/20 text-[#14B8A6] font-bold">
                  #{selectedEventId}
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-widest text-[#14B8A6]">Currently Editing Event</p>
                  <h3 className="text-lg font-bold text-white">{formData.name || "Event #" + selectedEventId}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEventId(null)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Change Selected Event
              </button>
            </div>

            {loadingEvent ? (
              <div className="flex items-center justify-center py-20 rounded-[2.5rem] border border-white/5 bg-white/[0.02]">
                <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Cover Image Upload */}
                <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden p-8 lg:p-10">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[#8e959b] mb-4">
                    Update Cover Image
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
                          Click to upload new image
                        </p>
                        <p className="text-xs">Supports JPG, PNG, WEBP (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Core Event Fields */}
                <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-8 lg:p-10">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[#8e959b] mb-6">
                    Core Details
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
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white focus:border-[#14B8A6]/50 focus:outline-none transition-all shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
                          Date & Time
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
                            className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white focus:border-[#14B8A6]/50 focus:outline-none transition-all shadow-inner [color-scheme:dark]"
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
                            className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white focus:border-[#14B8A6]/50 focus:outline-none transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category */}
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

                    {/* Pricing */}
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
                              className="w-full rounded-2xl border border-white/10 bg-black/40 pl-12 pr-4 py-4 text-sm text-white focus:border-[#14B8A6]/50 focus:outline-none transition-all shadow-inner"
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
                              className="w-full rounded-2xl border border-yellow-500/20 bg-black/40 pl-12 pr-4 py-4 text-sm text-white focus:border-yellow-500/50 focus:outline-none transition-all shadow-inner"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Event Lock Status */}
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
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white focus:border-[#e8cd51]/50 focus:outline-none transition-all shadow-inner"
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
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white focus:border-[#e8cd51]/50 focus:outline-none transition-all shadow-inner"
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
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white focus:border-[#e8cd51]/50 focus:outline-none transition-all shadow-inner pr-10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions: Save & Delete */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className={`flex items-center gap-2 rounded-full px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                        deleteConfirm
                          ? "bg-red-500 text-white hover:bg-red-400"
                          : "border border-red-500/40 bg-red-500/10 text-red-400 hover:border-red-500 hover:bg-red-500/20"
                      }`}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {deleteConfirm ? "Confirm Delete Event" : "Delete Event"}
                    </button>

                    {deleteConfirm && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(false)}
                        className="text-xs text-zinc-500 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex min-w-[200px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E] px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
