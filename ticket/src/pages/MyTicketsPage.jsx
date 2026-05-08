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
        const BASE = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";
        const res = await fetch(`${BASE}/api/Events`).then(r => r.json());
        setEvents(Array.isArray(res) ? res : (res?.items || res?.data || []));
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
        { bookingId, fromUsername: username, toUsername },
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
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-white">
            Tickets & ID
          </h1>
          <p className="max-w-xl text-sm text-zinc-400 leading-relaxed">
            Manage your event access and secure fan identity from one
            centralized command center.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/booking/validate"
              className="rounded border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
            >
              Validate QR
            </Link>
            <Link
              to="/booking/scan"
              className="rounded border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
            >
              Scan QR
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 rounded border border-teal-500/40 bg-teal-500/10 px-4 py-3 text-sm text-teal-400">
            {success}
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column - Profile & Wallet */}
          <div className="flex flex-col gap-6 lg:col-span-4 mx-auto lg:mx-0 w-full max-w-sm sm:max-w-md lg:max-w-sm">
            {/* Identity Card */}
            <div className="relative rounded-3xl bg-[#1a1b1f] w-full max-w-sm flex flex-col overflow-hidden">
              <div className="p-6 lg:p-8 pb-6 flex flex-col items-center">
                {/* Photo + Verified */}
                <div className="flex justify-center relative w-full mb-4">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-zinc-800 ring-2 ring-white/10 shadow-xl mx-auto">
                    {profileLoading ? (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                        <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                      </div>
                    ) : (
                      <img
                        src={resolveImg(profile?.profilePictureUrl || profile?.profilePicture || user?.profilePictureUrl)}
                        alt={profile?.firstName || username}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="absolute top-0 right-1/2 -mr-16 bg-[#141517] rounded-full px-2 py-1 flex items-center gap-1.5 border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                    <span className="text-[9px] font-bold tracking-widest text-teal-400 uppercase">Verified</span>
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-xl font-bold text-white tracking-tight text-center w-full mb-1">
                  {profileLoading ? (
                    <span className="inline-block w-24 h-5 bg-zinc-800 rounded animate-pulse"></span>
                  ) : (
                    profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}` : username
                  )}
                </h2>

                {/* ID */}
                <p className="text-xs font-bold tracking-widest text-[#5c6870] uppercase font-mono w-full text-center overflow-hidden text-ellipsis whitespace-nowrap">
                  {profileLoading ? (
                    <span className="inline-block w-20 h-3 bg-zinc-800 rounded animate-pulse"></span>
                  ) : (
                    `ID: ${(profile?.id || user?.id || "N/A").toString().slice(0, 12)}...`
                  )}
                </p>
              </div>

              {/* TICKET DIVIDER */}
              <div className="relative flex items-center justify-center w-full h-8 z-10">
                 <div className="absolute -left-4 w-8 h-8 rounded-full bg-[#111214] shadow-inner" />
                 <div className="absolute -right-4 w-8 h-8 rounded-full bg-[#111214] shadow-inner" />
                 <div className="w-[calc(100%-40px)] border-t-[2px] border-dashed border-white/10 opacity-60" />
              </div>

              <div className="p-6 lg:p-8 pt-4 flex flex-col items-center bg-black/10 flex-1">
                {/* Badges */}
                <div className="space-y-2 w-full mb-6">
                  <div className="flex items-center gap-3 rounded-lg bg-[#212328] border border-white/5 px-3 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-xs font-bold tracking-widest text-white uppercase">Photo Auth</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-[#212328] border border-white/5 px-3 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-xs font-bold tracking-widest text-white uppercase">National ID</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-white py-3 text-xs font-bold tracking-widest uppercase text-black transition-colors hover:bg-zinc-200 disabled:opacity-60 cursor-pointer"
                >
                  {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloadingPdf ? "Generating..." : "Download Fan ID"}
                </button>
              </div>
            </div>

            {/* Secure Wallet Card */}
            <div className="rounded-xl border border-[#ffffff0a] bg-[#1a1b1f] p-6 lg:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#a88832]" />
                <h3 className="text-xs font-bold tracking-widest text-white uppercase">
                  Secure Wallet
                </h3>
              </div>
              <p className="mb-6 text-xs leading-relaxed text-zinc-400">
                Your Fan ID and tickets are encrypted using Obsidian Velocity's
                proprietary quantum-safe architecture.
              </p>
              <div className="flex gap-1.5 w-full">
                <div className="h-1 flex-1 rounded-full bg-teal-400"></div>
                <div className="h-1 flex-1 rounded-full bg-teal-400"></div>
                <div className="h-1 flex-1 rounded-full bg-teal-400"></div>
                <div className="h-1 flex-1 rounded-full bg-[#2a2c31]"></div>
              </div>
            </div>
          </div>

          {/* Right Column - Tickets List */}
          <div className="lg:col-span-8">
            <div className="mb-6 flex items-center justify-between pt-2">
              <h2 className="text-xl font-medium tracking-tight text-white">
                Active Tickets
              </h2>
              {loading && (
                <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
              )}
            </div>

            <div className="space-y-4">
              {!loading && tickets.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-[#1a1b1f] p-8 text-center text-zinc-400">
                  No tickets found.
                </div>
              )}
              {tickets.map((ticket, index) => {
                const bookingId = ticket.bookingId || ticket.id || index;
                const eventName =
                  ticket.eventName || ticket.name || "Event Ticket";
                const when =
                  ticket.eventDate || ticket.date || ticket.createdAt;
                const seat =
                  ticket.seatNumber || ticket.seat || ticket.seatId || "-";
                  
                const matchedEvent = events.find(e => e.id === ticket.eventId || e.name === ticket.eventName || e.title === ticket.eventName);
                const eventImage = resolveImg(matchedEvent?.imageUrl || ticket.imageUrl || ticket.event?.imageUrl || ticket.eventImage);

                return (
                  <div
                    key={bookingId}
                    className="relative flex flex-col overflow-hidden rounded-3xl min-h-[180px] bg-[#1a1b1f]"
                  >
                    {/* Background Image */}
                    <div 
                      className="absolute inset-0 z-0 bg-cover bg-center opacity-40 pointer-events-none"
                      style={{ backgroundImage: `url(${eventImage})` }}
                    />
                    {/* Dark Overlay for Readability */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#1a1b1f] via-[#1a1b1f]/95 to-[#1a1b1f]/80 pointer-events-none" />

                    {/* TOP SECTION (Info + QR) */}
                    <div className="relative z-10 flex flex-1 flex-col p-6 lg:p-8 pb-4">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="mb-1.5 text-2xl font-bold tracking-tight text-white pr-4">
                            {eventName}
                          </h3>
                          <div className="flex items-center text-xs font-medium text-zinc-400">
                            <Calendar className="mr-1.5 w-3.5 h-3.5" />
                            {when ? new Date(when).toLocaleString() : "TBA"}
                          </div>
                        </div>
                        <span className="rounded bg-teal-500/10 border border-teal-500/20 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#30d8c0]">
                          Booking #{bookingId}
                        </span>
                      </div>
                      <div className="flex items-end justify-between mt-auto pt-4">
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-[#5c6870] uppercase mb-1">
                            Seat
                          </p>
                          <p className="text-xl font-bold text-white">{seat}</p>
                        </div>
                        <div className="rounded-lg bg-white p-2 flex items-center justify-center shadow-lg">
                          <QRCodeSVG
                            value={ticket.qrData || ticket.qrCode || String(bookingId)}
                            size={64}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </div>
                    </div>

                    {/* TICKET DIVIDER */}
                    <div className="relative flex items-center justify-center w-full h-8 z-10">
                       <div className="absolute -left-4 w-8 h-8 rounded-full bg-[#111214] shadow-inner" />
                       <div className="absolute -right-4 w-8 h-8 rounded-full bg-[#111214] shadow-inner" />
                       <div className="w-[calc(100%-40px)] border-t-[2px] border-dashed border-white/10 opacity-60" />
                    </div>

                    {/* BOTTOM SECTION (Actions) */}
                    <div className="relative z-10 p-6 lg:p-8 pt-4 bg-black/20">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleTransfer(ticket)}
                          disabled={actionLoadingId === bookingId}
                          className="flex-1 flex items-center justify-center gap-2 rounded border border-[#ffffff0a] bg-[#212328] py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/5 disabled:opacity-60"
                        >
                          <Send className="w-3.5 h-3.5" /> Transfer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(ticket)}
                          disabled={actionLoadingId === bookingId}
                          className="flex-1 flex items-center justify-center gap-2 rounded border border-red-500/30 bg-red-500/10 py-3 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
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
