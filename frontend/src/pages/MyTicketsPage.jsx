import { Shield, Send, Calendar, Loader2, XCircle, CheckCircle2, Download } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useEffect, useState } from "react";
import useAuthStore from "../store/useAuthStore";
import useAlertStore from "../store/useAlertStore";
import {
  cancelBooking,
  getErrorMessage,
  getMyTickets,
  transferBooking,
} from "../services/bookingsApi";
import { getProfile, downloadFanId } from "../services/usersApi";
import { getEvents } from "../services/eventsApi";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

export default function MyTicketsPage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const username = user?.username || user?.userName || user?.email || "";
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resolveImg = (url) => {
    if (!url) return "https://images.unsplash.com/photo-1549646845-a982dfb14a22?q=80&w=400&auto=format&fit=crop";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    const BASE = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";
    return `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getMyTickets(token);
        let parsed = response;
        if (typeof response === "string") {
          try {
            parsed = JSON.parse(response);
          } catch (e) {
            console.error("Failed to parse tickets JSON", e);
          }
        }
        const list = Array.isArray(parsed)
          ? parsed
          : parsed?.items || parsed?.data || [];
        setTickets(list);
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, "Failed to fetch your tickets."));
      } finally {
        setLoading(false);
      }
    };

    const fetchProfileData = async () => {
      setProfileLoading(true);
      try {
        const data = await getProfile(token);
        setProfile(data);
      } catch (e) {
        console.error("Failed to load profile", e);
      } finally {
        setProfileLoading(false);
      }
    };

    const fetchAllEvents = async () => {
      try {
        const data = await getEvents({ page: 1, pageSize: 100 });
        setEvents(Array.isArray(data) ? data : (data?.items || data?.data || []));
      } catch (e) {
        console.error("Failed to load events for images", e);
      }
    };

    if (token) {
      fetchTickets();
      fetchProfileData();
      fetchAllEvents();
    } else {
      setLoading(false);
      setProfileLoading(false);
    }
  }, [token]);

  const handleDownloadPdf = async () => {
    if (!token) return;
    setDownloadingPdf(true);
    setError("");
    setSuccess("");
    try {
      const blob = await downloadFanId(token);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `FanID_${username}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSuccess("Fan ID PDF downloaded successfully.");
    } catch (e) {
      setError(getErrorMessage(e, "Failed to download Fan ID PDF."));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCancel = async (ticket) => {
    const bookingId = ticket.bookingId || ticket.id;
    if (!bookingId) return;
    if (!window.confirm("Cancel this booking?")) return;
    setActionLoadingId(bookingId);
    setError("");
    setSuccess("");
    try {
      await cancelBooking(bookingId, token);
      setTickets((prev) =>
        prev.filter((t) => (t.bookingId || t.id) !== bookingId),
      );
      setSuccess("Booking cancelled successfully.");
    } catch (cancelError) {
      setError(getErrorMessage(cancelError, "Failed to cancel booking."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const showPrompt = useAlertStore((state) => state.showPrompt);

  const handleTransfer = async (ticket) => {
    const bookingId = ticket.bookingId || ticket.id;
    if (!bookingId) return;
    
    const toUsername = await showPrompt("Transfer Ticket", "Transfer to username:", "info");
    if (!toUsername) return;
    
    setActionLoadingId(bookingId);
    setError("");
    setSuccess("");
    try {
      await transferBooking(
        { bookingId, toUsername },
        token,
      );
      setSuccess("Ticket transferred successfully.");
    } catch (transferError) {
      setError(getErrorMessage(transferError, "Failed to transfer ticket."));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[0%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[700px] h-[700px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[0%] left-[20%] w-[600px] h-[600px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="mb-3 text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-md">
            Tickets & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">ID</span>
          </h1>
          <p className="max-w-xl text-base text-zinc-400 leading-relaxed">
            Manage your event access and secure fan identity from one centralized command center.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/booking/validate"
              className="rounded-full bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            >
              Validate QR
            </Link>
            <Link
              to="/booking/scan"
              className="rounded-full bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            >
              Scan QR
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-medium text-red-400 flex items-center gap-3 backdrop-blur-sm shadow-xl">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-8 rounded-[1.5rem] border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-6 py-4 text-sm font-medium text-[#14B8A6] flex items-center gap-3 backdrop-blur-sm shadow-xl">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Column - Profile & Wallet */}
          <div className="flex flex-col gap-8 lg:col-span-4 mx-auto lg:mx-0 w-full max-w-sm lg:max-w-full">
            {/* Identity Card */}
            <div 
              className="relative rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl w-full flex flex-col shadow-2xl group transition-all duration-500 hover:bg-white/[0.03]"
              style={{
                WebkitMaskImage: 'radial-gradient(circle at 0% calc(100% - 95px), transparent 16px, black 17px), radial-gradient(circle at 100% calc(100% - 95px), transparent 16px, black 17px)',
                WebkitMaskSize: '51% 100%',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'left top, right top',
                maskImage: 'radial-gradient(circle at 0% calc(100% - 95px), transparent 16px, black 17px), radial-gradient(circle at 100% calc(100% - 95px), transparent 16px, black 17px)',
                maskSize: '51% 100%',
                maskRepeat: 'no-repeat',
                maskPosition: 'left top, right top',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#14B8A6]/5 to-transparent pointer-events-none" />
              <div className="p-8 pb-6 flex flex-col items-center relative z-10">
                {/* Photo + Verified */}
                <div className="flex justify-center relative w-full mb-6 mt-4">
                  <div className="relative w-28 h-28 rounded-3xl overflow-hidden bg-black/40 ring-1 ring-white/10 shadow-[0_0_30px_rgba(20,184,166,0.15)] mx-auto group-hover:scale-105 transition-transform duration-500">
                    {profileLoading ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="w-6 h-6 text-[#14B8A6] animate-spin" />
                      </div>
                    ) : (
                      <img
                        src={resolveImg(profile?.profilePictureUrl || profile?.profilePicture || user?.profilePictureUrl)}
                        alt={profile?.firstName || username}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="absolute top-0 right-1/2 -mr-20 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-white/10 shadow-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse"></div>
                    <span className="text-[10px] font-bold tracking-widest text-[#14B8A6] uppercase">Verified</span>
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-2xl font-bold text-white tracking-tight text-center w-full mb-1">
                  {profileLoading ? (
                    <span className="inline-block w-24 h-6 bg-white/5 rounded-lg animate-pulse"></span>
                  ) : (
                    profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}` : username
                  )}
                </h2>

                {/* ID */}
                <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase font-mono w-full text-center overflow-hidden text-ellipsis whitespace-nowrap">
                  {profileLoading ? (
                    <span className="inline-block w-20 h-3 bg-white/5 rounded animate-pulse mt-2"></span>
                  ) : (
                    `ID: ${(profile?.id || user?.id || "N/A").toString().slice(0, 12)}...`
                  )}
                </p>
              </div>

              {/* TICKET DIVIDER */}
              <div className="relative flex items-center justify-center w-full h-8 opacity-40 z-10">
                 <div className="w-[calc(100%-60px)] border-t-[2px] border-dashed border-white/20" />
              </div>

              <div className="p-8 pt-4 flex flex-col items-center bg-black/20 flex-1 relative z-10">
                {/* Badges */}
                <div className="space-y-3 w-full mb-8 mt-2">
                  <div className="flex items-center gap-4 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 text-[#14B8A6] shrink-0 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                    <span className="text-xs font-bold tracking-widest text-zinc-300 uppercase">Photo Auth</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 text-[#14B8A6] shrink-0 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                    <span className="text-xs font-bold tracking-widest text-zinc-300 uppercase">National ID</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="w-full flex items-center justify-center gap-2 rounded-[1.5rem] bg-gradient-to-r from-[#14B8A6] to-[#0F766E] py-4 text-[11px] font-bold tracking-widest uppercase text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" strokeWidth={3} />}
                  {downloadingPdf ? "Generating..." : "Download Fan ID"}
                </button>
              </div>
            </div>            
          </div>

          {/* Right Column - Tickets List */}
          <div className="lg:col-span-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Active Tickets
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-[#14B8A6] border border-white/10">{tickets.length}</span>
              </h2>
              {loading && (
                <Loader2 className="w-6 h-6 text-[#14B8A6] animate-spin" />
              )}
            </div>

            <div className="space-y-6">
              {!loading && tickets.length === 0 && (
                <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-16 text-center shadow-2xl flex flex-col items-center">
                  <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center border border-white/5 mb-6">
                    <Calendar className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-lg text-zinc-400 font-medium">No active tickets found.</p>
                  <p className="text-sm text-zinc-500 mt-2">Book an event to see your tickets here.</p>
                </div>
              )}
              {tickets.map((ticket, index) => {
                const bookingId = ticket.bookingId || ticket.id || index;
                const eventName = ticket.eventName || ticket.name || "Event Ticket";
                const when = ticket.eventDate || ticket.date || ticket.createdAt;
                const seat = ticket.seatNumber || ticket.seat || ticket.seatId || "-";
                const amountPaid = ticket.amountPaid ?? ticket.price ?? null;
                  
                const matchedEvent = events.find(e => e.id === ticket.eventId || e.name === ticket.eventName || e.title === ticket.eventName);
                const eventImage = resolveImg(matchedEvent?.imageUrl || ticket.imageUrl || ticket.event?.imageUrl || ticket.eventImage);

                return (
                  <div
                    key={bookingId}
                    className="relative flex flex-col overflow-hidden rounded-[2.5rem] min-h-[220px] bg-white/[0.02] backdrop-blur-xl border border-white/5 shadow-2xl group transition-all duration-500 hover:bg-white/[0.03]"
                    style={{
                      WebkitMaskImage: 'radial-gradient(circle at 0% calc(100% - 90px), transparent 18px, black 19px), radial-gradient(circle at 100% calc(100% - 90px), transparent 18px, black 19px)',
                      WebkitMaskSize: '51% 100%',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'left top, right top',
                      maskImage: 'radial-gradient(circle at 0% calc(100% - 90px), transparent 18px, black 19px), radial-gradient(circle at 100% calc(100% - 90px), transparent 18px, black 19px)',
                      maskSize: '51% 100%',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'left top, right top',
                    }}
                  >
                    {/* Background Image & Glowing Overlay */}
                    <div 
                      className="absolute inset-0 z-0 bg-cover bg-center opacity-30 pointer-events-none scale-105 group-hover:scale-100 transition-transform duration-700"
                      style={{ backgroundImage: `url(${eventImage})` }}
                    />
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/95 via-black/80 to-transparent pointer-events-none" />
                    
                    {/* Color Glow */}
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#14B8A6]/30 blur-[100px] rounded-full pointer-events-none opacity-50"></div>

                    {/* TOP SECTION (Info + QR) */}
                    <div className="relative z-10 flex flex-1 flex-col p-8 lg:p-10 pb-6">
                      <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
                        <div className="max-w-[70%]">
                          <h3 className="mb-3 text-3xl font-bold tracking-tighter text-white drop-shadow-md">
                            {eventName}
                          </h3>
                          <div className="flex items-center text-sm font-medium text-zinc-300">
                            <Calendar className="mr-2 w-4 h-4 text-[#14B8A6]" />
                            {when ? new Date(when).toLocaleString() : "TBA"}
                          </div>
                        </div>
                        <span className="rounded-full bg-[#14B8A6]/10 border border-[#14B8A6]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#14B8A6] shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                          Booking #{String(bookingId).slice(-6)}
                        </span>
                      </div>
                      
                      <div className="flex items-end justify-between mt-auto pt-4">
                        <div className="flex gap-10">
                          <div>
                            <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-2">
                              Seat
                            </p>
                            <p className="text-2xl font-bold text-white drop-shadow-md">{seat}</p>
                          </div>
                          {amountPaid !== null && (
                            <div>
                              <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-2">
                                Paid
                              </p>
                              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E] drop-shadow-sm">
                                EGP {Number(amountPaid).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* QR Code Container */}
                        <div className="rounded-2xl bg-white p-3 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] ring-4 ring-white/10 group-hover:scale-105 transition-transform duration-500">
                          <QRCodeSVG
                            value={ticket.qrData || ticket.qrCode || String(bookingId)}
                            size={76}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </div>
                    </div>

                    {/* TICKET DIVIDER */}
                    <div className="relative flex items-center justify-center w-full h-8 opacity-30 z-10">
                       <div className="w-[calc(100%-80px)] border-t-[3px] border-dashed border-white/40" />
                    </div>

                    {/* BOTTOM SECTION (Actions) */}
                    <div className="relative z-10 p-8 pt-4 bg-black/40 backdrop-blur-md">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleTransfer(ticket)}
                          disabled={actionLoadingId === bookingId}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-4 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" /> Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(ticket)}
                          disabled={actionLoadingId === bookingId}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-4 text-[11px] font-bold uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/40 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
