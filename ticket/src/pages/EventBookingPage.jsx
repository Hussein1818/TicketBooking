import { Calendar, MapPin, Clock, Loader2 } from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import { createBooking, cancelBooking, checkoutWallet, checkoutMock, getErrorMessage } from "../services/bookingsApi";
import { validatePromoCode } from "../services/promoCodesApi";

const COL_LETTERS = ["A","B","C","D","E","F","G","H","J","K","L","M"];
const COLS = 6;

// ── Seat map helpers ──────────────────────────────────────────────
function toRows(list, cols = COLS) {
  const rows = [];
  for (let i = 0; i < list.length; i += cols) rows.push(list.slice(i, i + cols));
  return rows;
}

function SeatBtn({ seat, rowIdx, colIdx, selectedIds, toggleSeat, isUnavailable, seatLoading }) {
  const loading = seatLoading?.[seat.id];
  const unavailable = isUnavailable(seat);
  const selected    = selectedIds.includes(seat.id);
  const isVip       = seat.isVip || seat.seatType === "VIP" || seat.type === "VIP" || String(seat.seatNumber || "").toUpperCase().includes("VIP") || String(seat.id || "").toUpperCase().includes("VIP");
  const colLetter   = COL_LETTERS[colIdx] ?? String(colIdx);
  const label       = seat.seatNumber != null ? String(seat.seatNumber) : `${colLetter}${rowIdx + 1}`;

  let btnCls = "bg-teal-400 hover:scale-110 hover:brightness-110 cursor-pointer";
  let baseCls = "bg-teal-700";
  if (isVip && !unavailable && !selected) { btnCls = "bg-[#e8cd51] hover:scale-110 hover:brightness-110 cursor-pointer"; baseCls = "bg-yellow-600"; }
  if (unavailable && !selected) { btnCls = "bg-zinc-700 cursor-not-allowed opacity-50"; baseCls = "bg-zinc-600"; }
  if (selected)    { btnCls = "bg-white shadow-[0_0_14px_rgba(255,255,255,0.55)] scale-105 cursor-pointer"; baseCls = "bg-zinc-300"; }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        {rowIdx === 0 && <span className="text-[9px] font-bold text-transparent mb-1 w-8 text-center">{colLetter}</span>}
        <div className="w-8 h-8 rounded-t-lg rounded-b-sm flex items-center justify-center bg-zinc-800">
          <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
        </div>
        <div className="h-1 w-6 rounded-b bg-zinc-700" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      {rowIdx === 0 && (
        <span className="text-[9px] font-bold text-zinc-600 mb-1 w-8 text-center">{colLetter}</span>
      )}
      <button
        type="button"
        onClick={() => toggleSeat(seat)}
        disabled={unavailable && !selected}
        title={`${label}${isVip ? " — VIP" : ""}`}
        className={`w-8 h-8 rounded-t-lg rounded-b-sm flex items-center justify-center text-[9px] font-bold text-[#111214] transition-all duration-150 ${btnCls}`}
      >
        {selected ? "✓" : unavailable ? "✕" : label}
      </button>
      <div className={`h-1 w-6 rounded-b ${baseCls}`} />
    </div>
  );
}

function SeatSection({ title, seatList, accent, selectedIds, toggleSeat, isUnavailable, seatLoading }) {
  if (!seatList.length) return null;
  const rows = toRows(seatList);
  return (
    <div className="mb-8 w-full">
      <div className={`mx-auto mb-5 w-fit rounded-full border px-4 py-1 text-[10px] font-bold uppercase tracking-widest ${accent}`}>
        {title}
      </div>
      <div className="flex flex-col items-center gap-3">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-end gap-2">
            <span className="w-5 text-right text-[9px] font-bold text-zinc-600 pb-2">{ri + 1}</span>
            {row.map((seat, ci) => (
              <SeatBtn
                key={seat.id ?? `${ri}-${ci}`}
                seat={seat} rowIdx={ri} colIdx={ci}
                selectedIds={selectedIds} toggleSeat={toggleSeat} isUnavailable={isUnavailable}
                seatLoading={seatLoading}
              />
            ))}
            <span className="w-5 text-[9px] font-bold text-zinc-600 pb-2">{ri + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EventBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  const [seats, setSeats]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [lockedBookings, setLockedBookings]   = useState({});
  const [seatLoading, setSeatLoading]         = useState({});
  const [promoCode, setPromoCode]       = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);

  const username = useMemo(() => user?.username || user?.userName || user?.email || "", [user]);
  const userId   = useMemo(() => user?.id || user?.userId || username, [user, username]);

  const [eventDetails, setEventDetails]       = useState(null);

  const resolveImg = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const BASE = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";
    return `${BASE}${url}`;
  };

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";
    const fetchEventDetails = async () => {
      try {
        const res = await axios.get(`${BASE}/api/Events/${id || 1}`);
        setEventDetails(res.data);
      } catch (e) {
        console.error("Failed to fetch event details", e);
      }
    };
    const fetchSeats = async () => {
      try {
        const res  = await axios.get(`${BASE}/api/Events/${id || 1}/seats`);
        const data = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || []);
        setSeats(data);
      } catch (e) {
        setError(getErrorMessage(e, "Failed to load seats."));
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
    fetchSeats();
  }, [id]);

  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    let timer;
    if (selectedSeatIds.length > 0 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setSelectedSeatIds([]);
      setLockedBookings({});
      setError("Cart expired! Seats have been released.");
      setTimeLeft(300);
    }
    return () => clearInterval(timer);
  }, [selectedSeatIds.length, timeLeft]);

  useEffect(() => {
    if (selectedSeatIds.length === 0) {
      setTimeLeft(300);
    }
  }, [selectedSeatIds.length]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isUnavailable = (seat) =>
    seat.status === "Booked" || seat.status === "Locked" || seat.isAvailable === false || seat.isBooked;

  const toggleSeat = async (seat) => {
    if (isUnavailable(seat) && !selectedSeatIds.includes(seat.id)) return;
    if (!seat.id) return;
    if (!token) { setError("You need to sign in first."); return; }

    const isSelected = selectedSeatIds.includes(seat.id);
    
    setSeatLoading(prev => ({ ...prev, [seat.id]: true }));
    setError("");

    try {
      if (isSelected) {
        const bookingId = lockedBookings[seat.id];
        if (bookingId) {
          await cancelBooking(bookingId, token);
        }
        setSelectedSeatIds(prev => prev.filter(id => id !== seat.id));
        setLockedBookings(prev => {
          const newObj = { ...prev };
          delete newObj[seat.id];
          return newObj;
        });
      } else {
        const booking = await createBooking({ seatId: seat.id, userId: userId || username || "user" }, token);
        const bookingId = booking?.bookingId || booking?.id || booking;
        
        setSelectedSeatIds(prev => [...prev, seat.id]);
        if (bookingId && typeof bookingId !== "object") {
           setLockedBookings(prev => ({ ...prev, [seat.id]: bookingId }));
        }
      }
    } catch (e) {
      setError(getErrorMessage(e, isSelected ? "Failed to unselect seat." : "Failed to lock seat. It might be taken."));
    } finally {
      setSeatLoading(prev => ({ ...prev, [seat.id]: false }));
    }
  };

  const handleCheckout = async (type) => {
    if (!selectedSeatIds.length) { setError("Select at least one seat."); return; }
    if (!token)                  { setError("You need to sign in first."); return; }
    setError(""); setSuccess(""); setActionLoading(true);
    try {
      const bookingIds = selectedSeatIds.map(id => lockedBookings[id]).filter(Boolean);

      if (type === "mock") {
        await checkoutMock(token);
        setSuccess("Mock checkout completed.");
        setSelectedSeatIds([]); setLockedBookings({}); setPromoCode("");
        navigate("/tickets");
      } else if (type === "wallet") {
        if (!bookingIds.length) throw new Error("No locked bookings found to checkout.");
        const r = await checkoutWallet({ bookingIds, username: username || "user", promoCode: promoCode || "" }, token);
        
        if (r instanceof Blob) {
          const url = window.URL.createObjectURL(new Blob([r]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `Tickets-${Date.now()}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          setSuccess("Wallet checkout completed. Tickets downloaded!");
        } else {
          setSuccess(typeof r === "string" ? r : "Wallet checkout completed.");
        }
        
        setSelectedSeatIds([]); setLockedBookings({}); setPromoCode("");
        navigate("/tickets");
      }
    } catch (e) {
      setError(getErrorMessage(e, "Checkout failed."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoMessage("");
    try {
      const data = await validatePromoCode(promoCode, token);
      setPromoMessage(typeof data === "string" ? data : "Promo code applied!");
      if (typeof data === "number" || (data && data.discountPercentage)) {
        setPromoDiscount(typeof data === "number" ? data : data.discountPercentage);
      }
    } catch (e) {
      setPromoMessage("Invalid promo code.");
      setPromoDiscount(0);
    }
  };

  // split seats by type
  const isVipSeatCheck = (s) => s.isVip || s.seatType === "VIP" || s.type === "VIP" || String(s.seatNumber || "").toUpperCase().includes("VIP") || String(s.id || "").toUpperCase().includes("VIP");
  const vipSeats     = seats.filter(isVipSeatCheck);
  const regularSeats = seats.filter(s => !isVipSeatCheck(s));

  // total price
  const selectedSeats = seats.filter(s => selectedSeatIds.includes(s.id));
  const totalPrice    = selectedSeats.reduce((sum, s) => sum + (s.price ?? s.pricePerSeat ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col xl:flex-row -mx-4 md:-mx-8 -my-6 md:-my-10">

        {/* ── Left: Seat Map ── */}
        <div className="flex-1 flex flex-col p-6 lg:p-10 border-r border-white/5 bg-[#0a0a0c]">
          {success && (
            <div className="mb-6 rounded-xl border border-teal-500/40 bg-teal-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
              <span className="text-sm font-medium text-teal-400">{success}</span>
              <Link to="/tickets" className="whitespace-nowrap rounded bg-teal-400 px-5 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-teal-300 transition-colors">
                View My Tickets
              </Link>
            </div>
          )}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl lg:text-[38px] font-bold text-white tracking-tight mb-2 uppercase">
                {eventDetails?.name || eventDetails?.title || "Seat Selection"}
              </h1>
              <div className="flex items-center gap-5 text-[12px] font-medium text-zinc-400">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-400/80" />
                  {eventDetails?.eventDate ? new Date(eventDetails.eventDate).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" }) : "Live Selection"}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400/80" />
                  {eventDetails?.venue || eventDetails?.location || "Interactive Map"}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-[#141517] px-5 py-3 min-w-[130px]">
              <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Cart Timer</span>
              <div className={`flex items-center gap-2 ${timeLeft <= 60 && timeLeft > 0 ? "text-red-400" : "text-teal-400"}`}>
                <Clock className="w-4 h-4" /><span className="text-xl font-bold tracking-tight">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Seat map card */}
          <div className="flex-1 rounded-xl border border-white/5 bg-[#141517] p-6 flex flex-col min-h-[400px]">
            <div className="flex flex-col h-full w-full">
              {/* Stage bar */}
              <div className="w-full max-w-xl mx-auto mb-6">
                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-transparent via-teal-400/50 to-transparent blur-[1px]" />
                <p className="mt-2 text-center text-[9px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Front of Arena — Stage</p>
              </div>

              {/* Legend */}
            <div className="flex justify-center gap-5 mb-6 flex-wrap">
              {[
                { cls: "bg-teal-400",  label: "Available" },
                { cls: "bg-[#e8cd51]", label: "VIP" },
                { cls: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]", label: "Selected" },
                { cls: "bg-zinc-700 opacity-50", label: "Taken" },
              ].map(({ cls, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span className={`inline-block h-3 w-3 rounded-sm ${cls}`} /> {label}
                </span>
              ))}
            </div>

            {/* Seats */}
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
              </div>
            ) : seats.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-zinc-500">No seats available for this event.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center overflow-y-auto flex-1 py-2 custom-scrollbar gap-4">
                <SeatSection
                  title="⭐ VIP Section"
                  seatList={vipSeats}
                  accent="border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                  selectedIds={selectedSeatIds} toggleSeat={toggleSeat} isUnavailable={isUnavailable}
                  seatLoading={seatLoading}
                />
                {/* divider between sections */}
                {vipSeats.length > 0 && regularSeats.length > 0 && (
                  <div className="w-full max-w-md border-t border-dashed border-white/10 my-2" />
                )}
                <SeatSection
                  title="Regular Section"
                  seatList={regularSeats}
                  accent="border-teal-500/30 bg-teal-500/10 text-teal-400"
                  selectedIds={selectedSeatIds} toggleSeat={toggleSeat} isUnavailable={isUnavailable}
                  seatLoading={seatLoading}
                />
              </div>
            )}
            </div>
          </div>
        </div>


        {/* ── Right: Summary ── */}
        <div className="w-full xl:w-[380px] flex flex-col border-l border-white/5 bg-[#111214]">
          <div className="p-8 border-b border-white/5 flex-1">
            <h2 className="text-xl font-medium tracking-tight text-white mb-6">Order Summary</h2>

            {selectedSeats.length === 0 ? (
              <p className="text-sm text-zinc-500 mt-2">No seats selected yet.</p>
            ) : (
              <div className="space-y-2 mb-6">
                {selectedSeats.map((s) => {
                  const isVip = s.isVip || s.seatType === "VIP" || s.type === "VIP";
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-[#16171a] px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isVip ? "bg-[#e8cd51]" : "bg-teal-400"}`} />
                        <span className="text-sm text-white">
                          Seat {s.seatNumber ?? s.id} {isVip && <span className="text-[9px] font-bold text-yellow-400 ml-1">VIP</span>}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-zinc-300">
                        {(s.price ?? s.pricePerSeat) ? `EGP ${Number(s.price ?? s.pricePerSeat).toLocaleString()}` : "—"}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between border-t border-white/5 pt-3 mt-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Total</span>
                  <span className="text-sm font-bold text-white">EGP {totalPrice.toLocaleString()}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between pt-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-teal-400">Discount ({promoDiscount}%)</span>
                    <span className="text-sm font-bold text-teal-400">- EGP {((totalPrice * promoDiscount) / 100).toLocaleString()}</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between pt-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-white">New Total</span>
                    <span className="text-sm font-bold text-white">EGP {(totalPrice - (totalPrice * promoDiscount) / 100).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <input type="text" placeholder="Promo code (optional)" value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 w-full rounded border border-white/10 bg-[#1a1b1f] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500/50" />
              <button type="button" onClick={handleApplyPromo} className="rounded bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20 transition-colors">
                Apply
              </button>
            </div>
            {promoMessage && <p className={`mt-2 text-xs ${promoMessage.toLowerCase().includes('invalid') ? 'text-red-400' : 'text-teal-400'}`}>{promoMessage}</p>}
            {error   && <p className="mt-4 text-sm text-red-400">{error}</p>}
            {success && (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-sm text-teal-400">{success}</p>
                <Link to="/tickets" className="flex w-full items-center justify-center rounded border border-teal-500/30 bg-teal-500/10 py-2.5 text-[11px] font-bold uppercase tracking-widest text-teal-400 transition-colors hover:bg-teal-500/20">
                  View My Tickets
                </Link>
              </div>
            )}
          </div>

          <div className="p-8 space-y-3">
            <button type="button" onClick={() => handleCheckout("mock")}
              disabled={actionLoading || !selectedSeatIds.length}
              className="w-full rounded bg-teal-400 py-3 text-sm font-bold tracking-widest text-black uppercase transition hover:bg-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.3)] disabled:opacity-60">
              {actionLoading ? "Processing..." : "Checkout — Mock"}
            </button>
            <button type="button" onClick={() => handleCheckout("wallet")}
              disabled={actionLoading || !selectedSeatIds.length}
              className="w-full rounded bg-white py-3 text-sm font-bold tracking-widest text-[#0e1011] uppercase transition hover:bg-zinc-200 disabled:opacity-60">
              {actionLoading ? "Processing..." : "Checkout — Wallet"}
            </button>

          </div>
        </div>

      </div>

      {/* Floating Checkout Bar for Mobile/Tablet */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-teal-500/30 bg-[#16171a]/95 p-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl xl:hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex w-full sm:w-auto flex-col items-center sm:items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{selectedSeatIds.length} Seat{selectedSeatIds.length > 1 ? 's' : ''} Selected</span>
            <span className="text-lg font-bold text-white">EGP {totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={() => handleCheckout("mock")}
              disabled={actionLoading}
              className="flex-1 whitespace-nowrap rounded bg-teal-400 px-5 py-2.5 text-[11px] font-bold tracking-widest text-black uppercase transition hover:bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.3)] disabled:opacity-60"
            >
              {actionLoading ? "Wait..." : "Mock Buy"}
            </button>
            <button
              onClick={() => handleCheckout("wallet")}
              disabled={actionLoading}
              className="flex-1 whitespace-nowrap rounded bg-white px-5 py-2.5 text-[11px] font-bold tracking-widest text-black uppercase transition hover:bg-zinc-200 disabled:opacity-60"
            >
              {actionLoading ? "Wait..." : "Wallet"}
            </button>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
